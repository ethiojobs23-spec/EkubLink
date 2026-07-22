// Auth Routes
const express = require("express");
const { body } = require("express-validator");
const { signup, login, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

const signupValidation = [
  body("phone_number").matches(/^(\+251|0)(9|7)\d{8}$/).withMessage("Enter a valid Ethiopian phone number."),
  body("full_name").isLength({ min: 2, max: 100 }).trim().withMessage("Full name must be 2-100 characters."),
  body("role").isIn(["COLLECTOR", "GIVER"]).withMessage("Role must be COLLECTOR or GIVER."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
];

const loginValidation = [
  body("phone_number").notEmpty().withMessage("Phone number is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);
router.get("/me", authenticate, getMe);

module.exports = router;
