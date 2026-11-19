import express from "express";
import {
  createStaff,
  loginStaff,
  getMyStaff,
  updateStaff,
} from "../controllers/staffController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public staff login route
router.post("/login", loginStaff);

// Get all staff members belonging to the organiser
router.get("/", authMiddleware, getMyStaff);

// Protected route for organisers to add staff
router.post("/", authMiddleware, createStaff);

// Update staff event assignments
router.patch("/:staffId", authMiddleware, updateStaff);

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Event staff management and authentication
 */

/**
 * @swagger
 * /api/staff/login:
 *   post:
 *     summary: Login as event staff
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff belonging to the organiser
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff members retrieved successfully
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new event staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - eventIds
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               eventIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               role:
 *                 type: string
 *                 enum: [ticket_checker, event_manager]
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *       400:
 *         description: Invalid staff details
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/staff/{staffId}:
 *   patch:
 *     summary: Update staff event assignments
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               role:
 *                 type: string
 *                 enum: [ticket_checker, event_manager]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Staff member not found
 */

export default router;
