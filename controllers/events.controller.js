import { pool } from "../config/db.js";

export const createEvent = async (req, res) => {
  const { title, datetime, location, capacity } = req.body;

  if (
    !title || typeof title !== "string" ||
    !datetime || isNaN(new Date(datetime)) ||
    !location || typeof location !== "string" ||
    typeof capacity !== "number" || capacity <= 0 || capacity > 1000
  ) {
    return res.status(400).json({ error: "Invalid input data for event creation" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, datetime, location, capacity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, datetime, location, capacity]
    );

    res.status(201).json({
      message: "Event created successfully",
      event: result.rows[0]
    });
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEventDetails = async (req, res) => {
  const { id } = req.params;

  if (!Number(id)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const eventRes = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const usersRes = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN event_registrations er ON er.user_id = u.id
      WHERE er.event_id = $1
    `, [id]);

    res.status(200).json({
      message: "Event details fetched successfully",
      event: eventRes.rows[0],
      registrations: usersRes.rows
    });
  } catch (err) {
    console.error("getEventDetails error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const registerUserToEvent = async (req, res) => {
  const { id: eventId } = req.params;
  const userId = req.user.userId;

  if (!Number(eventId) || !Number(userId)) {
    return res.status(400).json({ error: "Invalid event or user ID" });
  }

  try {
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];
    if (new Date(event.datetime) < new Date()) {
      return res.status(400).json({ error: "Cannot register for past events" });
    }

    const exists = await pool.query(
      `SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "User already registered" });
    }

    const regCount = await pool.query(
      `SELECT COUNT(*) FROM event_registrations WHERE event_id = $1`,
      [eventId]
    );
    if (parseInt(regCount.rows[0].count) >= event.capacity) {
      return res.status(400).json({ error: "Event is full" });
    }

    await pool.query(
      `INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)`,
      [eventId, userId]
    );

    const userResult = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [userId]);

    res.status(201).json({
      message: "User registered successfully",
      registration: {
        event,
        user: userResult.rows[0]
      }
    });
  } catch (err) {
    console.error("registerUserToEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const cancelRegistration = async (req, res) => {
  const { id: eventId, userId } = req.params;

  if (!Number(eventId) || !Number(userId)) {
    return res.status(400).json({ error: "Invalid IDs" });
  }

  try {
    const check = await pool.query(
      `SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "User not registered for this event" });
    }

    await pool.query(
      `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    res.status(200).json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("cancelRegistration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getUpcomingEvents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM events
      WHERE datetime > NOW()
      ORDER BY datetime ASC, location ASC
    `);

    res.status(200).json({
      message: "Upcoming events fetched successfully",
      events: result.rows
    });
  } catch (err) {
    console.error("getUpcomingEvents error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEventStats = async (req, res) => {
  const { id: eventId } = req.params;

  if (!Number(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM event_registrations WHERE event_id = $1`,
      [eventId]
    );

    const total = parseInt(countResult.rows[0].count);
    const remaining = event.capacity - total;
    const percentage = ((total / event.capacity) * 100).toFixed(2);

    res.status(200).json({
      message: "Stats fetched successfully",
      stats: {
        event,
        total_registrations: total,
        remaining_capacity: remaining,
        percent_filled: `${percentage}%`
      }
    });
  } catch (err) {
    console.error("getEventStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
