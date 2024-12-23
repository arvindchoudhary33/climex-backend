import express from "express";
import { User } from "../models/user.model";
import { auth } from "../middlewares/auth.middleware";
import { superAdminCheck } from "../middlewares/superAdmin.middleware";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all", auth, superAdminCheck, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", auth, superAdminCheck, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update through this route

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.params.id }, // Exclude current user from check
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email address is already in use by another user",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/:id/change-password", auth, superAdminCheck, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save(); 

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, superAdminCheck, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({
      message: "User deleted successfully",
      userId: req.params.id,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/profile", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
