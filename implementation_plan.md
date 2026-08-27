# Implementation Plan: Jamindan Emergency Response Platform (Node + React Upgrade)

This plan outlines the technical design to upgrade the active Node.js (Express) + React (Vite) + MySQL platform (`C:\Users\huawei\Documents\jamindan-emergency-response`) with Citizen Profiles, Household members checklists, Evacuation Center locators, Hotline directories, and Responder dispatch capabilities.

---

## 💾 Proposed Backend Database Schema Updates

We will modify `backend/config/db.js` to update the database schema automatically when the server restarts.

### 1. Auto-Migration Trigger
To trigger table updates without manual database drops, we will update the compatibility check in `db.js` to look for `blood_type`. If it does not exist, the server will drop the old schema and recreate it with the updated layout:
```javascript
const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'blood_type'");
if (columns.length === 0) {
  needsClean = true;
}
```

### 2. Table Column Extensions
* **`users` Table:**
  * Add `purok_sitio VARCHAR(100) NULL`
  * Add `blood_type VARCHAR(5) NULL`
  * Add `allergies TEXT NULL`
  * Add `medical_conditions TEXT NULL`
  * Add `emergency_contact_name VARCHAR(100) NULL`
  * Add `emergency_contact_phone VARCHAR(20) NULL`
* **`incidents` Table:**
  * Add `responder_id INT NULL` (References `users.id`)
  * Add `response_notes TEXT NULL`
  * Add `resources_used TEXT NULL`
  * Add foreign key reference to `responder_id`

### 3. New Tables
* **`household_members` Table:**
  * `id` INT AUTO_INCREMENT PRIMARY KEY
  * `user_id` INT NOT NULL (Foreign key to `users.id`)
  * `full_name` VARCHAR(100) NOT NULL
  * `age` INT NOT NULL
  * `gender` VARCHAR(10) NOT NULL
  * `medical_notes` TEXT NULL
* **`evacuation_centers` Table:**
  * `id` INT AUTO_INCREMENT PRIMARY KEY
  * `name` VARCHAR(100) NOT NULL
  * `location` VARCHAR(255) NOT NULL
  * `capacity` INT NOT NULL
  * `current_headcount` INT DEFAULT 0
  * `status` VARCHAR(20) DEFAULT 'Closed' -- 'Open', 'Full', 'Closed'
  * `latitude` DECIMAL(10, 8) NULL
  * `longitude` DECIMAL(11, 8) NULL
* **`hotlines` Table:**
  * `id` INT AUTO_INCREMENT PRIMARY KEY
  * `agency_name` VARCHAR(100) NOT NULL
  * `contact_number` VARCHAR(50) NOT NULL
  * `barangay` VARCHAR(100) NULL -- NULL if municipal-wide

---

## 🛣️ Backend API Route Additions

We will create and mount new endpoints:
1. **User Profile & Registration (`routes/authRoutes.js`):**
   * Support the new medical, purok, and emergency contact details during registration and profile updates.
2. **Household Manager Route (`routes/userRoutes.js`):**
   * `GET /api/users/household` - Retrieve own household members list.
   * `POST /api/users/household` - Add a new household member.
   * `DELETE /api/users/household/:id` - Delete a household member.
3. **Evacuation Centers Route (`routes/incidentRoutes.js` or new file):**
   * `GET /api/evacuation-centers` - Public list for citizens.
   * `POST`, `PUT`, `DELETE` routes for Admin/Responder management.
4. **Hotlines Directory Route:**
   * `GET /api/hotlines` - Retrieve hotlines directory.

---

## 🎨 React Frontend Pages & Navigation Updates

We will add new routes and views under `frontend/src`:

### 1. Component Sidebar (`components/Sidebar.jsx`)
Add navbar menu options under appropriate role checks:
* **Resident:** add "Household", "Evacuation Centers", and "Hotlines".
* **Admin/Responder:** add "Evacuation Centers Management" and "Hotlines Directory".

### 2. User Profile View (`pages/UserProfile.jsx`)
Add forms for Purok/Sitio selection, emergency contact info, and medical fields (blood type, allergies, conditions).

### 3. Report Incident View (`pages/ReportIncident.jsx`)
* Integrate Leaflet map coordinates capture (allowing users to pick GPS coordinates directly).
* Add an **Offline SMS Generator** panel at the bottom, updating text in real-time as citizens type details.

### 4. New Frontend Pages [NEW]
* **`pages/Household.jsx`:** Checklists and headcounts manager.
* **`pages/EvacuationCenters.jsx`:** Active shelters directory + capacity bar chart + Leaflet markers locator map.
* **`pages/Hotlines.jsx`:** Directory layout grouping municipal vs barangay hotlines.

---

## 🔍 Verification Plan

### Automated Checks
* Launch development servers (`npm run dev`) and test if the migration hook drops/recreates tables successfully.
* Verify API response structure using curl/fetch tests.

### Manual Scenarios
1. **Resident Flow:** Complete register/login, edit profile medical fields, manage household lists, place a Leaflet map incident marker, and check the offline SMS generator.
2. **Admin/Responder Flow:** Open the dashboard, assign a responder to an active incident, update its status, log resources used, and manage evacuation center lists.
