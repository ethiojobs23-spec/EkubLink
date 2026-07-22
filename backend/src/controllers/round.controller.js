// Round Controller — Round management and lottery draw
const prisma = require("../utils/prisma");

// ─────────────────────────────────────────────────────────────────
// POST /api/rounds/create/:groupId  (COLLECTOR only)
// Creates the next round for an active Ekub group
// ─────────────────────────────────────────────────────────────────
const createRound = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { due_date } = req.body;
    const collector_id = req.user.id;

    const group = await prisma.ekubGroup.findUnique({
      where: { id: groupId },
      include: { rounds: { orderBy: { round_number: "desc" }, take: 1 } },
    });

    if (!group) return res.status(404).json({ error: "Group not found." });
    if (group.admin_id !== collector_id) {
      return res.status(403).json({ error: "Only the group collector can create rounds." });
    }
    if (group.status === "COMPLETED") {
      return res.status(400).json({ error: "This Ekub group is already completed." });
    }

    // Cannot create a new round if one is still in COLLECTING status
    const activeRound = await prisma.round.findFirst({
      where: { group_id: groupId, status: "COLLECTING" },
    });
    if (activeRound) {
      return res.status(400).json({ error: "A round is already in progress. Complete it before creating a new one." });
    }

    const nextRoundNumber = (group.rounds[0]?.round_number || 0) + 1;

    // Transition group to ACTIVE if it was RECRUITING
    const updates = [];
    if (group.status === "RECRUITING") {
      updates.push(prisma.ekubGroup.update({ where: { id: groupId }, data: { status: "ACTIVE" } }));
    }

    const round = await prisma.round.create({
      data: {
        group_id: groupId,
        round_number: nextRoundNumber,
        due_date: new Date(due_date),
        status: "COLLECTING",
      },
    });

    await Promise.all(updates);
    return res.status(201).json({ message: `Round ${nextRoundNumber} created successfully.`, round });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/rounds/:roundId/draw  (COLLECTOR only)
// Runs the lottery draw — only members with APPROVED payments enter
// ─────────────────────────────────────────────────────────────────
const runDraw = async (req, res, next) => {
  try {
    const { roundId } = req.params;
    const collector_id = req.user.id;

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        group: { include: { members: true } },
        payments: { where: { status: "APPROVED" }, include: { giver: true } },
      },
    });

    if (!round) return res.status(404).json({ error: "Round not found." });
    if (round.group.admin_id !== collector_id) {
      return res.status(403).json({ error: "Only the group collector can run the draw." });
    }
    if (round.status !== "COLLECTING") {
      return res.status(400).json({ error: `Round is already in ${round.status} status.` });
    }

    const approvedPayments = round.payments;

    if (approvedPayments.length === 0) {
      return res.status(400).json({ error: "No approved payments for this round. Cannot run the draw." });
    }

    // Filter out members who have already won
    const eligibleWinners = approvedPayments.filter((payment) => {
      const member = round.group.members.find((m) => m.user_id === payment.giver_id);
      return member && !member.has_won;
    });

    if (eligibleWinners.length === 0) {
      return res.status(400).json({ error: "All eligible members have already won. The Ekub is complete." });
    }

    // RANDOM selection
    let winner;
    if (round.group.selection_method === "RANDOM") {
      const randomIndex = Math.floor(Math.random() * eligibleWinners.length);
      winner = eligibleWinners[randomIndex];
    } else {
      // FIXED_ORDER — pick the one with the lowest fixed_order
      const memberOrders = await prisma.groupMember.findMany({
        where: {
          group_id: round.group_id,
          user_id: { in: eligibleWinners.map((p) => p.giver_id) },
          has_won: false,
          fixed_order: { not: null },
        },
        orderBy: { fixed_order: "asc" },
        take: 1,
      });
      if (memberOrders.length === 0) {
        return res.status(400).json({ error: "Cannot determine next winner by FIXED_ORDER. Check member order settings." });
      }
      winner = eligibleWinners.find((p) => p.giver_id === memberOrders[0].user_id);
    }

    // Update round, mark winner, update group member
    const [updatedRound] = await prisma.$transaction([
      prisma.round.update({
        where: { id: roundId },
        data: { winner_id: winner.giver_id, status: "DRAWN" },
        include: { winner: { select: { id: true, full_name: true, phone_number: true } } },
      }),
      prisma.groupMember.update({
        where: { group_id_user_id: { group_id: round.group_id, user_id: winner.giver_id } },
        data: { has_won: true, won_round_number: round.round_number },
      }),
    ]);

    // Check if all members have won — if so, complete the group
    const remainingWinners = await prisma.groupMember.count({
      where: { group_id: round.group_id, has_won: false },
    });
    if (remainingWinners === 0) {
      await prisma.ekubGroup.update({ where: { id: round.group_id }, data: { status: "COMPLETED" } });
    }

    return res.status(200).json({
      message: `🎉 Draw complete! Winner is ${updatedRound.winner.full_name}.`,
      round: updatedRound,
      winner: updatedRound.winner,
      poolAmount: round.group.contribution_amount * approvedPayments.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/rounds/:groupId/active
// ─────────────────────────────────────────────────────────────────
const getActiveRound = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const round = await prisma.round.findFirst({
      where: { group_id: groupId, status: "COLLECTING" },
      include: {
        group: { select: { name: true, contribution_amount: true, account_number: true, bank_name: true } },
        payments: true,
      },
      orderBy: { round_number: "asc" },
    });

    return res.status(200).json({ round: round || null });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRound, runDraw, getActiveRound };
