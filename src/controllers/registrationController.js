import QRCode from "qrcode";
import Registration from "../models/registrationModel.js";
import Event from "../models/eventModel.js";
import Staff from "../models/staffModel.js";

// Register attendee for an event
export const registerAttendee = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { attendeeName, attendeeEmail, attendeePhone } = req.body;

    // Check required fields
    if (!attendeeName || !attendeeEmail || !attendeePhone) {
      return res.status(400).json({
        message: "Name, email and phone number are required",
      });
    }

    // Validate event ID
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // Find published event
    const event = await Event.findOne({
      _id: eventId,
      status: "published",
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or unavailable",
      });
    }

    // Check registration deadline
    if (
      event.registrationDeadline &&
      new Date() >= event.registrationDeadline
    ) {
      return res.status(400).json({
        message: "Registration deadline has passed",
      });
    }

    // Check event start date
    if (new Date() >= event.startDate) {
      return res.status(400).json({
        message: "Registration for this event is closed",
      });
    }

    // Check event capacity
    if (event.registrationsCount >= event.capacity) {
      return res.status(400).json({
        message: "This event is fully booked",
      });
    }

    // Check duplicate registration
    const existingRegistration = await Registration.findOne({
      event: eventId,
      attendeeEmail: attendeeEmail.toLowerCase(),
    });

    if (existingRegistration) {
      return res.status(409).json({
        message: "You have already registered for this event",
      });
    }

    // Create registration
    const registration = await Registration.create({
      event: eventId,
      attendeeName,
      attendeeEmail,
      attendeePhone,
    });

    // Generate QR code for the ticket
    const qrCode = await QRCode.toDataURL(registration.ticketId);

    // Update registration count
    event.registrationsCount += 1;
    await event.save();

    return res.status(201).json({
      message: "Registration successful",
      registration: {
        attendeeName: registration.attendeeName,
        attendeeEmail: registration.attendeeEmail,
        ticketId: registration.ticketId,
        ticketStatus: registration.ticketStatus,
        qrCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify ticket and check in attendee
export const verifyTicket = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ticketId } = req.body;

    // Validate event ID
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // Check ticket ID
    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket ID is required",
      });
    }

    // Find event belonging to the logged-in organiser
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    // Check whether the ticket exists for this event
    const registration = await Registration.findOne({
      event: eventId,
      ticketId,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Invalid ticket or ticket does not belong to this event",
      });
    }

    // Check ticket status
    if (registration.ticketStatus === "used") {
      return res.status(409).json({
        message: "This ticket has already been used",
      });
    }

    if (registration.ticketStatus !== "valid") {
      return res.status(400).json({
        message: "This ticket is not valid",
      });
    }

    // Atomically mark ticket as used
    const checkedInRegistration = await Registration.findOneAndUpdate(
      {
        _id: registration._id,
        ticketStatus: "valid",
      },
      {
        $set: {
          ticketStatus: "used",
          checkedInAt: new Date(),
          checkedInBy: req.user.userId,
          checkedInByModel: "User",
        },
      },
      { new: true },
    );

    if (!checkedInRegistration) {
      return res.status(409).json({
        message: "This ticket has already been used",
      });
    }

    return res.status(200).json({
      message: "Ticket verified successfully. Attendee checked in.",
      attendee: {
        name: checkedInRegistration.attendeeName,
        email: checkedInRegistration.attendeeEmail,
      },
      ticketId: checkedInRegistration.ticketId,
      ticketStatus: checkedInRegistration.ticketStatus,
      checkedInAt: checkedInRegistration.checkedInAt,
    });
  } catch (error) {
    next(error);
  }
};

// Staff ticket verification and check-in
export const verifyStaffTicket = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ticketId } = req.body;

    // Validate event ID
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // Check ticket ID
    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket ID is required",
      });
    }

    // Confirm staff is assigned to this event
    const isAssigned = req.staff.events.some((id) => id.toString() === eventId);

    if (!isAssigned) {
      return res.status(403).json({
        message: "You are not assigned to this event",
      });
    }

    // Find event belonging to the staff member's organiser
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.staff.organiser,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Find ticket belonging to this event
    const registration = await Registration.findOne({
      event: eventId,
      ticketId,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Invalid ticket or ticket does not belong to this event",
      });
    }

    if (registration.ticketStatus === "used") {
      return res.status(409).json({
        message: "This ticket has already been used",
      });
    }

    if (registration.ticketStatus !== "valid") {
      return res.status(400).json({
        message: "This ticket is not valid",
      });
    }

    // Atomically check in attendee
    const checkedInRegistration = await Registration.findOneAndUpdate(
      {
        _id: registration._id,
        ticketStatus: "valid",
      },
      {
        $set: {
          ticketStatus: "used",
          checkedInAt: new Date(),
          checkedInBy: req.staff._id,
          checkedInByModel: "Staff",
        },
      },
      { new: true },
    );

    if (!checkedInRegistration) {
      return res.status(409).json({
        message: "This ticket has already been used",
      });
    }

    return res.status(200).json({
      message: "Ticket verified successfully. Attendee checked in.",
      attendee: {
        name: checkedInRegistration.attendeeName,
        email: checkedInRegistration.attendeeEmail,
      },
      ticketId: checkedInRegistration.ticketId,
      ticketStatus: checkedInRegistration.ticketStatus,
      checkedInAt: checkedInRegistration.checkedInAt,
      checkedInBy: req.staff.name,
    });
  } catch (error) {
    next(error);
  }
};

// Get attendees registered for an event
export const getEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Validate event ID
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // Find event belonging to the logged-in organiser
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    // Get all registrations for this event
    const registrations = await Registration.find({
      event: eventId,
    })
      .select(
        "attendeeName attendeeEmail attendeePhone ticketId ticketStatus checkedInAt createdAt",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Event attendees retrieved successfully",
      event: {
        id: event._id,
        title: event.title,
        registrationsCount: event.registrationsCount,
        capacity: event.capacity,
      },
      totalAttendees: registrations.length,
      attendees: registrations,
    });
  } catch (error) {
    next(error);
  }
};

// Get staff activity for an event
export const getEventStaffActivity = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Validate event ID
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // Confirm event belongs to the logged-in organiser
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    // Find active staff assigned to this event
    const staffMembers = await Staff.find({
      organiser: req.user.userId,
      events: eventId,
      isActive: true,
    }).select("name email role isActive");

    // Get attendees checked in by staff
    const staffActivity = await Promise.all(
      staffMembers.map(async (staff) => {
        const registrations = await Registration.find({
          event: eventId,
          checkedInBy: staff._id,
          checkedInByModel: "Staff",
          ticketStatus: "used",
        })
          .select("attendeeName attendeeEmail ticketId checkedInAt")
          .sort({ checkedInAt: -1 });

        return {
          staff: {
            id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            isActive: staff.isActive,
          },
          totalCheckedIn: registrations.length,
          attendees: registrations,
        };
      }),
    );

    return res.status(200).json({
      message: "Event staff activity retrieved successfully",
      event: {
        id: event._id,
        title: event.title,
      },
      totalStaff: staffActivity.length,
      totalStaffCheckIns: staffActivity.reduce(
        (total, item) => total + item.totalCheckedIn,
        0,
      ),
      staffActivity,
    });
  } catch (error) {
    next(error);
  }
};
