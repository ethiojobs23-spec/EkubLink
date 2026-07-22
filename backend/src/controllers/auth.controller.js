// Authentication Controller — Sign-Up & Login with strict role separation
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const prisma = require("../utils/prisma");

// ─── Helper: Generate JWT ──────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, phone_number: user.phone_number },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─── Helper: Safe User Response (strip password) ─────────────────
const sanitizeUser = (user) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Body: { phone_number, full_name, role, password, cbe_account? }
// ─────────────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { phone_number, full_name, role, password, cbe_account } = req.body;

    // Role guard: only allow valid roles
    if (!["COLLECTOR", "GIVER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be COLLECTOR or GIVER." });
    }

    // Check if phone already registered
    const existingUser = await prisma.user.findUnique({ where: { phone_number } });
    if (existingUser) {
      return res.status(409).json({ error: "This phone number is already registered." });
    }

    // COLLECTOR must provide their CBE account number
    if (role === "COLLECTOR" && !cbe_account) {
      return res.status(400).json({ error: "Collectors must provide their CBE account number." });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        phone_number,
        full_name,
        role,
        cbe_account: cbe_account || null,
        password_hash,
      },
    });

    const token = generateToken(user);

    // Determine redirect path based on role
    const redirectPath = role === "COLLECTOR" ? "/collector/dashboard" : "/giver/dashboard";

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: sanitizeUser(user),
      redirectPath,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { phone_number, password }
// ─────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { phone_number, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone_number } });

    // Use a generic error to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    const token = generateToken(user);
    const redirectPath = user.role === "COLLECTOR" ? "/collector/dashboard" : "/giver/dashboard";

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
      redirectPath,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/auth/me  (Protected)
// Returns the currently authenticated user profile
// ─────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        managed_groups: { where: { status: { not: "COMPLETED" } }, take: 5 },
        group_memberships: { include: { group: true }, take: 5 },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
