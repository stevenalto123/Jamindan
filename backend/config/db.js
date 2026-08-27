const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = process.env.DB_URL || {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jamindan_emergency',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

let pool;

const initializeDatabase = async () => {
  try {
    // 1. Connect without database to ensure DB exists (if local)
    // If using a cloud DB URL (like Aiven), the DB usually already exists.
    const connectionConfig = typeof dbConfig === 'string' 
      ? dbConfig 
      : { host: dbConfig.host, user: dbConfig.user, password: dbConfig.password, ssl: dbConfig.ssl };
      
    const connection = await mysql.createConnection(connectionConfig);

    if (typeof dbConfig !== 'string') {
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
    }

    // 3. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL, -- 'Admin', 'Responder', 'Resident'
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
        age INT NOT NULL DEFAULT 18,
        is_verified TINYINT DEFAULT 0,
        is_active TINYINT DEFAULT 1, -- 1 = active, 0 = deactivated
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
        type VARCHAR(50) NOT NULL, -- 'Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other', 'Landslide'
        description TEXT NOT NULL,
        photo_path VARCHAR(255) NULL,
        location_lat DOUBLE NULL,
        location_lng DOUBLE NULL,
        status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Under Review', 'In Progress', 'Resolved'
        response_notes TEXT NULL,
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
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action TEXT NOT NULL,
        username VARCHAR(50) NOT NULL,
        ip VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Seed Initial Data
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('Seeding initial database users to MySQL...');
      const salt = bcrypt.genSaltSync(10);
      
      const adminHash = bcrypt.hashSync('AdminPass123!', salt);
      const responderHash = bcrypt.hashSync('ResponderPass123!', salt);
      const residentHash = bcrypt.hashSync('ResidentPass123!', salt);

      const [adminResult] = await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay, is_verified)
        VALUES (?, ?, 'Admin', ?, ?, ?, 1)
      `, ['admin', adminHash, 'Platform Administrator', '09171234567', 'Poblacion']);

      await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay, is_verified)
        VALUES (?, ?, 'Responder', ?, ?, ?, 1)
      `, ['responder', responderHash, 'Jamindan Municipal Responder', '09187654321', 'Lucero']);

      await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay, is_verified)
        VALUES (?, ?, 'Resident', ?, ?, ?, 1)
      `, ['resident', residentHash, 'Juan Dela Cruz', '09199876543', 'Agloloway']);

      console.log('Default users seeded.');

      // Seed Evacuation Centers
      console.log('Seeding evacuation centers to MySQL...');
      await pool.query(`
        INSERT INTO evacuation_centers (name, location, capacity, current_headcount, status, latitude, longitude)
        VALUES 
        ('Jamindan Cultural Center', 'Brgy. Poblacion (Centro), Jamindan', 400, 24, 'Open', 11.4294, 122.4828),
        ('Lucero Barangay Gym', 'Brgy. Lucero, Jamindan', 250, 0, 'Open', 11.4172, 122.4950),
        ('Agtambi Elementary School', 'Brgy. Agtambi, Jamindan', 150, 0, 'Closed', 11.4450, 122.4680)
      `);

      // Seed Hotlines
      console.log('Seeding local hotlines to MySQL...');
      await pool.query(`
        INSERT INTO hotlines (agency_name, contact_number, barangay)
        VALUES
        ('Jamindan MDRRMO Rescue Hotline', '0912-345-6789 / 0917-987-6543', NULL),
        ('Jamindan Bureau of Fire Protection (BFP)', '0998-765-4321', NULL),
        ('Jamindan Municipal Police (PNP)', '0987-654-3210', NULL),
        ('Jamindan Rural Health Unit (RHU)', '(036) 658-1234', NULL),
        ('Barangay Poblacion Tanod Desk', '0919-111-2222', 'Poblacion'),
        ('Barangay Lucero Tanod Desk', '0919-333-4444', 'Lucero')
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
      }
    }
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
