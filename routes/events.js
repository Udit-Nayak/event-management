import express from "express";
import {
  createEvent,
  getEventDetails,
deleteEvent,
  updateEvent,
  registerUserToEvent,
  cancelRegistration,
  getUpcomingEvents,
  getEventStats
} from "../controllers/events.controller.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createEvent", authenticate, createEvent);
router.get("/upcoming", getUpcomingEvents);
router.delete("/events/:id", authenticate, deleteEvent);
router.put("/events/:id", authenticate, updateEvent);
router.get("/:id", getEventDetails);
router.post("/:id/register", authenticate, registerUserToEvent);
router.delete("/:id/cancel/:userId", authenticate, cancelRegistration);
router.get("/:id/stats", getEventStats);

export default router;
