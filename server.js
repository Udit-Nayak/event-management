import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/events", eventRoutes);


app.get("/", (req, res) => {
  res.send("Event Management API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});