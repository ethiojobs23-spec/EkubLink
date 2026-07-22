// Round Routes
const express = require("express");
const { createRound, runDraw, getActiveRound } = require("../controllers/round.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/create/:groupId", authenticate, authorize("COLLECTOR"), createRound);
router.post("/:roundId/draw", authenticate, authorize("COLLECTOR"), runDraw);
router.get("/:groupId/active", authenticate, getActiveRound);

module.exports = router;
