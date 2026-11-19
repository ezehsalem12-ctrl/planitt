import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 8,
      select: false,
    },

    phoneNo: {
      type: String,
      default: null,
      trim: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["organiser", "admin", "super_admin"],
      default: "organiser",
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

    isActive: {
      type: Boolean,
      default: true,
    },

    refresh_token: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

// Return user information without sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.refresh_token;
  delete user.__v;

  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
