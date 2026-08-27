# Task List: Jamindan Emergency Response Platform (Node + React Upgrade)

- [x] Update backend database schema (`backend/config/db.js`)
- [x] Update backend API routes
  - [x] authRoutes.js (support registration / profile fields)
  - [x] userRoutes.js (add household members CRUD)
  - [x] Create hotlines and evacuation center endpoints
- [x] Update frontend routing & sidebar navigation
  - [x] Add routes to `frontend/src/App.jsx`
  - [x] Add links to `frontend/src/components/Sidebar.jsx`
- [x] Implement Citizen Frontend Pages
  - [x] Update `UserProfile.jsx` (medical and emergency contact fields)
  - [x] Create `Household.jsx` (headcount and special needs list)
  - [x] Update `ReportIncident.jsx` (Leaflet.js map picker + dynamic SMS offline template)
  - [x] Create `EvacuationCenters.jsx` (capacity stats + map view)
  - [x] Create `Hotlines.jsx` (local rescue emergency directories)
- [x] System Verification & Launch
