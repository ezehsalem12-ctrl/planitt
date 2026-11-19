import jwt from "jsonwebtoken";
import Staff from "../models/staffModel.js";

const staffAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.staffId) {
      return res.status(401).json({
        message: "Invalid staff authentication token",
      });
    }

    const staff = await Staff.findById(decoded.staffId);

    if (!staff || !staff.isActive) {
      return res.status(401).json({
        message: "Staff account not found or deactivated",
      });
    }

    req.staff = staff;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
};

export default staffAuthMiddleware;
