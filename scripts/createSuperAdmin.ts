import mongoose from "mongoose";
import { User } from "../src/models/user.model";
import dotenv from "dotenv";

dotenv.config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    // NOTE: Super admin details will come from env file
    const superAdmin = new User({
      email: "super@gmail.com",
      password: "password",
      name: "Super Admin",
      role: "super_admin",
    });

    await superAdmin.save();
    console.log("Super admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();
