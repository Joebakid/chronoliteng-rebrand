import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2] || "admin@chronolite.com";
const password = process.argv[3] || "admin12345";
const name = process.argv[4] || "Chronolite Admin";

async function seedAdmin() {
  await connectDB();

  const existingUser = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    existingUser.name = name;
    existingUser.password = passwordHash;
    existingUser.isAdmin = true;
    await existingUser.save();
    console.log(`Updated admin user: ${email}`);
    process.exit(0);
  }

  await User.create({
    name,
    email,
    password: passwordHash,
    isAdmin: true,
  });

  console.log(`Created admin user: ${email}`);
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
