import User from "../models/userModel.js";

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (
      !user ||
      !["admin", "super_admin"].includes(user.role) ||
      user.isActive === false
    ) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required",
      });
    }

    // Make the authenticated admin available to later middleware
    req.admin = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default adminAuthMiddleware;
