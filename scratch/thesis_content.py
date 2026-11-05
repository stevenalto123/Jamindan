# -*- coding: utf-8 -*-
"""
Complete thesis content definitions for Jamindan Emergency Response Community Platform
Strictly matching the Filamer Christian University CCS Capstone Outline & Format Guidelines.
"""

TOC_ITEMS = [
    ("TITLE PAGE", "i", 0),
    ("TABLE OF CONTENTS", "ii", 0),
    ("LIST OF TABLES", "iv", 0),
    ("LIST OF FIGURES", "v", 0),
    ("LIST OF APPENDICES", "vii", 0),
    ("CHAPTER I - INTRODUCTION", "1", 0),
    ("1.1. Overview of the Current State of Technology", "1", 0.25),
    ("1.2. Desired State of Technology", "5", 0.25),
    ("1.3. Statement of the Problem", "7", 0.25),
    ("1.4. Objectives of the Study", "8", 0.25),
    ("1.4.1. General Objective", "8", 0.5),
    ("1.4.2. Specific Objectives", "8", 0.5),
    ("1.5. Theoretical and Conceptual Frameworks", "9", 0.25),
    ("1.5.1. Theoretical Framework", "10", 0.5),
    ("1.5.2. Conceptual Framework", "12", 0.5),
    ("1.6. Operational Definition of Terms", "15", 0.25),
    ("1.7. Scope and Limitations of the Study", "19", 0.25),
    ("1.8. Significance of the Study", "22", 0.25),
    ("CHAPTER II - REVIEW OF RELATED LITERATURE AND STUDIES", "24", 0),
    ("Foreign Literature and Studies", "25", 0.25),
    ("Local Literature and Studies", "32", 0.25),
    ("Synthesis and Research Gap", "41", 0.25),
    ("CHAPTER III - METHODOLOGY", "42", 0),
    ("3.1. Research Design", "42", 0.25),
    ("3.2. System Development Methodology", "43", 0.25),
    ("3.3. Data Gathering Procedures", "44", 0.25),
    ("3.4. System Development Procedures", "46", 0.25),
    ("3.5. System Evaluation", "61", 0.25),
    ("3.6. Data Analysis", "62", 0.25),
    ("CHAPTER IV - SYSTEM IMPLEMENTATION, RESULTS, AND DISCUSSION", "65", 0),
    ("4.1. System Overview", "65", 0.25),
    ("4.2. System Architecture", "67", 0.25),
    ("4.3. Database Design", "74", 0.25),
    ("4.4. System Modules and Functionalities", "77", 0.25),
    ("4.5. User Interface Design", "90", 0.25),
    ("4.6. System Testing", "93", 0.25),
    ("4.7. System Evaluation Results", "96", 0.25),
    ("4.8. Discussion of Results", "99", 0.25),
    ("CHAPTER V - SUMMARY, CONCLUSIONS, AND RECOMMENDATIONS", "102", 0),
    ("5.1. Summary of the Study", "102", 0.25),
    ("5.2. Conclusions", "104", 0.25),
    ("5.3. Recommendations", "105", 0.25),
    ("5.3.1. System Improvements", "105", 0.5),
    ("5.3.2. Implementation Recommendations", "106", 0.5),
    ("5.3.3. Recommendations for Future Researchers", "107", 0.5),
    ("BIBLIOGRAPHY", "109", 0),
    ("APPENDICES", "113", 0),
    ("Appendix A: Project Gantt Chart", "114", 0.25),
    ("Appendix B: Organizational Structure & Emergency Flow", "116", 0.25),
    ("Appendix C: Process & UML Diagrams", "118", 0.25),
    ("Appendix D: Entity-Relationship Diagram (ERD)", "122", 0.25),
    ("Appendix E: System Architecture & Deployment Network Diagram", "125", 0.25),
    ("Appendix F: Screen Layouts & User Interface Designs", "127", 0.25),
    ("Appendix G: Relevant Source Code Excerpts", "131", 0.25),
    ("Appendix H: ISO/IEC 25010 Evaluation Tool", "135", 0.25),
    ("Appendix I: System Test Case Results Sheet", "138", 0.25),
    ("Appendix J: Sample Inputs, Outputs, and Reports", "141", 0.25),
    ("Appendix K: User's Guide / Manual", "144", 0.25),
    ("Appendix L: Photos of Data Gathering & Investigation", "147", 0.25),
    ("Appendix M: Curriculum Vitae of Team Members", "150", 0.25),
    ("M.1. Vacaro, Fredell", "151", 0.5),
    ("M.2. Relano, Jason Ysrael B.", "152", 0.5),
    ("M.3. Altoveros, Jhon Steven", "153", 0.5),
    ("M.4. Comparacion, Justin", "154", 0.5),
    ("M.5. Manalad, John Ruselle", "155", 0.5),
    ("M.6. Paderes, Jyrus Dale", "156", 0.5),
]

TABLES_LIST = [
    ("Table 1", "Comparison of Existing Emergency Response Processes and the Proposed Emergency Response Community Platform", "3"),
    ("Table 2", "Synthesis of Global Related Systems", "39"),
    ("Table 3", "Synthesis of Local Related Systems", "40"),
    ("Table 4.1", "Server Hardware Specifications (Production & Staging Environment)", "68"),
    ("Table 4.2", "Client Hardware Specifications (Resident Smartphones & Responder Tablets)", "68"),
    ("Table 4.3", "System Software Environment & Technology Stack Specifications", "69"),
    ("Table 4.4", "Cost of Development and System Depreciation Schedule", "70"),
    ("Table 4.5", "Database Schema Specifications & Data Dictionary", "75"),
    ("Table 4.6", "System Testing Test Cases Summary (Unit, Integration, System, and UAT)", "94"),
    ("Table 4.7", "ISO/IEC 25010 Software Quality Evaluation Results (IT Experts and End Users)", "97"),
]

FIGURES_LIST = [
    ("Figure 1", "Theoretical Framework of the Emergency Response Community Platform based on the Task-Technology Fit Theory", "12"),
    ("Figure 2", "Conceptual Framework of the Emergency Response Community Platform using the IPO Model", "14"),
    ("Figure 3", "Ushahidi (Global Disaster Mapping Platform)", "25"),
    ("Figure 4", "Safety Tips (Japan Tourism Disaster Application)", "26"),
    ("Figure 5", "PulsePoint Respond (Global Citizen First-Responder App)", "28"),
    ("Figure 6", "GDACS Global Disaster Alert and Coordination System", "29"),
    ("Figure 7", "MyHazards (California Emergency Services System)", "31"),
    ("Figure 8", "My Naga App (Local Municipal System - Philippines)", "32"),
    ("Figure 9", "iAlerto (Pasig City Disaster Management Platform)", "33"),
    ("Figure 10", "Local LGU Facebook Pages / SMS Emergency Hotlines", "35"),
    ("Figure 11", "Advisory and Emergency Assistance System (AEAS) - Makati City", "36"),
    ("Figure 12", "HazardHunterPH / GeoRiskPH (National Example - Philippines)", "38"),
    ("Figure 13", "Agile Scrum System Development Life Cycle", "45"),
    ("Figure 14", "Resident Homepage, 3-Second SOS Panic Trigger & Balanced Safety Check-In", "78"),
    ("Figure 15", "Offline-First SOS Emergency Queue & Satellite GPS Locking Beacon", "79"),
    ("Figure 16a", "Mobile Incident Reporting Wizard (Step 1: Emergency Categorization & Evidence)", "80"),
    ("Figure 16b", "Mobile Incident Reporting Wizard (Step 2: Location Pinpoint, Description & SMS Generator)", "81"),
    ("Figure 17", "Track Incident Status & Operational Timeline", "82"),
    ("Figure 18", "News & Municipal Disaster Advisories Page", "82"),
    ("Figure 19", "Emergency Safety Tips & First-Aid Knowledge Base", "83"),
    ("Figure 20", "Emergency Hotlines Directory (Overhauled Mobile View)", "83"),
    ("Figure 21", "Administrative Authentication & 'Go On Duty' Audio Siren Unlock", "84"),
    ("Figure 22", "Administrative Command Dashboard", "84"),
    ("Figure 23", "Command Map & Real-Time GIS Fleet Tracking", "85"),
    ("Figure 24", "Incident Management Inbox & False Alarm Triage", "85"),
    ("Figure 25a", "Evacuation Centers Directory & Capacity Management", "86"),
    ("Figure 25b", "Evacuation Center Smart Route Navigation & Floating Control Bar", "86"),
    ("Figure 26", "Household Vulnerability Profiling Module", "87"),
    ("Figure 27", "Emergency Fleet & Responder Management", "87"),
    ("Figure 28", "User Management & Citizen ID Verification", "88"),
    ("Figure 29", "Emergency Broadcast Siren Dispatcher", "88"),
    ("Figure 30a", "Generate Reports & Analytics (Desktop Data Tables & PDF/CSV Export)", "89"),
    ("Figure 30b", "Admin Analytics Responsive Mobile Card Feeds", "89"),
    ("Figure 31", "Admin / Dispatcher Use Case Diagram", "71"),
    ("Figure 32", "Field Responder Use Case Diagram", "71"),
    ("Figure 33", "Resident / Citizen Use Case Diagram", "72"),
    ("Figure 34", "Admin Dispatcher Incident Management Sequence Diagram", "72"),
    ("Figure 35", "Resident Emergency SOS (Online vs. Offline Queue) Sequence Diagram", "73"),
    ("Figure 36", "Resident Incident Reporting Activity Diagram (2-Step Wizard)", "73"),
    ("Figure 37", "Admin Incident Dispatch & False Alarm Activity Diagram", "74"),
    ("Figure 38", "Network Layout of the System", "74"),
]

APPENDICES_LIST = [
    ("Appendix A", "Project Gantt Chart", "114"),
    ("Appendix B", "Organizational Structure & Emergency Response Communication Flow", "116"),
    ("Appendix C", "Process, Data, and Information Flow Diagrams (UML & DFD Synthesis)", "118"),
    ("Appendix D", "Entity-Relationship Diagram (ERD) & Database Schema Data Dictionary", "122"),
    ("Appendix E", "System Architecture & Deployment Network Diagram", "125"),
    ("Appendix F", "Screen Layouts & User Interface Designs (Desktop & Mobile Wireframes)", "127"),
    ("Appendix G", "Relevant Source Code Excerpts (Emergency WebSocket, SMS Fallback, Haversine)", "131"),
    ("Appendix H", "ISO/IEC 25010 Software Quality Evaluation Instrument & Survey Questionnaire", "135"),
    ("Appendix I", "System Test Case Results Sheet", "138"),
    ("Appendix J", "Sample Inputs, Outputs, and Generated Emergency Reports", "141"),
    ("Appendix K", "Resident & Responder Quick User Guide / Manual", "144"),
    ("Appendix L", "Field Investigation & MDRRMO Jamindan Facility Documentation", "147"),
    ("Appendix M", "One-Page Curriculum Vitae of Each Team Member", "150"),
]

# Hardware specifications for Table 4.1 & 4.2
SERVER_HW_HEADERS = ["Component", "Minimum Requirement", "Recommended Specification", "Purpose"]
SERVER_HW_ROWS = [
    ["Processor (CPU)", "Intel Core i5 (8th Gen) or AMD Ryzen 5", "Intel Core i7 / Xeon 8-Core 3.2 GHz", "Handles concurrent WebSocket threads & REST APIs"],
    ["System Memory (RAM)", "8 GB DDR4", "16 GB - 32 GB DDR4/DDR5", "Ensures zero latency under high-load emergency spikes"],
    ["Storage (SSD)", "256 GB NVMe SSD", "512 GB - 1 TB NVMe SSD (M.2)", "Rapid transaction logging, caching & database reads"],
    ["Network Interface", "100 Mbps Ethernet", "1 Gbps Dedicated Fiber Connection", "Real-time bidirectional packet dispatch with <300ms latency"],
    ["Power Redundancy", "1000VA Desktop UPS", "2000VA Online Smart UPS + Generator", "Guarantees 24/7 uptime during municipal grid blackouts"]
]

CLIENT_HW_HEADERS = ["Device Type", "Minimum Hardware Specification", "Operating System", "Target User Group"]
CLIENT_HW_ROWS = [
    ["Resident Smartphone", "Quad-Core 1.8 GHz, 2GB RAM, GPS chip, Camera", "Android 8.0+ or iOS 13+", "Jamindan Citizens & Eyewitnesses"],
    ["Field Responder Tablet", "Octa-Core 2.0 GHz, 4GB RAM, Rugged casing, 4G LTE", "Android 10.0+ / iPadOS", "BFP, PNP, RHU & MDRRMO Responders"],
    ["Dispatch Workstation", "Intel Core i5, 16GB RAM, Dual 24-inch 1080p Monitors", "Windows 10/11 Pro (64-bit)", "MDRRMO Command Center Dispatchers"]
]

SOFTWARE_HEADERS = ["Layer / Domain", "Technology / Tool", "Version", "Role in System Architecture"]
SOFTWARE_ROWS = [
    ["Frontend Framework", "React.js with Vite", "18.3.1", "Responsive reactive user interface & component lifecycle"],
    ["Styling & Icons", "Tailwind CSS & Lucide React", "3.4.1", "High-contrast emergency styling & iconography"],
    ["Geographic Mapping", "Leaflet GIS & Leaflet Routing", "1.9.4", "Interactive municipal map, shelter routes & GPS markers"],
    ["Backend Runtime", "Node.js (LTS)", "20.18.0", "Asynchronous non-blocking event-driven backend server"],
    ["Web Application Framework", "Express.js", "4.19.2", "RESTful JSON API endpoints, routing & middleware"],
    ["Real-Time Protocol", "Socket.IO", "4.7.5", "Bi-directional WebSocket streaming for sirens & GPS"],
    ["Database Cluster", "MySQL Relational Cluster", "8.0", "Persistent ACID-compliant relational data management"],
    ["Media & CDN Storage", "Cloudinary Media CDN", "API v2", "Cloud photo evidence optimization & CDN delivery"],
    ["Offline Service Worker", "Workbox PWA Engine", "7.0.0", "IndexedDB offline queue & background synchronizer"],
    ["Development & Tools", "VS Code, Git, Postman, Chrome DevTools", "Latest", "Software engineering, version control & API testing"]
]

COST_HEADERS = ["Expense Item", "Category", "Quantity / Duration", "Estimated Cost (PHP)"]
COST_ROWS = [
    ["Command Center Server Workstation", "Hardware", "1 Unit", "₱45,000.00"],
    ["Dual 24-inch Dispatch Monitors", "Hardware", "2 Units", "₱16,000.00"],
    ["Heavy-Duty Smart Online UPS (1500VA)", "Hardware", "1 Unit", "₱12,500.00"],
    ["Dedicated 4G/LTE Emergency Mobile Router", "Hardware", "2 Units", "₱8,000.00"],
    ["Domain Registration & SSL Certification", "Software / Cloud", "1 Year", "₱2,200.00"],
    ["Cloud VPS Hosting & Relational Database", "Software / Cloud", "1 Year Subscription", "₱14,400.00"],
    ["Cloud Media CDN Storage Bandwidth", "Software / Cloud", "Tier 1 Plan", "₱6,000.00"],
    ["Total Initial Capital Outlay", "Summary", "-", "₱104,100.00"]
]

DEPRECIATION_HEADERS = ["Asset Name", "Acquisition Cost", "Useful Life", "Annual Depreciation", "Monthly Depreciation"]
DEPRECIATION_ROWS = [
    ["Server Workstation & Dual Monitors", "₱61,000.00", "5 Years", "₱12,200.00", "₱1,016.67"],
    ["Uninterruptible Power Supply (UPS)", "₱12,500.00", "3 Years", "₱4,166.67", "₱347.22"],
    ["Mobile Networking Equipment", "₱8,000.00", "3 Years", "₱2,666.67", "₱222.22"],
    ["Total Annual Hardware Depreciation", "₱81,500.00", "-", "₱19,033.34", "₱1,586.11"]
]

DB_SCHEMA_HEADERS = ["Table / Collection", "Primary Key", "Key Attributes & Data Types", "Foreign Relationships & Description"]
DB_SCHEMA_ROWS = [
    ["users", "user_id (INT/UUID)", "name, email, password_hash, phone, role, barangay, is_verified, id_photo_url", "Primary entity storing citizens, dispatchers, responders, and admins with RBAC."],
    ["incidents", "incident_id (INT/UUID)", "caller_name, caller_phone, category, status, priority, latitude, longitude, address, description, photo_url, dynamic_details (JSON), reported_at", "Tracks emergency incidents reported by citizens or operators. Links to responders."],
    ["responders", "responder_id (INT/UUID)", "name, agency (MDRRMO/PNP/BFP/RHU), unit_type, status, current_lat, current_lng, contact_num", "Maintains field rescue units, active coordinates, and real-time operational availability."],
    ["evacuation_centers", "center_id (INT/UUID)", "name, address, barangay, latitude, longitude, capacity, current_occupants, status, facilities (JSON)", "Catalogs municipal evacuation shelters, real-time capacities, and geographic pins."],
    ["broadcast_alerts", "alert_id (INT/UUID)", "headline, message, severity_level, target_barangays, created_by, created_at, audio_siren", "Stores municipal disaster alerts and weather warnings emitted across WebSockets."],
    ["households", "household_id (INT/UUID)", "head_name, address, barangay, phone, vulnerable_members (JSON), gps_lat, gps_lng", "Profiles community vulnerability (senior citizens, PWDs, infants, pregnant mothers)."],
    ["audit_logs", "log_id (INT/UUID)", "user_id, action_taken, target_module, ip_address, timestamp, details", "Maintains immutable security and compliance audit trails for all administrative actions."]
]

TEST_CASES_HEADERS = ["Test ID", "Test Scenario & Module", "Input / Trigger Condition", "Expected System Output", "Actual Result", "Status"]
TEST_CASES_ROWS = [
    ["TC-01", "User Registration & ID Upload", "Submit valid email, phone, password, and valid photo ID", "Account staged in database; verification status set to 'Pending'", "Account registered; pending badge rendered in Admin panel", "PASSED"],
    ["TC-02", "Role-Based Authentication", "Log in as Resident, attempt to access /admin route", "System prevents access; redirects to unauthorized warning modal", "Access blocked; redirected to /login with permission alert", "PASSED"],
    ["TC-03", "3-Second SOS Panic Trigger", "Press and hold SOS button for 3.0 continuous seconds", "Triggers high-accuracy GPS lookup; emits emergency ticket via Socket.IO", "Coordinates locked; ticket transmitted in 210ms; siren sounds", "PASSED"],
    ["TC-04", "Offline SOS Fallback Queue", "Trigger SOS while device is in Airplane Mode (No Signal)", "Staged in IndexedDB; displays offline banner & pre-populated SMS link", "Alert queued offline; SMS body populated with coordinates", "PASSED"],
    ["TC-05", "Offline-to-Online Auto Sync", "Restore network connectivity after offline incident staging", "Workbox Service Worker detects connection; syncs queue to cloud", "Pending ticket synced automatically without user intervention", "PASSED"],
    ["TC-06", "Incident Reporting Validation", "Submit 2-Step form without filling required dynamic questions", "Form stops progression; displays red banner & scrolls to missing fields", "Scrolls to uncompleted fields; highlights red input borders", "PASSED"],
    ["TC-07", "Leaflet Map Location Pinpoint", "Drag GPS marker or click anywhere on Jamindan map", "Latitude and Longitude auto-updated; reverse geocode landmark displayed", "Coordinates accurately updated to 6 decimal precision", "PASSED"],
    ["TC-08", "Admin Audio Siren Unlock", "Dispatcher clicks 'Go On Duty' button in modal", "Web AudioContext resumes; unlocks audio playback for incoming alarms", "Audio unlocked; incoming siren plays at full volume instantly", "PASSED"],
    ["TC-09", "Real-Time Siren Broadcast", "Resident submits emergency incident from mobile client", "Admin Command Dashboard sounds siren & flashes red alert card", "Siren activated within 240ms across WebSocket event bus", "PASSED"],
    ["TC-10", "Incident Triage & False Alarm", "Dispatcher flags nuisance ticket as 'False Alarm' with reason", "Ticket marked resolved; logged in audit log; removed from active triage", "Status updated to False Alarm; audit record logged successfully", "PASSED"],
    ["TC-11", "Field Unit Dispatch Assignment", "Assign BFP Engine 1 to validated structural fire incident", "Incident status set to 'Dispatched'; notification sent to responder", "BFP responder alerted; vehicle marker status updated on map", "PASSED"],
    ["TC-12", "Evacuation Route Navigation", "Resident clicks 'Get Route' to Jamindan Civic Center", "Leaflet calculates driving route; displays distance, ETA & control bar", "Displays route line, 3.4km distance, 8 min ETA, clear route button", "PASSED"],
    ["TC-13", "Household Vulnerability Record", "Add household with 2 seniors and 1 infant in Brgy. Poblacion", "Profile saved; flags household on evacuation vulnerability index", "Household saved; high-risk badge rendered in disaster view", "PASSED"],
    ["TC-14", "Emergency Broadcast Siren", "Admin issues Level 3 Typhoon Warning to all barangays", "WebSocket emits broadcast; full-screen audio warning displayed to residents", "Warning banner & audible alert received on all active clients", "PASSED"],
    ["TC-15", "Monthly Summary PDF/CSV Export", "Admin generates monthly incident report for October 2026", "Compiles table; generates printable PDF and downloadable CSV file", "CSV and PDF files generated with exact municipal metrics", "PASSED"]
]

EVAL_HEADERS = ["ISO/IEC 25010 Quality Characteristic", "IT Experts (n=10)", "End Users (n=30)", "Overall Mean", "Verbal Interpretation"]
EVAL_ROWS = [
    ["1. Functional Suitability (Completeness & Correctness)", "4.88", "4.82", "4.85", "Excellent / Highly Acceptable"],
    ["2. Performance Efficiency (Response Time & Resource Utilization)", "4.68", "4.62", "4.65", "Excellent / Highly Acceptable"],
    ["3. Compatibility (Cross-Platform & Device Interoperability)", "4.72", "4.68", "4.70", "Excellent / Highly Acceptable"],
    ["4. Usability (Learnability, Accessibility & Interface Clarity)", "4.75", "4.81", "4.78", "Excellent / Highly Acceptable"],
    ["5. Reliability (Fault Tolerance & Offline Continuity)", "4.70", "4.74", "4.72", "Excellent / Highly Acceptable"],
    ["6. Security (Authentication, RBAC & Data Privacy)", "4.85", "4.75", "4.80", "Excellent / Highly Acceptable"],
    ["7. Maintainability (Modularity & Code Extensibility)", "4.70", "4.66", "4.68", "Excellent / Highly Acceptable"],
    ["8. Portability (Adaptability across Mobile & Web Environments)", "4.76", "4.74", "4.75", "Excellent / Highly Acceptable"],
    ["Overall Grand Weighted Mean", "4.76", "4.73", "4.74", "Excellent / Highly Acceptable"]
]

BIBLIOGRAPHY_LIST = [
    "Baudoin, M.-A., Henly-Shepard, S., Fernando, N., Sitati, A., & Zommers, Z. (2016). From top-down to 'community-centric' approaches to early warning systems: Exploring pathways to improve disaster risk reduction through community participation. International Journal of Disaster Risk Science, 7, 163-174. https://doi.org/10.1007/s13753-016-0085-6",
    "California Governor's Office of Emergency Services. (2024). MyHazards. State of California. https://myhazards.caloes.ca.gov",
    "City Government of Makati. (2024). Makati Disaster Risk Reduction and Management Office (MDRRMO). City Government of Makati. https://www.makati.gov.ph",
    "City Government of Naga. (2024). My Naga App. City Government of Naga. https://mynaga.com",
    "Department of Science and Technology. (2024). HazardHunterPH. GeoRisk Philippines. https://hazardhunter.georisk.gov.ph",
    "Department of the Interior and Local Government. (2024). Official local government communication channels for public information and emergency services. Republic of the Philippines. https://www.dilg.gov.ph",
    "Dorasamy, M., Raman, M., & Kaliannan, M. (2017). Integrated community emergency management and awareness system: A knowledge management system for disaster support. Technological Forecasting and Social Change, 121, 139-167. https://doi.org/10.1016/j.techfore.2017.03.017",
    "Federal Emergency Management Agency. (n.d.). Glossary. Emergency Management Institute. https://training.fema.gov/is/course/glossary.aspx",
    "Global Disaster Alert and Coordination System. (2024). GDACS disaster coordination platform. United Nations & European Commission. https://www.gdacs.org",
    "GPS.gov. (n.d.). Global Positioning System. National Coordination Office for Space-Based Positioning, Navigation, and Timing. https://www.gps.gov/gps/",
    "Japan Tourism Agency. (2024). Safety Tips: Disaster information app for international travelers. Ministry of Land, Infrastructure, Transport and Tourism. https://www.jnto.go.jp/safety-tips/",
    "MDN Web Docs. (n.d.-a). Notifications API. Mozilla Corporation. https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API",
    "MDN Web Docs. (n.d.-b). Progressive web applications (PWAs). Mozilla Corporation. https://developer.mozilla.org/en-US/docs/Glossary/Progressive_web_apps",
    "MDN Web Docs. (n.d.-c). WebRTC API. Mozilla Corporation. https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API",
    "National Institute of Standards and Technology. (n.d.-a). Audit log. Computer Security Resource Center. https://csrc.nist.gov/glossary/term/audit_log",
    "National Institute of Standards and Technology. (n.d.-b). Role-based access control (RBAC). Computer Security Resource Center. https://csrc.nist.gov/glossary/term/role_based_access_control",
    "Nieles, M., Dempsey, K., & Pillitteri, V. Y. (2017). An introduction to information security (NIST Special Publication 800-12, Revision 1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-12r1",
    "Nuevas, L. K., Velarde, J. L. C., Javellana, J. B. A., & Torlao, J. R. E. (2024). Real-time incident reporting and emergency response: A GPS app for Abuyog, Leyte, Philippines. 2024 Seventh International Conference on Vocational Education and Electrical Engineering (ICVEE), 37-43. https://doi.org/10.1109/ICVEE63912.2024.10823942",
    "Pasig City Government. (2024). iAlerto: Integrated emergency response and alert platform. Pasig City Disaster Risk Reduction and Management Office. https://ialerto.pasigcity.gov.ph",
    "PulsePoint Foundation. (2024). PulsePoint Respond: Connected citizen emergency response platform. PulsePoint Foundation. https://www.pulsepoint.org",
    "Ramos, J. M., & Cruz, A. (2021). Mainstreaming disaster risk reduction and climate change adaptation in comprehensive development planning of the cities in Nueva Ecija in the Philippines. International Journal of Disaster Risk Science, 12, 45-58. https://doi.org/10.1007/s13753-021-00351-9",
    "Republic Act No. 10121: Philippine Disaster Risk Reduction and Management Act of 2010. (2010). Official Gazette of the Republic of the Philippines. https://lawphil.net/statutes/repacts/ra2010/ra_10121_2010.html",
    "Republic Act No. 10173: Data Privacy Act of 2012. (2012). National Privacy Commission of the Philippines. https://www.privacy.gov.ph/data-privacy-act/",
    "Sterlacchini, S., Ballabio, C., Masetti, M., Bosco, F., & Cavallin, A. (2018). SIRENE: A spatial data infrastructure to enhance communities' resilience to disaster-related emergency. International Journal of Disaster Risk Science, 9, 129-142. https://doi.org/10.1007/s13753-018-0160-2",
    "Ushahidi. (2024). Ushahidi crowdsourcing and crisis mapping platform. Ushahidi Inc. https://www.ushahidi.com",
    "Waidyanatha, N., Tanaka, Y., et al. (2020). 'What is a sociologist doing here?' An unconventional people-centered approach to improve warning implementation in the Sendai Framework for Disaster Risk Reduction. International Journal of Disaster Risk Science, 11, 201-215. https://doi.org/10.1007/s13753-020-00262-1"
]

AUTHORS_CV = [
    {
        "num": "M.1",
        "name": "FREDELL VACARO",
        "role": "Lead System Architect & Backend Developer",
        "dob": "November 14, 2002",
        "address": "Poblacion, Jamindan, Capiz, Philippines",
        "phone": "+63 948 522 4345",
        "email": "fredell.vacaro@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (STEM Strand)", "Jamindan National High School, Jamindan, Capiz")
        ],
        "skills": [
            "Programming: JavaScript (Node.js, Express), Python, SQL, C#",
            "Databases & Cloud: MySQL, MongoDB, Redis, Render Cloud, Aiven",
            "Protocols & APIs: Socket.IO, WebSockets, RESTful API Design, JWT, OAuth 2.0",
            "Tools: Git, GitHub, Docker, Postman, Linux Server Administration"
        ],
        "role_desc": "Architected the backend real-time communications engine using Node.js and Socket.IO. Engineered the administrative emergency siren dispatcher, automated deduplication guard, and MySQL relational database schemas for high-concurrency incident logging."
    },
    {
        "num": "M.2",
        "name": "JASON YSRAEL B. RELANO",
        "role": "Full-Stack Engineer & Mobile PWA Specialist",
        "dob": "January 22, 2003",
        "address": "Roxas City, Capiz, Philippines",
        "phone": "+63 927 834 1920",
        "email": "jason.relano@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (TVL - ICT Strand)", "Capiz National High School, Roxas City, Capiz")
        ],
        "skills": [
            "Frontend: React.js, Vite, Tailwind CSS, HTML5, CSS3, JavaScript (ES6+)",
            "Mobile & PWA: Progressive Web Apps, Workbox, Service Workers, IndexedDB",
            "Mapping: Leaflet GIS, OpenStreetMap, Leaflet Routing Machine, Geolocation API",
            "Tools: Visual Studio Code, Git, Chrome DevTools, Figma, Vercel"
        ],
        "role_desc": "Developed the responsive React frontend and Progressive Web Application (PWA) client. Implemented the 3-second SOS panic trigger, the 2-step reporting wizard with dynamic category validation, and the offline-first IndexedDB queue with GSM SMS fallback."
    },
    {
        "num": "M.3",
        "name": "JHON STEVEN ALTOVEROS",
        "role": "GIS Integration & Frontend Developer",
        "dob": "August 17, 2002",
        "address": "Mambusao / Jamindan, Capiz, Philippines",
        "phone": "+63 939 123 7845",
        "email": "jhonsteven.altoveros@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (STEM Strand)", "Mambusao National High School, Mambusao, Capiz")
        ],
        "skills": [
            "Frontend & GIS: React.js, Leaflet, Turf.js, Tailwind CSS, Responsive Design",
            "Geospatial: GPS Coordinate Transformation, Haversine Distance, Mapbox tiles",
            "Web APIs: Web Audio API, HTML5 Geolocation, Fullscreen API",
            "Tools: Git, GitHub, Adobe Photoshop, Figma, VS Code"
        ],
        "role_desc": "Engineered the Interactive Command Map with real-time fleet GPS tracking markers. Designed the Evacuation Center smart route navigation with floating route bar and the responsive Safety Check-In card grid for mobile devices."
    },
    {
        "num": "M.4",
        "name": "JUSTIN COMPARACION",
        "role": "Database Administrator & Quality Assurance Engineer",
        "dob": "March 05, 2003",
        "address": "Jamindan, Capiz, Philippines",
        "phone": "+63 915 678 9012",
        "email": "justin.comparacion@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (GAS Strand)", "Jamindan National High School, Jamindan, Capiz")
        ],
        "skills": [
            "Database: MySQL Server 8.0, SQL Query Optimization, Database Migration, Normalization",
            "Testing: Unit Testing, Integration Testing, System Testing, UAT Protocol Execution",
            "Security: BCrypt Password Hashing, Input Sanitization, Role-Based Access",
            "Tools: MySQL Workbench, Postman, Jest, Excel Data Modeling"
        ],
        "role_desc": "Constructed normalized relational database schemas, foreign key relationships, and stored procedures. Led the execution of 15 system test suites and facilitated User Acceptance Testing (UAT) sessions with MDRRMO and municipal stakeholders."
    },
    {
        "num": "M.5",
        "name": "JOHN RUSELLE MANALAD",
        "role": "Systems Analyst & UI/UX Designer",
        "dob": "October 19, 2002",
        "address": "Roxas City, Capiz, Philippines",
        "phone": "+63 949 234 5678",
        "email": "johnruselle.manalad@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (TVL - ICT Strand)", "Capiz National High School, Roxas City, Capiz")
        ],
        "skills": [
            "UI/UX Design: Figma, Adobe XD, High-Fidelity Prototyping, Wireframing",
            "Systems Analysis: UML Modeling, Process Flowcharts, Context & DFD Diagrams",
            "Standards: ISO/IEC 25010 Software Quality Measurement, Usability Engineering",
            "Tools: Lucidchart, Canva, Git, Markdown, Microsoft Office Suite"
        ],
        "role_desc": "Conducted stakeholder interviews with Jamindan LGU and MDRRMO officials to define functional requirements. Created all high-resolution UML diagrams (Use Case, Sequence, Activity) and conducted ISO/IEC 25010 software quality evaluations."
    },
    {
        "num": "M.6",
        "name": "JYRUS DALE PADERES",
        "role": "Technical Documentation Lead & Security Analyst",
        "dob": "June 12, 2003",
        "address": "Tapaz / Jamindan, Capiz, Philippines",
        "phone": "+63 917 890 1234",
        "email": "jyrusdale.paderes@filamer.edu.ph",
        "education": [
            ("2022 - Present", "Bachelor of Science in Information Technology", "Filamer Christian University, Inc., Roxas City, Capiz"),
            ("2016 - 2022", "Junior and Senior High School (STEM Strand)", "Tapaz National High School, Tapaz, Capiz")
        ],
        "skills": [
            "Documentation: Technical Writing, IEEE/APA Citation, Manuscript Formatting",
            "Security: Data Privacy Act of 2012 (RA 10173), Audit Logging, SSL/TLS",
            "Analytics: Descriptive Statistics, Weighted Mean Analysis, CSV/PDF Reporting",
            "Tools: Microsoft Word, Git, SPSS/Excel Statistics, Markdown"
        ],
        "role_desc": "Directed the preparation of the comprehensive capstone manuscript in strict accordance with Filamer Christian University guidelines. Implemented immutable system audit logging and compliance frameworks for civilian data privacy."
    }
]

print("Full thesis content data structures defined.")
