import Event from "../models/eventModel.js";
import User from "../models/userModel.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// Create event
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      banner,
      venue,
      address,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      ticketPrice,
    } = req.body;

    let image = {};

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Check required fields
    if (
      !title ||
      !image ||
      !description ||
      !category ||
      !venue ||
      !address ||
      !startDate ||
      !endDate ||
      capacity === undefined
    ) {
      return res.status(400).json({
        message: "Please provide all required event details",
      });
    }

    // Check organizer role
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organiser") {
      return res.status(403).json({
        message: "Only organizers can create events",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const price = ticketPrice ?? 0;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Please provide valid event dates",
      });
    }

    if (start <= new Date() || end <= start) {
      return res.status(400).json({
        message: "Event dates must be valid and in the future",
      });
    }

    // Validate registration deadline
    let deadline = null;

    if (registrationDeadline) {
      deadline = new Date(registrationDeadline);

      if (Number.isNaN(deadline.getTime())) {
        return res.status(400).json({
          message: "Invalid registration deadline",
        });
      }

      if (deadline >= start) {
        return res.status(400).json({
          message: "Registration deadline must be before the event starts",
        });
      }
    }

    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({
        message: "Capacity must be a positive whole number",
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        message: "Ticket price cannot be negative",
      });
    }

    const event = await Event.create({
      title,
      image,
      description,
      category,
      banner,
      venue,
      address,
      startDate: start,
      endDate: end,
      registrationDeadline: deadline,
      capacity: Number(capacity),
      ticketPrice: Number(price),
      isFree: Number(price) === 0,
      organizer: req.user.userId,
    });

    return res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};

// Get all public events with search and category filtering
export const getAllEvents = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {
      status: { $in: ["published", "completed", "cancelled"] },
    };

    // Search events by title
    if (req.query.search) {
      filter.title = {
        $regex: req.query.search.trim(),
        $options: "i",
      };
    }

    // Filter events by category
    if (req.query.category) {
      filter.category = {
        $regex: `^${req.query.category.trim()}$`,
        $options: "i",
      };
    }

    const [events, totalEvents] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name avatar")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit),

      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Get a single event by ID or slug
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    const event = await Event.findOne({
      ...(isMongoId ? { _id: id } : { slug: id }),
      status: { $in: ["published", "completed", "cancelled"] },
    }).populate("organizer", "name avatar");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.status(200).json({ event });
  } catch (error) {
    next(error);
  }
};

// Get events created by the logged-in organizer
export const getMyEvents = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organiser") {
      return res.status(403).json({
        message: "Only organizers can access this resource",
      });
    }

    const events = await Event.find({
      organizer: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// Update event
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organiser") {
      return res.status(403).json({
        message: "Only organizers can update events",
      });
    }

    const event = await Event.findOne({
      _id: id,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "banner",
      "venue",
      "address",
      "startDate",
      "endDate",
      "capacity",
      "ticketPrice",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    }

    // Validate event dates
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start <= new Date() ||
      end <= start
    ) {
      return res.status(400).json({
        message: "Please provide valid future event dates",
      });
    }

    // Update registration deadline when supplied
    if (req.body.registrationDeadline !== undefined) {
      if (
        req.body.registrationDeadline === null ||
        req.body.registrationDeadline === ""
      ) {
        event.registrationDeadline = null;
      } else {
        const deadline = new Date(req.body.registrationDeadline);

        if (Number.isNaN(deadline.getTime())) {
          return res.status(400).json({
            message: "Invalid registration deadline",
          });
        }

        event.registrationDeadline = deadline;
      }
    }

    // Validate registration deadline
    if (event.registrationDeadline && event.registrationDeadline >= start) {
      return res.status(400).json({
        message: "Registration deadline must be before the event starts",
      });
    }

    if (
      !Number.isInteger(Number(event.capacity)) ||
      Number(event.capacity) < 1
    ) {
      return res.status(400).json({
        message: "Capacity must be a positive whole number",
      });
    }

    if (
      !Number.isFinite(Number(event.ticketPrice)) ||
      Number(event.ticketPrice) < 0
    ) {
      return res.status(400).json({
        message: "Ticket price cannot be negative",
      });
    }

    event.isFree = Number(event.ticketPrice) === 0;

    await event.save();

    return res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};

// Publish event
export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findOne({
      _id: id,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    if (event.status !== "draft") {
      return res.status(400).json({
        message: "Only draft events can be published",
      });
    }

    if (event.startDate <= new Date()) {
      return res.status(400).json({
        message: "Past events cannot be published",
      });
    }

    event.status = "published";

    await event.save();

    return res.status(200).json({
      message: "Event published successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel event
export const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findOne({
      _id: id,
      organizer: req.user.userId,
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission",
      });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({
        message: "Event is already cancelled",
      });
    }

    if (event.status === "completed") {
      return res.status(400).json({
        message: "Completed events cannot be cancelled",
      });
    }

    event.status = "cancelled";

    await event.save();

    return res.status(200).json({
      message: "Event cancelled successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};
