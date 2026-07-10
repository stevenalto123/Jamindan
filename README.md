# Jamindan Emergency Response Community Platform

A full-stack, offline-capable incident reporting and management system built for the Municipality of Jamindan, Province of Capiz.

## Project Structure

- `/backend` - Node.js Express server + SQLite database
- `/frontend` - Vite + React frontend client styled with a custom government-service aesthetic (Dark Green theme)

---

## Tech Stack & Features

- **Frontend**: React, React Router v6, Axios, Lucide Icons, Leaflet Maps, Custom plain CSS.
- **Backend**: Node.js, Express, better-sqlite3 (SQLite 3), JWT Authentication, Bcrypt password hashing, Multer for media uploads.
- **Branding**: Official Municipality of Jamindan circular seal logo, dark forest green sidebars, light green accents, and color-coded status timelines.
- **Location Mapping**: OpenStreetMap integrated via Leaflet.js with custom color-coded map pins. No Google Maps API key required.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- `npm` (Node Package Manager)

### Step 1: Set Up and Run the Backend

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   The backend comes with a configured `.env` file containing default settings:
   ```env
   PORT=5000
   JWT_SECRET=jamindan_emergency_response_secret_key_2026_!!
   JWT_EXPIRES_IN=24h
   CLIENT_ORIGIN=http://localhost:5173
   ```
   *(Ensure these ports match your environment setup).*

4. Run the backend development server:
   ```bash
   npm run start
   ```
   The backend uses `better-sqlite3`. On startup, it will automatically check if `database.sqlite` exists, create the required tables, and **seed the default accounts and news advisories**.

### Default Seoded Test Accounts

To log in, use the following pre-configured credentials:

| Role | Username | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `AdminPass123!` | Platform Administrator |
| **Responder** | `responder` | `ResponderPass123!` | Jamindan Municipal Responder |
| **Resident** | `resident` | `ResidentPass123!` | Juan Dela Cruz |

---

### Step 2: Set Up and Run the Frontend

1. Open a new terminal window/tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## Core System Functionalities

1. **Resident Incident Reporting**: Submit reports with description, category, photo attachment (Multer, max 5MB), and latitude/longitude pin picked on Leaflet map or automatically resolved via Geolocation.
2. **Track Status & Timeline**: View incident status logs tracking historical changes (Pending → Under Review → In Progress → Resolved) alongside interactive OpenStreetMap maps displaying the event location.
3. **Command Operations Center Dashboard**: Admin stats dashboard detailing numerical metrics, live alert streams, and custom responsive SVG weekly charts indicating trend rates.
4. **User Directory Management**: Admins can manage all registered accounts (CRUD operations, edit roles, deactivate/activate status, or delete).
5. **In-App Notifications**: Real-time alerts delivered to residents on status changes and admins on new incident submissions.
