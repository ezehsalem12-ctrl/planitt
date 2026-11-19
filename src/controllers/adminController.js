import crypto from "crypto";
import User from "../models/userModel.js";
import Event from "../models/eventModel.js";
import Registration from "../models/registrationModel.js";
import Staff from "../models/staffModel.js";
import AdminInvitation from "../models/adminInvitationModel.js";

// Admin dashboard statistics
export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalOrganisers,
      totalEvents,
      totalAttendees,
      totalStaff,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      completedEvents,
    ] = await Promise.all([
      User.countDocuments({ role: "organiser" }),
      Event.countDocuments(),
      Registration.countDocuments(),
      Staff.countDocuments(),
      Event.countDocuments({ status: "published" }),
      Event.countDocuments({ status: "draft" }),
      Event.countDocuments({ status: "cancelled" }),
      Event.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      message: "Admin dashboard statistics retrieved successfully",
      statistics: {
        totalOrganisers,
        totalEvents,
        totalAttendees,
        totalStaff,
        eventsByStatus: {
          published: publishedEvents,
          draft: draftEvents,
          cancelled: cancelledEvents,
          completed: completedEvents,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// First Super Admin registration
export const createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (!name || !email || !password || !setupKey) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const secret = process.env.SUPER_ADMIN_SETUP_KEY;

    if (!secret) {
      return res.status(500).json({
        message: "Super Admin setup is not configured",
      });
    }

    const suppliedKey = Buffer.from(setupKey);
    const storedKey = Buffer.from(secret);

    if (
      suppliedKey.length !== storedKey.length ||
      !crypto.timingSafeEqual(suppliedKey, storedKey)
    ) {
      return res.status(403).json({
        message: "Invalid setup key",
      });
    }

    const existingSuperAdmin = await User.findOne({
      role: "super_admin",
    });

    if (existingSuperAdmin) {
      return res.status(403).json({
        message: "Super Admin setup is already completed",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const superAdmin = await User.create({
      name,
      email,
      password,
      role: "super_admin",
      permissions: [],
    });

    return res.status(201).json({
      message: "Super Admin account created successfully",
      user: superAdmin,
    });
  } catch (error) {
    next(error);
  }
};

// Create an Admin invitation
export const createAdminInvitation = async (req, res, next) => {
  try {
    const { email, permissions = [] } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Admin email is required",
      });
    }

    const allowedPermissions = [
      "manage_organisers",
      "manage_events",
      "view_registrations",
      "manage_staff",
      "view_platform_activity",
    ];

    if (
      !Array.isArray(permissions) ||
      permissions.some((permission) => !allowedPermissions.includes(permission))
    ) {
      return res.status(400).json({
        message: "Invalid admin permissions",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    // Remove previous pending invitations for this email
    await AdminInvitation.deleteMany({
      email: normalizedEmail,
      acceptedAt: null,
    });

    // Generate a secure invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token
    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AdminInvitation.create({
      email: normalizedEmail,
      permissions,
      tokenHash,
      expiresAt,
      createdBy: req.superAdmin._id,
    });

    return res.status(201).json({
      message: "Admin invitation created successfully",
      invitation: {
        email: normalizedEmail,
        permissions,
        invitationToken,
        expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Accept an Admin invitation
export const acceptAdminInvitation = async (req, res, next) => {
  try {
    const { name, password, invitationToken } = req.body;

    if (!name || !password || !invitationToken) {
      return res.status(400).json({
        message: "Name, password, and invitation token are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Hash the supplied invitation token
    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    // Find a valid, unused invitation
    const invitation = await AdminInvitation.findOne({
      tokenHash,
      acceptedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(400).json({
        message: "Invalid, expired, or already used invitation",
      });
    }

    const existingUser = await User.findOne({
      email: invitation.email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    // Create Admin account with assigned permissions
    const admin = await User.create({
      name,
      email: invitation.email,
      password,
      role: "admin",
      permissions: invitation.permissions,
    });

    // Mark invitation as accepted
    invitation.acceptedAt = new Date();
    await invitation.save();

    return res.status(201).json({
      message: "Admin account created successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
