import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Event category is required"],
      trim: true,
    },

    banner: {
      type: String,
      default: null,
    },

    image: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },

    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Event address is required"],
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "Event end date is required"],
    },

    registrationDeadline: {
      type: Date,
      default: null,
    },

    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: 1,
    },

    ticketPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFree: {
      type: Boolean,
      default: true,
    },

    registrationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Automatically generate a unique slug from the event title
eventSchema.pre("validate", async function () {
  if (!this.isNew || !this.title) return;

  const baseSlug = slugify(this.title);

  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Event.exists({
      slug,
      _id: { $ne: this._id },
    })
  ) {
    counter += 1;
    slug = `${baseSlug}_${counter}`;
  }

  this.slug = slug;
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
