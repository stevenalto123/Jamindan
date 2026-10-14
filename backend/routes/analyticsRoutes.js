const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

// Dashboard requires Admin role
router.use(authRequired, requireRole('Admin'));

// Helper for date & scope filtering
const buildFilterConditions = (query, tableAlias = 'i') => {
  const { startDate, endDate, period, barangay, agency } = query;
  const conditions = [];
  const params = [];

  if (startDate && endDate) {
    conditions.push(`DATE(${tableAlias}.created_at) BETWEEN DATE(?) AND DATE(?)`);
    params.push(startDate, endDate);
  } else if (startDate) {
    conditions.push(`DATE(${tableAlias}.created_at) >= DATE(?)`);
    params.push(startDate);
  } else if (period === 'today') {
    conditions.push(`DATE(${tableAlias}.created_at) = CURDATE()`);
  } else if (period === 'week') {
    conditions.push(`${tableAlias}.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
  } else if (period === 'month') {
    conditions.push(`${tableAlias}.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
  } else if (period === 'year') {
    conditions.push(`${tableAlias}.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`);
  }

  if (barangay && barangay !== 'All') {
    conditions.push(`u.barangay = ?`);
    params.push(barangay);
  }

  if (agency && agency !== 'All') {
    conditions.push(`(${tableAlias}.lead_agency = ? OR r.agency_type = ?)`);
    params.push(agency, agency);
  }

  return { conditions, params };
};

// GET Summary KPIs (with date range support)
router.get('/summary', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const baseJoin = `
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
    `;

    const [totalRows] = await db.query(`SELECT COUNT(*) as count ${baseJoin} ${whereClause}`, params);
    
    const resolvedWhere = whereClause 
      ? `${whereClause} AND i.status = 'Resolved'` 
      : "WHERE i.status = 'Resolved'";
    const [resolvedRows] = await db.query(`SELECT COUNT(*) as count ${baseJoin} ${resolvedWhere}`, params);

    const activeWhere = whereClause 
      ? `${whereClause} AND i.status != 'Resolved'` 
      : "WHERE i.status != 'Resolved'";
    const [activeRows] = await db.query(`SELECT COUNT(*) as count ${baseJoin} ${activeWhere}`, params);
    
    // Average response time in minutes
    const respWhere = whereClause 
      ? `${whereClause} AND h.status IN ('In Progress', 'Responding', 'On Scene', 'Resolved')`
      : "WHERE h.status IN ('In Progress', 'Responding', 'On Scene', 'Resolved')";

    const [responseRows] = await db.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, i.created_at, h.created_at)) as avg_mins
      ${baseJoin}
      JOIN incident_status_history h ON i.id = h.incident_id
      ${respWhere}
      AND h.id = (
        SELECT MIN(id) FROM incident_status_history 
        WHERE incident_id = i.id AND status IN ('In Progress', 'Responding', 'On Scene', 'Resolved')
      )
    `, params);

    return res.json({
      total: totalRows[0].count,
      resolved: resolvedRows[0].count,
      active: activeRows[0].count,
      avgResponseMinutes: responseRows[0].avg_mins ? Math.round(responseRows[0].avg_mins) : 0
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Incidents by Type (for Bar Chart)
router.get('/by-type', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT i.type as name, COUNT(*) as value 
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      ${whereClause}
      GROUP BY i.type 
      ORDER BY value DESC
    `, params);
    return res.json(rows);
  } catch (error) {
    console.error('Analytics by-type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Incident Heatmap Data
router.get('/heatmap', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereExtra = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT i.location_lat, i.location_lng
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      WHERE i.location_lat IS NOT NULL AND i.location_lng IS NOT NULL
      ${whereExtra}
    `, params);
    
    const heatData = rows.map(r => [r.location_lat, r.location_lng, 1]);
    return res.json(heatData);
  } catch (error) {
    console.error('Analytics heatmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- NEW OFFICIAL LGU REPORTS SUITE ---

// 1. Incident Master Log Report
router.get('/reports/master-log', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT i.id, i.code, i.type, i.lead_agency, i.status, i.triage_tag, i.created_at, i.updated_at,
             i.location_lat, i.location_lng, i.location_address, i.description, i.details,
             u.full_name as reporter_name, u.phone as reporter_phone, u.barangay as reporter_barangay,
             r.full_name as responder_name, r.agency_type as responder_agency,
             TIMESTAMPDIFF(MINUTE, i.created_at, (
               SELECT MIN(h.created_at) FROM incident_status_history h 
               WHERE h.incident_id = i.id AND h.status IN ('In Progress', 'Responding', 'On Scene', 'Resolved')
             )) as response_time_minutes
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const [rows] = await db.query(query, params);
    return res.json({ reports: rows, count: rows.length });
  } catch (error) {
    console.error('Master log report error:', error);
    res.status(500).json({ message: 'Server error while generating master log' });
  }
});

// 2. Barangay Risk & Disaster Incidence Summary Report
router.get('/reports/barangay-summary', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT 
        COALESCE(u.barangay, 'Unknown') as barangay,
        COUNT(i.id) as total_incidents,
        SUM(CASE WHEN i.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN i.status != 'Resolved' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN i.type = 'Fire' THEN 1 ELSE 0 END) as fire_count,
        SUM(CASE WHEN i.type = 'Medical' THEN 1 ELSE 0 END) as medical_count,
        SUM(CASE WHEN i.type = 'Flood' THEN 1 ELSE 0 END) as flood_count,
        SUM(CASE WHEN i.type = 'Accident' THEN 1 ELSE 0 END) as accident_count,
        SUM(CASE WHEN i.type = 'Crime' THEN 1 ELSE 0 END) as crime_count,
        SUM(CASE WHEN i.type NOT IN ('Fire', 'Medical', 'Flood', 'Accident', 'Crime') THEN 1 ELSE 0 END) as other_count
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      ${whereClause}
      GROUP BY u.barangay
      ORDER BY total_incidents DESC
    `;

    const [rows] = await db.query(query, params);
    return res.json({ barangays: rows });
  } catch (error) {
    console.error('Barangay summary report error:', error);
    res.status(500).json({ message: 'Server error while generating barangay summary' });
  }
});

// 3. Concerned Agency Dispatch & Performance Report
router.get('/reports/agency-performance', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT 
        COALESCE(i.lead_agency, r.agency_type, 'MDRRMO') as agency,
        COUNT(i.id) as total_incidents,
        SUM(CASE WHEN i.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN i.status IN ('In Progress', 'Responding', 'On Scene') THEN 1 ELSE 0 END) as dispatched_count,
        SUM(CASE WHEN i.status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        ROUND(AVG(
          TIMESTAMPDIFF(MINUTE, i.created_at, (
            SELECT MIN(h.created_at) FROM incident_status_history h 
            WHERE h.incident_id = i.id AND h.status IN ('In Progress', 'Responding', 'On Scene', 'Resolved')
          ))
        ), 1) as avg_response_mins
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      ${whereClause}
      GROUP BY COALESCE(i.lead_agency, r.agency_type, 'MDRRMO')
      ORDER BY total_incidents DESC
    `;

    const [rows] = await db.query(query, params);
    return res.json({ agencyPerformance: rows });
  } catch (error) {
    console.error('Agency performance report error:', error);
    res.status(500).json({ message: 'Server error while generating agency performance report' });
  }
});

// 4. Casualty, Impact & Damage Assessment Report
router.get('/reports/casualty-damage', async (req, res) => {
  try {
    const { conditions, params } = buildFilterConditions(req.query, 'i');
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT i.id, i.code, i.type, i.lead_agency, i.status, i.details, i.created_at,
             u.barangay, u.full_name as reporter_name
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const [rows] = await db.query(query, params);

    let totalVictims = 0;
    let totalHouseholds = 0;
    let totalRescuesNeeded = 0;
    let totalVehiclesInvolved = 0;
    const impactList = [];

    rows.forEach(row => {
      let d = {};
      if (row.details) {
        try {
          d = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        } catch (e) {}
      }

      const victims = parseInt(d.victims || d.patients || 0) || 0;
      const households = parseInt(d.households_affected || 0) || 0;
      const rescues = parseInt(d.people_needing_rescue || 0) || 0;
      const vehicles = parseInt(d.vehicles_involved || 0) || 0;

      totalVictims += victims;
      totalHouseholds += households;
      totalRescuesNeeded += rescues;
      totalVehiclesInvolved += vehicles;

      if (victims > 0 || households > 0 || rescues > 0 || vehicles > 0 || d.injuries || d.water_level) {
        impactList.push({
          code: row.code,
          type: row.type,
          barangay: row.barangay,
          date: row.created_at,
          victims,
          households,
          rescues,
          injuries: d.injuries || 'None reported',
          water_level: d.water_level || 'N/A'
        });
      }
    });

    return res.json({
      summary: {
        totalIncidentsEvaluated: rows.length,
        totalVictims,
        totalHouseholds,
        totalRescuesNeeded,
        totalVehiclesInvolved
      },
      impactList
    });
  } catch (error) {
    console.error('Casualty report error:', error);
    res.status(500).json({ message: 'Server error while generating casualty/damage report' });
  }
});

module.exports = router;
