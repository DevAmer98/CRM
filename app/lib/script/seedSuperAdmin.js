import 'dotenv/config'; 
import { User } from "../models.js";
import { connectToDB } from "../utils.js";
import bcrypt from "bcrypt";
import { ROLES } from '../role.js';



const seedSuperAdmin = async () => {
  await connectToDB();

  const existing = await User.findOne({ username: "masteradmin" });
  if (existing) {
    console.log("Super admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("1", 10);

  const newSuperAdmin = new User({
    username: "masteradmin",
    email: "superadmin@gmail.com",
    password: hashedPassword,
role: ROLES.ADMIN, // ✅ correct
  });

  await newSuperAdmin.save();
  console.log("✅ Super Admin created");
};

seedSuperAdmin().then(() => process.exit());
