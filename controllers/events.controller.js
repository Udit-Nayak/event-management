import { pool } from "../config/db.js";
import dayjs from "dayjs";

export const createEvent = async (req, res) => {
  const { title, datetime, location, capacity } = req.body;

  if (!title || !datetime || !location || capacity > 1000 || capacity <= 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, datetime, location, capacity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, datetime, location, capacity]
    );

    const createdEvent = result.rows[0];

    res.status(201).json({
      message: "Event created successfully",
      event: createdEvent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
};


export const getEventDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const eventRes = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (eventRes.rows.length === 0) return res.status(404).json({ error: "Event not found" });
    const usersRes = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN event_registrations er ON er.user_id = u.id
      WHERE er.event_id = $1
    `, [id]);
    res.json({ ...eventRes.rows[0], registrations: usersRes.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
};

export const registerUserToEvent = async (req, res) => {
  const { id: eventId } = req.params;
  const userId = req.user.userId;

  try {
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];

    if (new Date(event.datetime) < new Date()) {
      return res.status(400).json({ error: "Cannot register for past events" });
    }

    const exists = await pool.query(`
      SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2
    `, [eventId, userId]);

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Already registered" });
    }

    const regCount = await pool.query(`
      SELECT COUNT(*) FROM event_registrations WHERE event_id = $1
    `, [eventId]);

    if (parseInt(regCount.rows[0].count) >= event.capacity) {
      return res.status(400).json({ error: "Event is full" });
    }

    await pool.query(`
      INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)
    `, [eventId, userId]);

    const userResult = await pool.query(`
      SELECT id, name, email FROM users WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];

    res.status(201).json({
      message: "User successfully registered for the event",
      registration: {
        event: {
          id: event.id,
          title: event.title,
          datetime: event.datetime,
          location: event.location,
          capacity: event.capacity
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
};


export const cancelRegistration = async (req, res) => {
  const { id: eventId, userId } = req.params;

  try {
    // Check if the registration exists
    const check = await pool.query(`
      SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2
    `, [eventId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "User not registered for event" });
    }

    // Fetch event and user details before deleting
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    const userResult = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [userId]);

    const event = eventResult.rows[0];
    const user = userResult.rows[0];

    // Delete the registration
    await pool.query(`
      DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2
    `, [eventId, userId]);

    // Respond with structured message
    res.status(200).json({
      message: "Registration successfully cancelled",
      cancellation: {
        event: {
          id: event.id,
          title: event.title,
          datetime: event.datetime,
          location: event.location
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel registration" });
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
      message: "Fetched upcoming events",
      events: result.rows
    });
  } catch (err) {
    console.error("Error in getUpcomingEvents:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};


export const getEventStats = async (req, res) => {
  const { id: eventId } = req.params;

  try {
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];
    const { capacity } = event;

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM event_registrations WHERE event_id = $1
    `, [eventId]);

    const total = parseInt(countResult.rows[0].count);
    const remaining = capacity - total;
    const percentage = ((total / capacity) * 100).toFixed(2);

    res.status(200).json({
      message: "Event stats fetched successfully",
      stats: {
        event: {
          id: event.id,
          title: event.title,
          datetime: event.datetime,
          location: event.location,
          capacity: event.capacity
        },
        total_registrations: total,
        remaining_capacity: remaining,
        percent_filled: `${percentage}%`
      }
    });

  } catch (err) {
    console.error("Error in getEventStats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
