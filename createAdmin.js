import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import User from "./src/models/userModel.js";

dotenv.config();

const rl = readline.createInterface({ input, output });

const createAdmin = async () => {
  try {
    const name = await rl.question("Admin name: ");
    const email = await rl.question("Admin email: ");
    const password = await rl.question(
      "Admin password (minimum 8 characters): ",
    );

    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error(
        "Please provide valid details. Password must be at least 8 characters.",
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      throw new Error(
        "This email already has an account. Use a different email.",
      );
    }

    await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

createAdmin();
