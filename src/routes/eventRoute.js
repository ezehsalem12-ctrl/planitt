import express from "express";

import {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  publishEvent,
  cancelEvent,
} from "../controllers/eventController.js";

import upload from "../middleware/uploadMiddleware.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllEvents);

// Organizer routes
router.get("/my-events", authMiddleware, getMyEvents);

router.post("/", authMiddleware, upload.single("image"), createEvent);

router.patch("/:id", authMiddleware, upload.single("image"), updateEvent);

router.patch("/:id/publish", authMiddleware, publishEvent);

router.patch("/:id/cancel", authMiddleware, cancelEvent);

// Public event details
router.get("/:id", getEventById);

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event creation, management and discovery
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all public events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of events per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search events by title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category
 *     responses:
 *       200:
 *         description: Public events retrieved successfully
 */

/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: Get events belonging to the logged-in organiser
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organiser events retrieved successfully
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - venue
 *               - address
 *               - startDate
 *               - endDate
 *               - registrationDeadline
 *               - capacity
 *               - ticketPrice
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               venue:
 *                 type: string
 *               address:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               ticketPrice:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               venue:
 *                 type: string
 *               address:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               ticketPrice:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{id}/publish:
 *   patch:
 *     summary: Publish an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event published successfully
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{id}/cancel:
 *   patch:
 *     summary: Cancel an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event cancelled successfully
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event details by ID or slug
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID or slug
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       404:
 *         description: Event not found
 */

export default router;
