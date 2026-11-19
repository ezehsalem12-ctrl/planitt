import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Staff from "../models/staffModel.js";
import Event from "../models/eventModel.js";
import User from "../models/userModel.js";

// Add staff member to an organiser's events
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, eventIds, role } = req.body;

    // Check required fields
    if (!name || !email || !password || !eventIds?.length) {
      return res.status(400).json({
        message: "Name, email, password and event assignments are required",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Validate staff role
    const allowedRoles = ["ticket_checker", "event_manager"];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid staff role",
      });
    }

    // Validate event IDs
    if (
      !Array.isArray(eventIds) ||
      eventIds.some((id) => !/^[0-9a-fA-F]{24}$/.test(id))
    ) {
      return res.status(400).json({
        message: "Invalid event assignments",
      });
    }

    // Find the logged-in organiser
    const organiser = await User.findById(req.user.userId);

    if (!organiser || organiser.role !== "organiser") {
      return res.status(403).json({
        message: "Only organisers can add staff",
      });
    }

    // Check whether the staff email is already registered
    const normalizedEmail = email.trim().toLowerCase();

    const existingStaff = await Staff.findOne({
      email: normalizedEmail,
    });

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingStaff || existingUser) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    // Confirm all assigned events belong to this organiser
    const events = await Event.find({
      _id: { $in: eventIds },
      organizer: organiser._id,
    });

    if (events.length !== eventIds.length) {
      return res.status(403).json({
        message: "One or more events do not belong to your account",
      });
    }

    // Create staff account
    const staff = await Staff.create({
      name,
      email: normalizedEmail,
      password,
      organiser: organiser._id,
      events: eventIds,
      role: role || "ticket_checker",
    });

    return res.status(201).json({
      message: "Staff member added successfully",
      staff,
    });
  } catch (error) {
    next(error);
  }
};

// Staff login
export const loginStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find staff account and include password
    const staff = await Staff.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!staff) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check whether staff account is active
    if (!staff.isActive) {
      return res.status(403).json({
        message: "Your staff account has been deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate staff-specific token
    const token = jwt.sign({ staffId: staff._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    return res.status(200).json({
      message: "Staff login successful",
      token,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

// Get all staff members belonging to the logged-in organiser
export const getMyStaff = async (req, res, next) => {
  try {
    const organiser = await User.findById(req.user.userId);

    if (!organiser || organiser.role !== "organiser") {
      return res.status(403).json({
        message: "Only organisers can view staff members",
      });
    }

    const staff = await Staff.find({
      organiser: organiser._id,
    })
      .select("-password")
      .populate("events", "title slug status startDate");

    return res.status(200).json({
      message: "Staff members retrieved successfully",
      totalStaff: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing staff member's event assignments
export const updateStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { eventIds } = req.body;

    // Validate staff ID
    if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
      return res.status(400).json({
        message: "Invalid staff ID",
      });
    }

    // Validate event IDs
    if (
      !Array.isArray(eventIds) ||
      eventIds.length === 0 ||
      eventIds.some((id) => !/^[0-9a-fA-F]{24}$/.test(id))
    ) {
      return res.status(400).json({
        message: "Valid event assignments are required",
      });
    }

    // Find staff member belonging to the logged-in organiser
    const staff = await Staff.findOne({
      _id: staffId,
      organiser: req.user.userId,
    });

    if (!staff) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    // Confirm all events belong to this organiser
    const events = await Event.find({
      _id: { $in: eventIds },
      organizer: req.user.userId,
    });

    // Remove duplicate event IDs before comparing
    const uniqueEventIds = [...new Set(eventIds.map((id) => id.toString()))];

    if (events.length !== uniqueEventIds.length) {
      return res.status(403).json({
        message: "One or more events do not belong to your account",
      });
    }

    // Update staff event assignments
    staff.events = uniqueEventIds;
    await staff.save();

    return res.status(200).json({
      message: "Staff event assignments updated successfully",
      staff,
    });
  } catch (error) {
    next(error);
  }
};
