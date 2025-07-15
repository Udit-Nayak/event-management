import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (
    !name || typeof name !== "string" || name.trim() === "" ||
    !email || typeof email !== "string" || !email.includes("@") ||
    !password || typeof password !== "string" || password.length < 6
  ) {
    return res.status(400).json({ error: "Invalid input. Name, valid email, and password (min 6 chars) are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === '23505') {
      return res.status(409).json({ error: "Email already exists" }); // Unique constraint violation
    }
    res.status(500).json({ error: "Internal server error during registration" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (
    !email || typeof email !== "string" || !email.includes("@") ||
    !password || typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Invalid login input. Email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign({ userId: user.id }, "your_jwt_secret", {
      expiresIn: "2h"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
};
