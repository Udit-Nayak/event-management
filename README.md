# 🎯 Event Management API

A fully-featured REST API built with **Node.js**, **Express**, and **PostgreSQL** for managing events, user registrations, and authentication.

---

## 📦 Features

- ✅ JWT-based user authentication (register/login)
- ✅ Event creation with validation and ownership control
- ✅ Event registration with constraints:
  - No double registration
  - No registration for full or past events
- ✅ Cancel event registration
- ✅ View upcoming events sorted by date & location
- ✅ View event stats (capacity usage)
- ✅ Only event **creators** can edit or delete their events

---

## 🧱 Project Structure

```
event-management-api/
├── controllers/         # All route logic
├── routes/              # All route handlers
├── middlewares/         # Authentication middleware
├── config/              # Database connection
├── app.js               # Main app entry
├── .env                 # Environment config (not committed)
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/Udit-Nayak/event-management.git
cd event-management-api
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment Variables**

Create a `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=eventdb
PORT=3000
```

4. **Start the Server**
```bash
npm run dev
```

---

## 🔐 Authentication

- JWT is used for securing private routes.
- Token is returned on login and required in `Authorization` header for protected endpoints.

---

## 📤 API Endpoints

### 🔐 Auth

| Method | Endpoint         | Description         |
|--------|------------------|---------------------|
| POST   | `/auth/register` | Register new user   |
| POST   | `/auth/login`    | Login and get token |

---

### 📅 Events

| Method | Endpoint              | Description                                |
|--------|-----------------------|--------------------------------------------|
| POST   | `/events/createEvent` | Create a new event (requires auth)         |
| GET    | `/events/upcoming`    | Get all upcoming events (sorted)           |
| GET    | `/events/:id`         | Get event details + registered users       |
| PUT    | `/events/:id`         | Update event (only creator allowed)        |
| DELETE | `/events/:id`         | Delete event (only creator allowed)        |
| GET    | `/events/:id/stats`   | Get statistics for an event                |

---

### 📌 Registration

| Method | Endpoint                              | Description                                   |
|--------|----------------------------------------|-----------------------------------------------|
| POST   | `/events/:id/register`                | Register authenticated user to an event      |
| DELETE | `/events/:id/cancel/:userId`          | Cancel a user's registration (auth required) |


---


## 💡 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** bcrypt, JWT
- **Other:** dotenv, pg (PostgreSQL driver)

---
