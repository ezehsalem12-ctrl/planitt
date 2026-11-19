const requirePermission = (permission) => {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    // Super Admin has access to everything
    if (admin.role === "super_admin") {
      return next();
    }

    if (!admin.permissions.includes(permission)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export default requirePermission;
