const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const getDbConfig = () => {
  if (process.env.DB_URL) {
    try {
      const parsed = new URL(process.env.DB_URL);
      return {
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port) : 3306,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'defaultdb',
        ssl: { rejectUnauthorized: false }
      };
    } catch (e) {
      return process.env.DB_URL;
    }
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jamindan_emergency',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
};

const dbConfig = getDbConfig();

let pool;

const initializeDatabase = async () => {
  try {
    // 1. Connect without database to ensure DB exists (if local)
    // If using a cloud DB URL (like Aiven), the DB usually already exists.
    const connectionConfig = typeof dbConfig === 'string' 
      ? dbConfig 
      : { 
          host: dbConfig.host, 
          port: dbConfig.port || 3306,
          user: dbConfig.user, 
          password: dbConfig.password, 
          ssl: dbConfig.ssl 
        };
      
    const connection = await mysql.createConnection(connectionConfig);

    if (typeof dbConfig !== 'string' && (!process.env.DB_URL || dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1')) {
      console.log(`Checking database "${dbConfig.database}"...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } else {
      console.log(`Connected to cloud database via URL...`);
    }
    
    await connection.end();

    // 2. Initialize Pool
    let poolConfig = typeof dbConfig === 'string' 
      ? dbConfig 
      : {
          ...dbConfig,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        };
        
    pool = mysql.createPool(poolConfig);

    console.log('MySQL Database connection pool established.');

    // Compatibility check: Recreate tables if incompatible 'users' table exists from another project
    let needsClean = false;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'migration_v4'");
      if (columns.length === 0) {
        needsClean = true;
      }
    } catch (e) {
      // Table users doesn't exist, which is fine
    }

    if (needsClean) {
      console.log('Detected incompatible users table structure. Recreating tables for Jamindan Emergency Response...');
      await pool.query('SET FOREIGN_KEY_CHECKS = 0');
      await pool.query('DROP TABLE IF EXISTS audit_logs');
      await pool.query('DROP TABLE IF EXISTS notifications');
      await pool.query('DROP TABLE IF EXISTS news');
      await pool.query('DROP TABLE IF EXISTS incident_status_history');
      await pool.query('DROP TABLE IF EXISTS incidents');
      await pool.query('DROP TABLE IF EXISTS hotlines');
      await pool.query('DROP TABLE IF EXISTS evacuation_centers');
      await pool.query('DROP TABLE IF EXISTS household_members');
      await pool.query('DROP TABLE IF EXISTS users');
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      // Gracefully add new columns to existing databases if they are missing
      try {
        await pool.query('ALTER TABLE users ADD COLUMN id_type VARCHAR(50) NULL AFTER avatar');
        console.log('Successfully injected id_type column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NULL AFTER username');
        console.log('Successfully injected email column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN location_address VARCHAR(255) NULL AFTER location_lng');
        console.log('Successfully injected location_address column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN details JSON NULL AFTER description');
        console.log('Successfully injected details column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE users ADD COLUMN push_subscription TEXT NULL AFTER current_lng');
        console.log('Successfully injected push_subscription column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN triage_tag VARCHAR(20) NULL AFTER status');
        console.log('Successfully injected triage_tag column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE users ADD COLUMN agency_type VARCHAR(50) NULL AFTER role');
        console.log('Successfully injected agency_type column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE users ADD COLUMN is_on_duty TINYINT DEFAULT 0 AFTER is_active');
        console.log('Successfully injected is_on_duty column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER age');
        console.log('Successfully injected date_of_birth column into existing users table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN lead_agency VARCHAR(50) NULL AFTER type');
        console.log('Successfully injected lead_agency column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN agency_notes TEXT NULL AFTER response_notes');
        console.log('Successfully injected agency_notes column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query('ALTER TABLE incidents ADD COLUMN vehicle_id INT NULL AFTER responder_id');
        console.log('Successfully injected vehicle_id column into existing incidents table.');
      } catch (e) {
        // Column already exists or table doesn't exist yet, which is fine
      }
      try {
        await pool.query("UPDATE users SET is_on_duty = 1 WHERE role = 'Admin'");
      } catch (e) {
        // Column or table doesn't exist yet, which is fine
      }
    }

    // 3. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL, -- 'Admin', 'Responder', 'Resident'
        agency_type VARCHAR(50) NULL, -- 'Police', 'Fire', 'Medical', etc.
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        barangay VARCHAR(100) NOT NULL,
        purok_sitio VARCHAR(100) NULL,
        blood_type VARCHAR(5) NULL,
        allergies TEXT NULL,
        medical_conditions TEXT NULL,
        emergency_contact_name VARCHAR(100) NULL,
        emergency_contact_phone VARCHAR(20) NULL,
        avatar VARCHAR(255) NULL,
        id_type VARCHAR(50) NULL,
        id_photo_path VARCHAR(255) NULL,
        selfie_photo_path VARCHAR(255) NULL,
        current_lat DOUBLE NULL,
        current_lng DOUBLE NULL,
        push_subscription TEXT NULL,
        age INT NOT NULL DEFAULT 18,
        date_of_birth DATE NULL,
        is_verified TINYINT DEFAULT 0,
        is_active TINYINT DEFAULT 1, -- 1 = active, 0 = deactivated
        is_on_duty TINYINT DEFAULT 0, -- 1 = on shift, 0 = off shift
        migration_v4 TINYINT DEFAULT 1, -- migration sync flag
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS household_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) NOT NULL,
        medical_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS evacuation_centers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        capacity INT NOT NULL,
        current_headcount INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Closed', -- 'Open', 'Full', 'Closed'
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotlines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        barangay VARCHAR(100) NULL, -- NULL if municipal-wide
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL, -- Format: #YYYY-MM-XXXX
        reporter_id INT NOT NULL,
        responder_id INT NULL,
        vehicle_id INT NULL,
        type VARCHAR(50) NOT NULL, -- 'Fire', 'Medical', 'Flood', 'Accident', 'Other', 'Landslide'
        lead_agency VARCHAR(50) NULL, -- 'MDRRMO', 'BFP', 'RHU'
        description TEXT NOT NULL,
        details JSON NULL,
        photo_path VARCHAR(255) NULL,
        location_lat DOUBLE NULL,
        location_lng DOUBLE NULL,
        location_address VARCHAR(255) NULL,
        status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Under Review', 'In Progress', 'Resolved'
        triage_tag VARCHAR(20) NULL, -- 'Red', 'Yellow', 'Green', 'Black'
        response_notes TEXT NULL,
        agency_notes TEXT NULL,
        resources_used TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (responder_id) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        incident_id INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        comment TEXT NULL,
        updated_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        incident_id INT NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL, -- 'News', 'Announcements', 'Advisories'
        image_path VARCHAR(255) NULL,
        author_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT DEFAULT 0, -- 0 = unread, 1 = read
        reference_type VARCHAR(50) NULL, -- 'incident', 'news'
        reference_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caller_id INT NOT NULL,
        hotline_name VARCHAR(100) NOT NULL,
        hotline_number VARCHAR(50) NOT NULL,
        called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caller_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action TEXT NOT NULL,
        username VARCHAR(50) NOT NULL,
        ip VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        agency VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS safety_checkins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'Safe',
        note VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Default Emergency Vehicles if empty
    const [vehicleCountRows] = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    if (vehicleCountRows[0].count === 0) {
      await pool.query(`
        INSERT INTO vehicles (name, type, agency, status)
        VALUES
        ('MDRRMO Rescue Van 1', 'Rescue Truck', 'MDRRMO', 'Available'),
        ('MDRRMO Emergency Ambulance 1', 'Ambulance', 'MDRRMO', 'Available'),
        ('BFP Jamindan Fire Engine 1', 'Fire Truck', 'BFP', 'Available'),
        ('RHU Medical Transport Ambulance', 'Ambulance', 'RHU', 'Available')
      `);
      console.log('Seeded default Jamindan emergency vehicles.');
    }

    // 4. Seed Initial Data
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('Seeding initial database users to MySQL...');
      const salt = bcrypt.genSaltSync(10);
      
      const adminHash = bcrypt.hashSync('AdminPass123!', salt);
      const responderHash = bcrypt.hashSync('ResponderPass123!', salt);
      const residentHash = bcrypt.hashSync('ResidentPass123!', salt);

      const [adminResult] = await pool.query(`
        INSERT INTO users (username, email, password_hash, role, agency_type, full_name, phone, barangay, is_verified, is_on_duty)
        VALUES (?, ?, ?, 'Admin', 'MDRRMO', ?, ?, ?, 1, 1)
      `, ['admin', 'admin@jamindan.gov.ph', adminHash, 'Platform Administrator', '09171234567', 'Poblacion']);

      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, agency_type, full_name, phone, barangay, is_verified)
        VALUES (?, ?, ?, 'Responder', 'MDRRMO', ?, ?, ?, 1)
      `, ['responder', 'responder@jamindan.gov.ph', responderHash, 'MDRRMO Rescue Lead', '09187654321', 'Lucero']);

      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, agency_type, full_name, phone, barangay, is_verified)
        VALUES (?, ?, ?, 'Responder', 'BFP', ?, ?, ?, 1)
      `, ['bfp_responder', 'bfp@jamindan.gov.ph', responderHash, 'BFP Firefighter Officer', '09106964585', 'Poblacion']);

      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, agency_type, full_name, phone, barangay, is_verified)
        VALUES (?, ?, ?, 'Responder', 'RHU', ?, ?, ?, 1)
      `, ['rhu_medic', 'rhu@jamindan.gov.ph', responderHash, 'RHU Paramedic Team', '09304562011', 'Poblacion']);

      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, full_name, phone, barangay, is_verified)
        VALUES (?, ?, ?, 'Resident', ?, ?, ?, 1)
      `, ['resident', 'resident@gmail.com', residentHash, 'Juan Dela Cruz', '09199876543', 'Agloloway']);

      console.log('Default users seeded.');

        // Clean up any existing duplicates first
        await pool.query(`
          DELETE t1 FROM evacuation_centers t1
          INNER JOIN evacuation_centers t2 
          WHERE t1.id > t2.id AND t1.name = t2.name
        `);

        // Seed Evacuation Centers only if empty
        const [evacRows] = await pool.query('SELECT COUNT(*) as count FROM evacuation_centers');
        if (evacRows[0].count === 0) {
          console.log('Seeding evacuation centers to MySQL...');
          await pool.query(`
            INSERT INTO evacuation_centers (name, location, capacity, current_headcount, status, latitude, longitude)
            VALUES 
            ('Jamindan Cultural Center', 'Brgy. Poblacion (Centro), Jamindan', 400, 24, 'Open', 11.4294, 122.4828),
            ('Lucero Barangay Gym', 'Brgy. Lucero, Jamindan', 250, 0, 'Open', 11.4172, 122.4950),
            ('Agtambi Elementary School', 'Brgy. Agtambi, Jamindan', 150, 0, 'Closed', 11.4450, 122.4680)
          `);
        }
  
        // Always replace hotlines with the official Jamindan data
        console.log('Replacing hotlines with official Jamindan MDRRMO data...');
        await pool.query('DELETE FROM hotlines');
        await pool.query(`
          INSERT INTO hotlines (agency_name, contact_number, barangay)
          VALUES
          ('Jamindan Response Unit (MDRRMO)', '09485224345 / 09088773092 / (036) 651-8227', NULL),
          ('Jamindan Municipal Police Station', '09086415589 / (036) 651-8218', NULL),
          ('Municipal Health Office', '09304562011 / (036) 651-8204', NULL),
          ('Jamindan Bureau of Fire Protection (BFP)', '09106964585 / (036) 651-8228', NULL),
          ('CAPELCO Jamindan-Mambusao', '09630438339 / (036) 620-4930', NULL),
          ('Mambusao District Hospital', '09688796022 / (036) 647-0220', NULL),
          ('SGMRMH (DAO) Hospital', '09171195972 / (036) 658-0037', NULL),
          ('Roxas Memorial Provincial Hospital', '(036) 621-0823 / (036) 621-0030', NULL),
          ('Capiz Doctors Hospital', '(036) 621-5675', NULL),
          ('St. Anthony Hospital', '(036) 621-0431', NULL),
          ('Capiz Emmanuel Hospital', '(036) 621-0443', NULL),
          ('Health Centrum Hospital', '(033) 621-09088', NULL),
          ('Western Visayas Medical Center', '09695106129 / (033) 339-7070', NULL)
        `);

      // Seed News
      const [newsRows] = await pool.query('SELECT COUNT(*) as count FROM news');
      if (newsRows[0].count === 0) {
        console.log('Seeding announcements to MySQL...');
        
        await pool.query(`
          INSERT INTO news (title, content, category, author_id)
          VALUES (?, ?, 'Advisories', ?)
        `, [
          'Typhoon Warning: Stay Indoors and Monitor Water Levels',
          'Tropical Cyclone Pepito is expected to bring heavy rains in Capiz and Panay island. The Mambusao River water level is being monitored closely. Please stay indoors, stock up on essential supplies, and contact the Jamindan Disaster Risk Reduction Management Office (MDRRMO) for immediate emergencies.',
          adminResult.insertId
        ]);

        await pool.query(`
          INSERT INTO news (title, content, category, author_id)
          VALUES (?, ?, 'Announcements', ?)
        `, [
          'Community Basic First Aid & Rescue Seminar',
          'The Municipality of Jamindan is hosting a community basic life support and first aid seminar on Friday, October 16, 2026, at the Municipal Covered Gym. All Barangay Responders and volunteer residents are encouraged to attend. Certificates will be provided.',
          adminResult.insertId
        ]);

        await pool.query(`
          INSERT INTO news (title, content, category, author_id)
          VALUES (?, ?, 'News', ?)
        `, [
          'LGU Jamindan Launches New Digital Response Service',
          'LGU Jamindan has officially launched the Emergency Response Community Platform, bringing instant digital incident reporting, status tracking, and direct notifications to residents. This system is part of our commitment to safety and modern citizen services.',
          adminResult.insertId
        ]);

        console.log('News seeded successfully.');
        console.log('Initial test incidents seeded.');
      }
    }

    // 5. Backdate seed accounts, news, and populate 2-month-old historical incident data
    try {
      // Backdate accounts to September 2026 (over 2 months ago)
      await pool.query("UPDATE users SET created_at = '2026-09-01 08:00:00' WHERE username IN ('admin', 'responder', 'bfp_responder', 'rhu_medic', 'resident') AND created_at > '2026-09-02'");

      // Backdate advisories and news to September and October 2026
      await pool.query("UPDATE news SET created_at = '2026-09-18 08:30:00' WHERE title LIKE '%Typhoon%'");
      await pool.query("UPDATE news SET created_at = '2026-10-12 14:00:00' WHERE title LIKE '%Seminar%'");
      await pool.query("UPDATE news SET created_at = '2026-09-01 09:00:00' WHERE title LIKE '%Launch%'");

      // Check if historical 2-month-old incidents already exist
      const [histRows] = await pool.query("SELECT COUNT(*) as count FROM incidents WHERE code LIKE '#2026-09-%'");
      if (histRows[0].count === 0) {
        console.log('Seeding 2-month historical emergency incident records...');
        
        // Fetch user IDs for relations
        const [adminU] = await pool.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
        const [residentU] = await pool.query("SELECT id FROM users WHERE username = 'resident' LIMIT 1");
        const [rescueU] = await pool.query("SELECT id FROM users WHERE username = 'responder' LIMIT 1");
        const [bfpU] = await pool.query("SELECT id FROM users WHERE username = 'bfp_responder' LIMIT 1");
        const [rhuU] = await pool.query("SELECT id FROM users WHERE username = 'rhu_medic' LIMIT 1");

        const adminId = adminU[0]?.id || 1;
        const residentId = residentU[0]?.id || adminId;
        const rescueId = rescueU[0]?.id || adminId;
        const bfpId = bfpU[0]?.id || adminId;
        const rhuId = rhuU[0]?.id || adminId;

        // Fetch vehicle IDs
        const [v1] = await pool.query("SELECT id FROM vehicles WHERE agency = 'MDRRMO' LIMIT 1");
        const [v2] = await pool.query("SELECT id FROM vehicles WHERE agency = 'BFP' LIMIT 1");
        const [v3] = await pool.query("SELECT id FROM vehicles WHERE agency = 'RHU' LIMIT 1");
        const vehMdrrmo = v1[0]?.id || null;
        const vehBfp = v2[0]?.id || null;
        const vehRhu = v3[0]?.id || null;

        // Incident 1 (2 Months Ago - Sept 14, 2026: River Overflow / Flood in Agloloway)
        const [inc1] = await pool.query(`
          INSERT INTO incidents (code, reporter_id, responder_id, vehicle_id, type, lead_agency, description, location_lat, location_lng, location_address, status, response_notes, resources_used, created_at, updated_at)
          VALUES ('#2026-09-0014', ?, ?, ?, 'Flood', 'MDRRMO', 'Rising water levels along Mambusao River overflowed onto low-lying purok pathways. Three families assisted to high ground.', 11.4110, 122.4750, 'Purok 2, Brgy. Agloloway, Jamindan', 'Resolved', 'MDRRMO Rescue Unit deployed with rescue van. Evacuated 12 individuals to barangay multipurpose hall safely. Water subsided after 4 hours.', 'Rescue Van 1, Life Vests, First Aid Kit', '2026-09-14 07:15:00', '2026-09-14 11:45:00')
        `, [residentId, rescueId, vehMdrrmo]);

        await pool.query(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by, created_at) VALUES
          (?, 'Pending', 'Incident reported via Jamindan Emergency App.', ?, '2026-09-14 07:15:00'),
          (?, 'Acknowledged', 'MDRRMO Dispatcher acknowledged incident.', ?, '2026-09-14 07:19:00'),
          (?, 'Responding', 'MDRRMO Rescue Team dispatched.', ?, '2026-09-14 07:25:00'),
          (?, 'On Scene', 'Team arrived at Agloloway riverbank.', ?, '2026-09-14 07:38:00'),
          (?, 'Resolved', 'Area secured, water level normalized.', ?, '2026-09-14 11:45:00')
        `, [inc1.insertId, residentId, inc1.insertId, adminId, inc1.insertId, rescueId, inc1.insertId, rescueId, inc1.insertId, rescueId]);

        // Incident 2 (2 Months Ago - Sept 22, 2026: Vehicular Accident in Lucero)
        const [inc2] = await pool.query(`
          INSERT INTO incidents (code, reporter_id, responder_id, vehicle_id, type, lead_agency, description, location_lat, location_lng, location_address, status, response_notes, resources_used, created_at, updated_at)
          VALUES ('#2026-09-0022', ?, ?, ?, 'Accident', 'RHU', 'Single motorcycle skidded on wet asphalt along the provincial road. Rider sustained minor lacerations and abrasions.', 11.4172, 122.4950, 'Brgy. Lucero Highway, Jamindan', 'Resolved', 'RHU ambulance team coordinated on scene. Wound dressing administered. Rider escorted to Mambusao District Hospital for clearance.', 'RHU Medical Transport Ambulance, Splints, Sterile Bandages', '2026-09-22 16:30:00', '2026-09-22 17:50:00')
        `, [residentId, rhuId, vehRhu]);

        await pool.query(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by, created_at) VALUES
          (?, 'Pending', 'Motorist accident reported.', ?, '2026-09-22 16:30:00'),
          (?, 'Acknowledged', 'RHU Medical Unit alerted.', ?, '2026-09-22 16:33:00'),
          (?, 'Responding', 'RHU Ambulance en route.', ?, '2026-09-22 16:38:00'),
          (?, 'On Scene', 'Medics arrived, first aid administered.', ?, '2026-09-22 16:49:00'),
          (?, 'Resolved', 'Patient transported safely, road cleared.', ?, '2026-09-22 17:50:00')
        `, [inc2.insertId, residentId, inc2.insertId, adminId, inc2.insertId, rhuId, inc2.insertId, rhuId, inc2.insertId, rhuId]);

        // Incident 3 (1 Month Ago - Oct 08, 2026: Kitchen Fire in Poblacion)
        const [inc3] = await pool.query(`
          INSERT INTO incidents (code, reporter_id, responder_id, vehicle_id, type, lead_agency, description, location_lat, location_lng, location_address, status, response_notes, resources_used, created_at, updated_at)
          VALUES ('#2026-10-0008', ?, ?, ?, 'Fire', 'BFP', 'Kitchen fire caused by loose LPG hose in residential wooden kitchen. Contained quickly before spreading to neighboring structures.', 11.4294, 122.4828, 'Zone 3, Brgy. Poblacion, Jamindan', 'Resolved', 'BFP Jamindan Engine 1 deployed with 4 firefighters. Fire extinguished using dry chemical extinguisher and 1 hose line. No casualties.', 'BFP Jamindan Fire Engine 1, 10lb Dry Chemical Extinguisher', '2026-10-08 19:10:00', '2026-10-08 20:05:00')
        `, [residentId, bfpId, vehBfp]);

        await pool.query(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by, created_at) VALUES
          (?, 'Pending', 'Emergency fire report received.', ?, '2026-10-08 19:10:00'),
          (?, 'Acknowledged', 'BFP Jamindan alerted.', ?, '2026-10-08 19:12:00'),
          (?, 'Responding', 'Fire Engine 1 en route.', ?, '2026-10-08 19:15:00'),
          (?, 'On Scene', 'Attack line deployed, suppression active.', ?, '2026-10-08 19:22:00'),
          (?, 'Resolved', 'Fire completely extinguished, overhauling done.', ?, '2026-10-08 20:05:00')
        `, [inc3.insertId, residentId, inc3.insertId, adminId, inc3.insertId, bfpId, inc3.insertId, bfpId, inc3.insertId, bfpId]);

        // Incident 4 (1 Month Ago - Oct 19, 2026: Acute Medical Emergency in Agtambi)
        const [inc4] = await pool.query(`
          INSERT INTO incidents (code, reporter_id, responder_id, vehicle_id, type, lead_agency, description, location_lat, location_lng, location_address, status, response_notes, resources_used, created_at, updated_at)
          VALUES ('#2026-10-0019', ?, ?, ?, 'Medical', 'RHU', 'Senior citizen experiencing acute chest pain and shortness of breath during monsoon weather.', 11.4450, 122.4680, 'Brgy. Agtambi, Jamindan', 'Resolved', 'RHU Paramedic Team dispatched with transport ambulance. Oxygen support provided. Patient successfully stabilized and admitted at Capiz Doctors Hospital.', 'RHU Medical Transport Ambulance, Oxygen Tank, BP Monitor', '2026-10-19 21:05:00', '2026-10-19 22:45:00')
        `, [residentId, rhuId, vehRhu]);

        await pool.query(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by, created_at) VALUES
          (?, 'Pending', 'Emergency medical call.', ?, '2026-10-19 21:05:00'),
          (?, 'Acknowledged', 'MHO Emergency team notified.', ?, '2026-10-19 21:08:00'),
          (?, 'Responding', 'Ambulance dispatched.', ?, '2026-10-19 21:14:00'),
          (?, 'On Scene', 'Vitals checked, oxygen therapy administered.', ?, '2026-10-19 21:28:00'),
          (?, 'Resolved', 'Patient turned over to attending hospital physician.', ?, '2026-10-19 22:45:00')
        `, [inc4.insertId, residentId, inc4.insertId, adminId, inc4.insertId, rhuId, inc4.insertId, rhuId, inc4.insertId, rhuId]);

        // Incident 5 (2 Weeks Ago - Nov 02, 2026: Minor Landslide Road Clearing in Jaena Norte)
        const [inc5] = await pool.query(`
          INSERT INTO incidents (code, reporter_id, responder_id, vehicle_id, type, lead_agency, description, location_lat, location_lng, location_address, status, response_notes, resources_used, created_at, updated_at)
          VALUES ('#2026-11-0002', ?, ?, ?, 'Landslide', 'MDRRMO', 'Minor soil erosion and fallen bamboo blocking one lane of barangay access road after continuous monsoon rain.', 11.4380, 122.5020, 'Sitio Ilawod, Brgy. Jaena Norte, Jamindan', 'Resolved', 'MDRRMO clearing crew deployed with chainsaw and backhoe operator. Debris cleared, road opened to two-way traffic.', 'Chainsaw, Safety Cones, Clearing Shovels', '2026-11-02 08:20:00', '2026-11-02 11:30:00')
        `, [residentId, rescueId, vehMdrrmo]);

        await pool.query(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by, created_at) VALUES
          (?, 'Pending', 'Barangay official reported road obstruction.', ?, '2026-11-02 08:20:00'),
          (?, 'Acknowledged', 'Clearing operation scheduled.', ?, '2026-11-02 08:24:00'),
          (?, 'Responding', 'Clearing team in transit.', ?, '2026-11-02 08:35:00'),
          (?, 'On Scene', 'Clearing operations commenced.', ?, '2026-11-02 08:52:00'),
          (?, 'Resolved', 'Road 100% passable, cones retrieved.', ?, '2026-11-02 11:30:00')
        `, [inc5.insertId, residentId, inc5.insertId, adminId, inc5.insertId, rescueId, inc5.insertId, rescueId, inc5.insertId, rescueId]);

        console.log('Seeded 5 realistic 2-month-old historical emergency incidents successfully.');
      }
    } catch (e) {
      console.error('Error seeding historical incidents:', e);
    }

    // Seed system settings
    const [mciRows] = await pool.query("SELECT * FROM system_settings WHERE setting_key = 'mci_mode'");
    if (mciRows.length === 0) {
      await pool.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('mci_mode', 'false')");
      console.log('Seeded initial MCI Mode setting as false.');
    }

    // Clear stale test broadcasts on startup so random test data never locks the user interface
    try {
      await pool.query(`
        UPDATE notifications 
        SET reference_type = REPLACE(reference_type, 'broadcast:', 'broadcast_ended:') 
        WHERE reference_type LIKE 'broadcast:%' 
        AND (title LIKE '%fnw%' OR message LIKE '%duhfks%' OR created_at < NOW() - INTERVAL 4 HOUR)
      `);
      console.log('Cleaned up stale test broadcasts.');
    } catch (bErr) {
      console.warn('Stale broadcast cleanup:', bErr.message);
    }

    console.log('MySQL Database Initialization Complete.');
  } catch (error) {
    console.error('MySQL database initialization failed:', error);
    throw error;
  }
};

// Auto run initialization on load
const initPromise = initializeDatabase();

const db = {
  // Wait helper to ensure initialization completes before running queries
  async query(sql, params) {
    await initPromise;
    return pool.query(sql, params);
  },
  async execute(sql, params) {
    await initPromise;
    return pool.execute(sql, params);
  },
  // Transaction wrapper
  async transaction(fn) {
    await initPromise;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await fn(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  // Logging utility
  async logAudit(action, username, ip) {
    try {
      await initPromise;
      await pool.execute(`
        INSERT INTO audit_logs (action, username, ip)
        VALUES (?, ?, ?)
      `, [action, username, ip || 'unknown']);
    } catch (error) {
      console.error('Audit Log MySQL Error:', error);
    }
  }
};

module.exports = db;
