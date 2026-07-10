const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

// Make sure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images up to 5MB are allowed!'));
  }
});

// List News Feed (All authenticated users can read)
router.get('/', authRequired, async (req, res) => {
  const { category } = req.query;

  try {
    let query = `
      SELECT n.*, u.full_name as author_name
      FROM news n
      JOIN users u ON n.author_id = u.id
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' WHERE n.category = ?';
      params.push(category);
    }

    query += ' ORDER BY n.created_at DESC';

    const [list] = await db.query(query, params);
    return res.json(list);

  } catch (error) {
    console.error('Fetch news error:', error);
    return res.status(500).json({ message: 'Server error while fetching news' });
  }
});

// Get Specific Announcement
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT n.*, u.full_name as author_name
      FROM news n
      JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `, [id]);

    const article = rows[0];

    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }
    return res.json(article);
  } catch (error) {
    console.error('Fetch article error:', error);
    return res.status(500).json({ message: 'Server error while fetching article details' });
  }
});

// Create News Announcement (Admin only)
router.post('/', authRequired, requireRole(['Admin']), upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Title, content, and category are required' });
  }

  const validCategories = ['News', 'Announcements', 'Advisories'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category selection' });
  }

  const image_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await db.execute(`
      INSERT INTO news (title, content, category, image_path, author_id)
      VALUES (?, ?, ?, ?, ?)
    `, [title.trim(), content.trim(), category, image_path, req.user.id]);

    const newsId = result.insertId;

    // Notify all active residents for Advisories
    if (category === 'Advisories') {
      const [residents] = await db.query("SELECT id FROM users WHERE role = 'Resident' AND is_active = 1");
      
      for (const resident of residents) {
        await db.execute(`
          INSERT INTO notifications (user_id, title, message, reference_type, reference_id)
          VALUES (?, 'CRITICAL ADVISORY', ?, 'news', ?)
        `, [
          resident.id,
          title.length > 50 ? title.substring(0, 47) + '...' : title,
          newsId
        ]);
      }
    }

    await db.logAudit(`Advisory announcement published: "${title.trim().substring(0, 40)}${title.trim().length > 40 ? '...' : ''}"`, req.user.username, req.ip);
    return res.status(201).json({
      message: 'Announcement published successfully!',
      newsId
    });

  } catch (error) {
    console.error('Publish news error:', error);
    return res.status(500).json({ message: 'Server error while publishing announcement' });
  }
});

// Edit News Announcement (Admin only)
router.put('/:id', authRequired, requireRole(['Admin']), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Title, content, and category are required' });
  }

  try {
    const [rows] = await db.query('SELECT image_path FROM news WHERE id = ?', [id]);
    const article = rows[0];
    if (!article) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    let image_path = article.image_path;
    if (req.file) {
      image_path = `/uploads/${req.file.filename}`;
      // Optional: Delete old image from disk
      if (article.image_path) {
        const oldPath = path.join(__dirname, '..', article.image_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    await db.execute(`
      UPDATE news
      SET title = ?, content = ?, category = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title.trim(), content.trim(), category, image_path, id]);

    await db.logAudit(`Announcement updated: "${title.trim().substring(0, 40)}${title.trim().length > 40 ? '...' : ''}"`, req.user.username, req.ip);
    return res.json({ message: 'Announcement updated successfully' });

  } catch (error) {
    console.error('Update news error:', error);
    return res.status(500).json({ message: 'Server error while updating announcement' });
  }
});

// Delete News Announcement (Admin only)
router.delete('/:id', authRequired, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT image_path FROM news WHERE id = ?', [id]);
    const article = rows[0];
    if (!article) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Delete image file if exists
    if (article.image_path) {
      const imgPath = path.join(__dirname, '..', article.image_path);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await db.execute('DELETE FROM news WHERE id = ?', [id]);
    await db.logAudit(`Announcement deleted (ID: ${id})`, req.user.username, req.ip);
    return res.json({ message: 'Announcement deleted successfully' });

  } catch (error) {
    console.error('Delete news error:', error);
    return res.status(500).json({ message: 'Server error while deleting announcement' });
  }
});

module.exports = router;
