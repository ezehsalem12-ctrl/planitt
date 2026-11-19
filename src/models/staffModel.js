import mongoose from "mongoose";
import bcrypt from "bcrypt";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Staff email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: [true, "Staff password is required"],
      minlength: 8,
      select: false,
    },

    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },
    ],

    role: {
      type: String,
      enum: ["ticket_checker", "event_manager"],
      default: "ticket_checker",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hash staff password before saving
staffSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

// Hide sensitive fields
staffSchema.methods.toJSON = function () {
  const staff = this.toObject();

  delete staff.password;
  delete staff.__v;

  return staff;
};

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
