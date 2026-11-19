import mongoose from "mongoose";

const adminInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    permissions: {
      type: [String],
      enum: [
        "manage_organisers",
        "manage_events",
        "view_registrations",
        "manage_staff",
        "view_platform_activity",
      ],
      default: [],
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminInvitation = mongoose.model(
  "AdminInvitation",
  adminInvitationSchema,
);

export default AdminInvitation;
