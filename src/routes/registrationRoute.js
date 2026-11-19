import express from "express";
import {
  registerAttendee,
  verifyTicket,
  getEventAttendees,
  getEventStaffActivity,
  verifyStaffTicket,
} from "../controllers/registrationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import staffAuthMiddleware from "../middleware/staffAuthMiddleware.js";

const router = express.Router();

// Public attendee registration route
router.post("/:eventId", registerAttendee);

// Protected ticket verification route
router.post("/:eventId/verify", authMiddleware, verifyTicket);

// Protected staff ticket verification route
router.post("/:eventId/staff-verify", staffAuthMiddleware, verifyStaffTicket);

// Protected event attendees route
router.get("/:eventId/attendees", authMiddleware, getEventAttendees);

// Protected event staff activity route
router.get("/:eventId/staff-activity", authMiddleware, getEventStaffActivity);

/**
 * @swagger
 * tags:
 *   name: Registrations
 *   description: Attendee registration, QR tickets and event check-in
 */

/**
 * @swagger
 * /api/registrations/{eventId}:
 *   post:
 *     summary: Register an attendee for an event
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendeeName
 *               - attendeeEmail
 *             properties:
 *               attendeeName:
 *                 type: string
 *               attendeeEmail:
 *                 type: string
 *               attendeePhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendee registered and ticket generated
 *       400:
 *         description: Registration failed
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/registrations/{eventId}/verify:
 *   post:
 *     summary: Verify an attendee ticket as an organiser
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket verified successfully
 *       400:
 *         description: Invalid or already-used ticket
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/registrations/{eventId}/staff-verify:
 *   post:
 *     summary: Verify an attendee ticket as assigned event staff
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket verified successfully
 *       400:
 *         description: Invalid or already-used ticket
 *       401:
 *         description: Staff authentication required
 */

/**
 * @swagger
 * /api/registrations/{eventId}/attendees:
 *   get:
 *     summary: Get attendees registered for an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event attendees retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/registrations/{eventId}/staff-activity:
 *   get:
 *     summary: Get staff check-in activity for an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff activity retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Event not found
 */

export default router;
