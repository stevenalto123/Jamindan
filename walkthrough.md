# Walkthrough: Jamindan Emergency Response Platform (Node + React Upgrade)

We have successfully integrated the complete Emergency Response citizen modules from our technical blueprint directly into your active **Node.js + Express (Backend)** and **React + Vite (Frontend)** codebase.

---

## 🛠️ Changes Implemented

### 1. Database Schema Extensions (`backend/config/db.js`)
* **`users` table:** Added `purok_sitio`, `blood_type`, `allergies`, `medical_conditions`, `emergency_contact_name`, and `emergency_contact_phone` fields.
* **`incidents` table:** Added `responder_id` support for direct dispatcher claiming, plus response log records.
* **New tables provisioned & seeded:**
  * `household_members`: Headcount tracking for family members.
  * `evacuation_centers`: Live shelter capacity tracker (populated with Jamindan Cultural Center, Lucero Gym, etc.).
  * `hotlines`: Local emergency rescue hotline directory (populated with BFP, PNP, RHU, and local Barangay desks).

### 2. Backend API Handlers
* **`authRoutes.js`:** Upgraded to return and update the new medical, purok, and emergency contact details.
* **`householdRoutes.js` [NEW]:** Formulated resident family members CRUD endpoints.
* **`emergencyRoutes.js` [NEW]:** Established centers list, hotlines lookup, and Admin-only shelter capacity editors.

### 3. React Frontend Pages & Navigation
* **`App.jsx`:** Mounted page paths for `/household`, `/evacuation`, and `/hotlines`.
* **`Sidebar.jsx`:** Added corresponding sidebar links for Residents (Household list, shelters map, phone index) and Admins (shelter capacities, hotlines control).
* **`UserProfile.jsx`:** Extended profile details form with stylized sections for blood types, medical flags, and next-of-kin emergency contact details.
* **`ReportIncident.jsx`:** Embedded an **Offline SMS template panel** at the bottom, which builds a real-time message template containing coordinates, type, and details to copy-paste for analog messaging fallback.
* **`Household.jsx` [NEW]:** A headcount dashboard displaying household members and medical alerts, with a family member creator.
* **`EvacuationCenters.jsx` [NEW]:** An interactive Leaflet map marking shelter locations. Features real-time capacity progress bars that turn red when occupancy is critical, and a map click coordinate picker.
* **`Hotlines.jsx` [NEW]:** Responsive grid formatting for local hotlines, with tap-to-call dialing links.

---

## 🔍 How to Verify the Changes

Run the dev environment, open **`http://localhost:5173/`**, and verify the new features using these roles:

### 1. Resident/Citizen Flow (`resident` / `ResidentPass123!`)
* **Profile Settings:** Navigate to **Profile** and edit your Purok, select a blood type, type an allergy, and add your next of kin. Save to verify database writing.
* **Household List:** Go to **Household List** and add test family members with ages, gender, and specialized medical notes. Try deleting one to test the CRUD lifecycle.
* **Report Incident & GPS Picker:** Go to **Report Incident**. Move the Leaflet pin or click **Detect GPS Location** to capture coordinates. Type description details and verify that the **Offline SMS template box** at the bottom compiles your coordinate/incident details instantly.
* **Evacuation Centers Map:** Open **Evacuation Centers**. Select a shelter from the list on the right and watch the Leaflet map center and open its details popup.
* **Emergency Hotlines:** Open **Emergency Hotlines** and verify that you see BFP, PNP, and local barangay phone links grouped correctly.

### 2. Admin Flow (`admin` / `AdminPass123!`)
* **Evacuation Centers Management:** Log in as Admin and open **Evacuation Centers**. Tap **New Center**, click anywhere on the Leaflet map to grab coordinates, fill in details, and save. Check that you can also edit existing shelter occupancy headcounts or status (Open, Full, Closed) dynamically.
