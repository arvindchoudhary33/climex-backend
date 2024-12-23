import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

export const superAdminCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "super_admin") {
      return res.status(403).json({
        message: "Access denied. Super admin privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
