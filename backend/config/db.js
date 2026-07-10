const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jamindan_emergency'
};

let pool;

const initializeDatabase = async () => {
  try {
    // 1. Connect without database to ensure DB exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log(`Checking database "${dbConfig.database}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();

    // 2. Initialize Pool
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('MySQL Database connection pool established.');

    // Compatibility check: Recreate tables if incompatible 'users' table exists from another project
    let needsClean = false;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'username'");
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
      await pool.query('DROP TABLE IF EXISTS users');
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
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
        avatar VARCHAR(255) NULL,
        is_active TINYINT DEFAULT 1, -- 1 = active, 0 = deactivated
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL, -- Format: #YYYY-MM-XXXX
        reporter_id INT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other'
        description TEXT NOT NULL,
        photo_path VARCHAR(255) NULL,
        location_lat DOUBLE NULL,
        location_lng DOUBLE NULL,
        status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Under Review', 'In Progress', 'Resolved'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE
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
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay)
        VALUES (?, ?, 'Admin', ?, ?, ?)
      `, ['admin', adminHash, 'Platform Administrator', '09171234567', 'Poblacion']);

      await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay)
        VALUES (?, ?, 'Responder', ?, ?, ?)
      `, ['responder', responderHash, 'Jamindan Municipal Responder', '09187654321', 'Lucero']);

      await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, phone, barangay)
        VALUES (?, ?, 'Resident', ?, ?, ?)
      `, ['resident', residentHash, 'Juan Dela Cruz', '09199876543', 'Agloloway']);

      console.log('Default users seeded.');

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
