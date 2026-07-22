// Group Controller — Ekub Group CRUD and member management
const { validationResult } = require("express-validator");
const prisma = require("../utils/prisma");

// ─────────────────────────────────────────────────────────────────
// POST /api/groups/create  (COLLECTOR only)
// ─────────────────────────────────────────────────────────────────
const createGroup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const {
      name, contribution_amount, cycle_frequency,
      max_members, start_date, selection_method,
      bank_name, account_number,
    } = req.body;

    const group = await prisma.ekubGroup.create({
      data: {
        name,
        admin_id: req.user.id,
        contribution_amount: parseFloat(contribution_amount),
        cycle_frequency,
        max_members: parseInt(max_members),
        start_date: new Date(start_date),
        selection_method,
        bank_name: bank_name || "CBE",
        account_number,
        status: "RECRUITING",
      },
    });

    return res.status(201).json({ message: "Ekub group created successfully.", group });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/groups/my-groups  (COLLECTOR only)
// ─────────────────────────────────────────────────────────────────
const getMyGroups = async (req, res, next) => {
  try {
    const groups = await prisma.ekubGroup.findMany({
      where: { admin_id: req.user.id },
      include: {
        _count: { select: { members: true, rounds: true } },
        rounds: {
          where: { status: "COLLECTING" },
          take: 1,
          orderBy: { round_number: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json({ groups });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/groups/join  (GIVER only)
// Body: { group_id }
// ─────────────────────────────────────────────────────────────────
const joinGroup = async (req, res, next) => {
  try {
    const { group_id } = req.body;
    const user_id = req.user.id;

    const group = await prisma.ekubGroup.findUnique({ where: { id: group_id } });
    if (!group) return res.status(404).json({ error: "Ekub group not found." });
    if (group.status !== "RECRUITING") {
      return res.status(400).json({ error: "This Ekub group is no longer accepting new members." });
    }

    const memberCount = await prisma.groupMember.count({ where: { group_id } });
    if (memberCount >= group.max_members) {
      return res.status(400).json({ error: "This Ekub group has reached its maximum member limit." });
    }

    const existing = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id, user_id } },
    });
    if (existing) return res.status(409).json({ error: "You are already a member of this group." });

    const membership = await prisma.groupMember.create({
      data: { group_id, user_id },
      include: { group: true },
    });

    return res.status(201).json({ message: `Joined "${group.name}" successfully.`, membership });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/groups/joined  (GIVER only)
// ─────────────────────────────────────────────────────────────────
const getJoinedGroups = async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { user_id: req.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            rounds: {
              where: { status: "COLLECTING" },
              take: 1,
              orderBy: { round_number: "asc" },
            },
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });
    return res.status(200).json({ memberships });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/groups/:id  (Both roles, must be member/admin)
// ─────────────────────────────────────────────────────────────────
const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await prisma.ekubGroup.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, full_name: true, phone_number: true, cbe_account: true } },
        members: {
          include: { user: { select: { id: true, full_name: true, phone_number: true } } },
        },
        rounds: { orderBy: { round_number: "asc" } },
        _count: { select: { members: true } },
      },
    });

    if (!group) return res.status(404).json({ error: "Group not found." });

    // Access control: must be admin or member
    const isAdmin = group.admin_id === req.user.id;
    const isMember = group.members.some((m) => m.user_id === req.user.id);

    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: "You do not have access to this group." });
    }

    return res.status(200).json({ group });
  } catch (error) {
    next(error);
  }
};

module.exports = { createGroup, getMyGroups, joinGroup, getJoinedGroups, getGroupById };
