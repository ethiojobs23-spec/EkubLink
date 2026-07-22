// Group Routes
const express = require("express");
const { body } = require("express-validator");
const { createGroup, getMyGroups, joinGroup, getJoinedGroups, getGroupById } = require("../controllers/group.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const createGroupValidation = [
  body("name").isLength({ min: 3, max: 100 }).trim().withMessage("Group name must be 3-100 characters."),
  body("contribution_amount").isFloat({ min: 1 }).withMessage("Contribution amount must be a positive number."),
  body("cycle_frequency").isIn(["DAILY", "WEEKLY", "MONTHLY"]).withMessage("Invalid cycle frequency."),
  body("max_members").isInt({ min: 2, max: 500 }).withMessage("Max members must be between 2 and 500."),
  body("start_date").isISO8601().withMessage("Invalid start date format."),
  body("selection_method").isIn(["RANDOM", "FIXED_ORDER"]).withMessage("Invalid selection method."),
  body("account_number").notEmpty().withMessage("CBE account number is required."),
];

// COLLECTOR routes
router.post("/create", authenticate, authorize("COLLECTOR"), createGroupValidation, createGroup);
router.get("/my-groups", authenticate, authorize("COLLECTOR"), getMyGroups);

// GIVER routes
router.post("/join", authenticate, authorize("GIVER"), joinGroup);
router.get("/joined", authenticate, authorize("GIVER"), getJoinedGroups);

// Shared (both roles, access-controlled inside controller)
router.get("/:id", authenticate, getGroupById);

module.exports = router;
