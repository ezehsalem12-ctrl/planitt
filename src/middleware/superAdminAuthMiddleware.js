import User from "../models/userModel.js";

const superAdminAuthMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "super_admin" || user.isActive === false) {
      return res.status(403).json({
        message: "Access denied. Super Admin privileges required",
      });
    }

    req.superAdmin = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default superAdminAuthMiddleware;
