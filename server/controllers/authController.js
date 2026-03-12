import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mailer.js";

function buildAuthResponse(user) {
  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  };
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Account already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = Date.now() + 1000 * 60 * 60;
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      verificationToken,
      verificationExpires,
    });
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verificationUrl = `${clientUrl}/account/verify?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Confirm your Chronolite account",
      text: `Confirm your email by visiting ${verificationUrl}`,
      html: `<p>Hi ${name},</p>
      <p>Thanks for signing up for Chronolite. Click the button below to confirm your email address.</p>
      <p><a href="${verificationUrl}" style="display:inline-block;padding:0.75rem 1.25rem;background:#f2d3c0;color:#0f0c08;border-radius:999px;text-decoration:none;">Confirm email</a></p>
      <p>If you did not create this account, ignore this message.</p>`,
    });
    res.status(201).json({
      message: "Registration successful. Check your email to confirm the account before logging in.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.emailVerified) {
      return res.status(403).json({ message: "Verify your email address before logging in." });
    }
    res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token is required" });
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification token" });
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    res.json({ message: "Email confirmed. You can now sign in." });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};