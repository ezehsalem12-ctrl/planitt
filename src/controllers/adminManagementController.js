import User from "../models/userModel.js";

// Get all additional Admin accounts
export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("name email role permissions isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Admin accounts retrieved successfully",
      totalAdmins: admins.length,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// Update an Admin's permissions
export const updateAdminPermissions = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

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

    const admin = await User.findOne({
      _id: adminId,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin account not found",
      });
    }

    admin.permissions = [...new Set(permissions)];

    await admin.save();

    return res.status(200).json({
      message: "Admin permissions updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Activate or deactivate an Admin account
export const updateAdminStatus = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    const admin = await User.findOne({
      _id: adminId,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin account not found",
      });
    }

    admin.isActive = isActive;

    await admin.save();

    return res.status(200).json({
      message: `Admin account ${isActive ? "activated" : "deactivated"} successfully`,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
