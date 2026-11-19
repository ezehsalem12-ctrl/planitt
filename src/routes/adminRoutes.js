import express from "express";
import {
  getAdminDashboard,
  createSuperAdmin,
  createAdminInvitation,
  acceptAdminInvitation,
} from "../controllers/adminController.js";

import {
  getAllAdmins,
  updateAdminPermissions,
  updateAdminStatus,
} from "../controllers/adminManagementController.js";

import {
  getAllOrganisers,
  getAllPlatformEvents,
  getAllPlatformRegistrations,
  getAllPlatformStaff,
} from "../controllers/platformController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";
import superAdminAuthMiddleware from "../middleware/superAdminAuthMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";

const router = express.Router();

// First Super Admin registration
router.post("/setup/super-admin", createSuperAdmin);

// Admin dashboard statistics
router.get(
  "/dashboard",
  authMiddleware,
  adminAuthMiddleware,
  requirePermission("view_platform_activity"),
  getAdminDashboard,
);

// Super Admin creates an Admin invitation
router.post(
  "/invitations",
  authMiddleware,
  superAdminAuthMiddleware,
  createAdminInvitation,
);

// Invited person accepts the invitation
router.post("/invitations/accept", acceptAdminInvitation);

// Super Admin views all additional Admin accounts
router.get("/admins", authMiddleware, superAdminAuthMiddleware, getAllAdmins);

// Super Admin updates Admin permissions
router.patch(
  "/admins/:adminId/permissions",
  authMiddleware,
  superAdminAuthMiddleware,
  updateAdminPermissions,
);

// Super Admin activates or deactivates an Admin
router.patch(
  "/admins/:adminId/status",
  authMiddleware,
  superAdminAuthMiddleware,
  updateAdminStatus,
);

// View all organisers
router.get(
  "/organisers",
  authMiddleware,
  adminAuthMiddleware,
  requirePermission("manage_organisers"),
  getAllOrganisers,
);

// View all events across the platform
router.get(
  "/events",
  authMiddleware,
  adminAuthMiddleware,
  requirePermission("manage_events"),
  getAllPlatformEvents,
);

// View all attendee registrations
router.get(
  "/registrations",
  authMiddleware,
  adminAuthMiddleware,
  requirePermission("view_registrations"),
  getAllPlatformRegistrations,
);

// View all staff across the platform
router.get(
  "/staff",
  authMiddleware,
  adminAuthMiddleware,
  requirePermission("manage_staff"),
  getAllPlatformStaff,
);

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: Admin and Super Admin platform management
 */

/**
 * @swagger
 * /api/admin/setup/super-admin:
 *   post:
 *     summary: Create the first Super Admin account
 *     tags: [Administration]
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
 *               - setupKey
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               setupKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *       403:
 *         description: Setup key invalid or Super Admin already exists
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get platform administration dashboard statistics
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/admin/invitations:
 *   post:
 *     summary: Invite a new Admin
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - permissions
 *             properties:
 *               email:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - manage_organisers
 *                     - manage_events
 *                     - view_registrations
 *                     - manage_staff
 *                     - view_platform_activity
 *     responses:
 *       201:
 *         description: Admin invitation created successfully
 *       403:
 *         description: Super Admin access required
 */

/**
 * @swagger
 * /api/admin/invitations/accept:
 *   post:
 *     summary: Accept an Admin invitation
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - token
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       400:
 *         description: Invalid or expired invitation
 */

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all additional Admin accounts
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin accounts retrieved successfully
 *       403:
 *         description: Super Admin access required
 */

/**
 * @swagger
 * /api/admin/admins/{adminId}/permissions:
 *   patch:
 *     summary: Update an Admin's permissions
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
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
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Admin permissions updated successfully
 *       403:
 *         description: Super Admin access required
 */

/**
 * @swagger
 * /api/admin/admins/{adminId}/status:
 *   patch:
 *     summary: Activate or deactivate an Admin
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Admin status updated successfully
 *       403:
 *         description: Super Admin access required
 */

/**
 * @swagger
 * /api/admin/organisers:
 *   get:
 *     summary: Get all organisers on the platform
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organisers retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Get all events across the platform
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform events retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/admin/registrations:
 *   get:
 *     summary: Get all attendee registrations across the platform
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform registrations retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/admin/staff:
 *   get:
 *     summary: Get all staff across the platform
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform staff retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */

export default router;
