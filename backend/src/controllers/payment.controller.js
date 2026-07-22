// Payment Controller — CBE Receipt submission and verification
const path = require("path");
const fs = require("fs");
const prisma = require("../utils/prisma");

// ─────────────────────────────────────────────────────────────────
// POST /api/payments/submit
// GIVER submits their CBE receipt for a given round
// Body (multipart/form-data): round_id, cbe_ref_number, receipt (file)
// ─────────────────────────────────────────────────────────────────
const submitPayment = async (req, res, next) => {
  try {
    const { round_id, cbe_ref_number } = req.body;
    const giver_id = req.user.id;

    if (!round_id || !cbe_ref_number) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "round_id and cbe_ref_number are required." });
    }

    // Verify the round exists and is in COLLECTING status
    const round = await prisma.round.findUnique({
      where: { id: round_id },
      include: { group: true },
    });

    if (!round) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Round not found." });
    }

    if (round.status !== "COLLECTING") {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "This round is no longer accepting payments." });
    }

    // Verify the giver is a member of this group
    const membership = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: round.group_id, user_id: giver_id } },
    });

    if (!membership) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "You are not a member of this Ekub group." });
    }

    // Check if payment already submitted for this round
    const existing = await prisma.payment.findUnique({
      where: { round_id_giver_id: { round_id, giver_id } },
    });

    if (existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({
        error: "You have already submitted a payment for this round.",
        existingPayment: existing,
      });
    }

    // Build receipt URL
    const receipt_image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    if (!receipt_image_url) {
      return res.status(400).json({ error: "Receipt image is required." });
    }

    const payment = await prisma.payment.create({
      data: {
        round_id,
        giver_id,
        cbe_ref_number,
        receipt_image_url,
        status: "PENDING",
      },
      include: {
        giver: { select: { id: true, full_name: true, phone_number: true } },
        round: { select: { id: true, round_number: true, due_date: true } },
      },
    });

    return res.status(201).json({ message: "Payment receipt submitted successfully.", payment });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/payments/pending/:groupId
// COLLECTOR views all pending payments for a group
// ─────────────────────────────────────────────────────────────────
const getPendingPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const collector_id = req.user.id;

    // Verify this collector owns the group
    const group = await prisma.ekubGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (group.admin_id !== collector_id) {
      return res.status(403).json({ error: "You do not have permission to manage this group." });
    }

    // Get active round
    const activeRound = await prisma.round.findFirst({
      where: { group_id: groupId, status: "COLLECTING" },
      orderBy: { round_number: "asc" },
    });

    if (!activeRound) {
      return res.status(200).json({ payments: [], message: "No active round for this group." });
    }

    const payments = await prisma.payment.findMany({
      where: { round_id: activeRound.id, status: "PENDING" },
      include: {
        giver: { select: { id: true, full_name: true, phone_number: true } },
        round: { select: { id: true, round_number: true, due_date: true } },
      },
      orderBy: { submitted_at: "desc" },
    });

    return res.status(200).json({ payments, activeRound });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// PATCH /api/payments/:paymentId/review
// COLLECTOR approves or rejects a payment
// Body: { action: "APPROVED" | "REJECTED" }
// ─────────────────────────────────────────────────────────────────
const reviewPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body;
    const collector_id = req.user.id;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ error: "Action must be APPROVED or REJECTED." });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { round: { include: { group: true } } },
    });

    if (!payment) return res.status(404).json({ error: "Payment not found." });

    // Verify collector owns the group
    if (payment.round.group.admin_id !== collector_id) {
      return res.status(403).json({ error: "You do not have permission to review this payment." });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({ error: `Payment is already ${payment.status}.` });
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: action, reviewed_at: new Date() },
      include: {
        giver: { select: { id: true, full_name: true, phone_number: true } },
      },
    });

    return res.status(200).json({
      message: `Payment ${action.toLowerCase()} successfully.`,
      payment: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/payments/my-payments/:groupId
// GIVER checks their own payment history in a group
// ─────────────────────────────────────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const giver_id = req.user.id;

    const payments = await prisma.payment.findMany({
      where: {
        giver_id,
        round: { group_id: groupId },
      },
      include: {
        round: { select: { id: true, round_number: true, due_date: true, status: true } },
      },
      orderBy: { submitted_at: "desc" },
    });

    return res.status(200).json({ payments });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitPayment, getPendingPayments, reviewPayment, getMyPayments };
