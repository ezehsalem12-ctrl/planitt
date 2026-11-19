import mongoose from "mongoose";
import crypto from "crypto";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    attendeeName: {
      type: String,
      required: [true, "Attendee name is required"],
      trim: true,
    },

    attendeeEmail: {
      type: String,
      required: [true, "Attendee email is required"],
      trim: true,
      lowercase: true,
    },

    attendeePhone: {
      type: String,
      required: [true, "Attendee phone number is required"],
      trim: true,
    },

    ticketId: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },

    ticketStatus: {
      type: String,
      enum: ["valid", "used", "cancelled"],
      default: "valid",
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: "checkedInByModel",
    },

    checkedInByModel: {
      type: String,
      enum: ["User", "Staff"],
      default: null,
    },
  },
  { timestamps: true },
);

// Prevent the same email from registering twice for one event
registrationSchema.index({ event: 1, attendeeEmail: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
