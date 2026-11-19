import User from "../models/userModel.js";
import Event from "../models/eventModel.js";
import Registration from "../models/registrationModel.js";
import Staff from "../models/staffModel.js";

// Get all organisers on the platform
export const getAllOrganisers = async (req, res, next) => {
  try {
    const organisers = await User.find({ role: "organiser" })
      .select("name email phoneNo isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Organisers retrieved successfully",
      totalOrganisers: organisers.length,
      organisers,
    });
  } catch (error) {
    next(error);
  }
};

// Get all events on the platform
export const getAllPlatformEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Platform events retrieved successfully",
      totalEvents: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// Get all attendee registrations across the platform
export const getAllPlatformRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find()
      .populate({
        path: "event",
        select: "title slug status organizer",
        populate: {
          path: "organizer",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Platform registrations retrieved successfully",
      totalRegistrations: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

// Get all staff across the platform
export const getAllPlatformStaff = async (req, res, next) => {
  try {
    const staff = await Staff.find()
      .select("-password")
      .populate("organiser", "name email")
      .populate("events", "title slug status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Platform staff retrieved successfully",
      totalStaff: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};
