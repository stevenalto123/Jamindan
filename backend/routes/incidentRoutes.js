const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { webpush } = require('../config/push');
const { createImageUpload, createVideoUpload } = require('../config/cloudinary');

const upload = createImageUpload(5);
const uploadVideo = createVideoUpload(60);

// Helper: Generate Unique Incident Code
const generateIncidentCode = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomHex = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
  return `#${year}-${month}-${randomHex}`;};

// Create Incident Report (Residents, Admins, and Responders)
router.post('/', authRequired, requireRole(['Resident', 'Admin', 'Responder']), upload.single('photo'), async (req, res) => {
  const { type, description, location_lat, location_lng, location_address, details } = req.body;

  if (!type || !description) {
    return res.status(400).json({ message: 'Type and description are required' });
  }

  try {
    const photo_path = req.file ? req.file.path : null;
    const lat = (location_lat !== null && location_lat !== undefined && !isNaN(parseFloat(location_lat))) ? parseFloat(location_lat) : null;
    const lng = (location_lng !== null && location_lng !== undefined && !isNaN(parseFloat(location_lng))) ? parseFloat(location_lng) : null;
    const address = location_address || (lat ? null : 'GPS Location Unavailable');

    // Anti-Spam / Deduplication Guard: Check if this user already submitted a pending SOS within the last 5 minutes
    if (type === 'SOS Panic') {
      const [existingSos] = await db.query(`
        SELECT id, code, location_lat, location_lng 
        FROM incidents 
        WHERE reporter_id = ? 
          AND type = 'SOS Panic' 
          AND status = 'Pending' 
          AND created_at >= NOW() - INTERVAL 5 MINUTE
        ORDER BY created_at DESC 
        LIMIT 1
      `, [req.user.id]);

      if (existingSos && existingSos.length > 0) {
        const existing = existingSos[0];
        // If newer coordinates were provided, update the existing incident record
        if (lat !== null && lng !== null) {
          await db.query(`
            UPDATE incidents 
            SET location_lat = ?, location_lng = ?, location_address = COALESCE(?, location_address), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [lat, lng, address, existing.id]);
        }

        const [repRows] = await db.query("SELECT full_name, phone, barangay FROM users WHERE id = ?", [req.user.id]);
        const resident = repRows[0] || {};

        const io = req.app.get('io');
        if (io) {
          const sosPayload = {
            incidentId: existing.id,
            type: 'SOS Panic',
            code: existing.code,
            description: description,
            location_lat: lat !== null ? lat : existing.location_lat,
            location_lng: lng !== null ? lng : existing.location_lng,
            location_address: address,
            reporterId: req.user.id,
            reporterName: resident.full_name || 'Resident',
            reporterPhone: resident.phone || '',
            barangay: resident.barangay || '',
            deduplicated: true,
            timestamp: new Date().toISOString()
          };
          io.emit('new-incident', sosPayload);
          io.emit('sos-panic-alert', sosPayload);
          io.emit('incident-status-updated', { incidentId: existing.id, status: 'Pending', type: 'SOS Panic' });
        }

        return res.status(200).json({
          message: 'Existing SOS emergency alert updated with freshest GPS coordinates.',
          code: existing.code,
          incidentId: existing.id,
          deduplicated: true
        });
      }
    }

    const code = await generateIncidentCode();
    let detailsJson = null;
    try {
      if (details) detailsJson = typeof details === 'string' ? details : JSON.stringify(details);
    } catch (e) {
      console.warn("Failed to stringify details");
    }

    let finalLeadAgency = req.body.lead_agency || null;
    if (!finalLeadAgency) {
      if (type === 'Fire') finalLeadAgency = 'BFP';
      else if (type === 'Medical') finalLeadAgency = 'RHU';
      else finalLeadAgency = 'MDRRMO';
    }

    const [reporterRows] = await db.query("SELECT full_name, phone, barangay FROM users WHERE id = ?", [req.user.id]);
    const reporter = reporterRows[0] || {};

    const incidentId = await db.transaction(async (conn) => {
      // 1. Create Incident
      const [incidentResult] = await conn.execute(`
        INSERT INTO incidents (code, reporter_id, type, lead_agency, description, details, photo_path, location_lat, location_lng, location_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [code, req.user.id, type, finalLeadAgency, description, detailsJson, photo_path, lat, lng, address]);

      const insId = incidentResult.insertId;

      // 2. Insert Status History Log
      await conn.execute(`
        INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
        VALUES (?, 'Pending', 'Incident report submitted.', ?)
      `, [insId, req.user.id]);

      // 3. Fetch Potential Recipients (Only Admins get the initial report broadcast now)
      const [recipients] = await conn.query("SELECT id, role, agency_type, push_subscription FROM users WHERE role = 'Admin' AND is_active = 1");

      for (const recipient of recipients) {
        // App Notification
        await conn.execute(`
          INSERT INTO notifications (user_id, title, message, reference_type, reference_id)
          VALUES (?, 'New Emergency Report', ?, 'incident', ?)
        `, [
          recipient.id,
          `A new ${type} report (${code}) has been reported by ${reporter.full_name || 'a Resident'}.`,
          insId
        ]);

        // Web Push Notification
        if (recipient.push_subscription) {
          try {
            const subscription = JSON.parse(recipient.push_subscription);
            const payload = JSON.stringify({
              title: `🚨 URGENT: ${type}`,
              body: `Incident ${code} reported by ${reporter.full_name || 'Resident'} at ${address || 'GPS Location'}!`,
              icon: '/logo.png',
              url: '/incidents'
            });
            await webpush.sendNotification(subscription, payload);
          } catch (pushErr) {
            console.error('Failed to send push notification to user', recipient.id, pushErr.message);
          }
        }
      }

      return insId;
    });

    await db.logAudit(`Incident reported: ${code} (${type})`, req.user.username, req.ip);
    
    const io = req.app.get('io');
    if (io) {
      const incidentPayload = {
        incidentId,
        type,
        code,
        leadAgency: finalLeadAgency,
        description,
        location_lat: lat,
        location_lng: lng,
        location_address: address,
        reporterId: req.user.id,
        reporterName: reporter.full_name || 'Resident',
        reporterPhone: reporter.phone || '',
        barangay: reporter.barangay || '',
        timestamp: new Date().toISOString()
      };
      io.emit('new-incident', incidentPayload);
      if (type === 'SOS Panic') {
        io.emit('sos-panic-alert', incidentPayload);
      }
    }

    return res.status(201).json({
      message: 'Report submitted successfully!',
      code,
      incidentId
    });

  } catch (error) {
    console.error('Incident creation error:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// List Incidents
router.get('/', authRequired, async (req, res) => {
  const { status, type, search, agency } = req.query;

  try {
    let query = `
      SELECT i.*, 
             u.full_name as reporter_name, u.phone as reporter_phone, u.barangay as reporter_barangay,
             r.full_name as responder_name, r.agency_type as responder_agency
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.responder_id = r.id
    `;
    const params = [];
    const conditions = [];

    // Filter by ownership / role
    if (req.user.role === 'Resident') {
      conditions.push('i.reporter_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'Responder') {
      if (req.user.agency_type) {
        // Responders see incidents dispatched to them (primary or co-dispatched) OR active incidents for their agency
        let targetAgencies = [req.user.agency_type];
        if (req.user.agency_type === 'Fire') targetAgencies.push('BFP');
        if (req.user.agency_type === 'BFP') targetAgencies.push('Fire');
        if (req.user.agency_type === 'Medical') targetAgencies.push('RHU');
        if (req.user.agency_type === 'RHU') targetAgencies.push('Medical');

        conditions.push(`(
          i.responder_id = ?
          OR (i.lead_agency IN (?, ?) AND (i.responder_id IS NULL OR i.status != "Resolved"))
          OR i.id IN (SELECT reference_id FROM notifications WHERE user_id = ? AND reference_type = 'incident')
        )`);
        params.push(req.user.id, targetAgencies[0], targetAgencies[1] || targetAgencies[0], req.user.id);
      } else {
        conditions.push(`(
          i.responder_id = ?
          OR i.id IN (SELECT reference_id FROM notifications WHERE user_id = ? AND reference_type = 'incident')
        )`);
        params.push(req.user.id, req.user.id);
      }
    }

    // Filter by agency
    if (agency) {
      conditions.push('i.lead_agency = ?');
      params.push(agency);
    }

    // Filter by status
    if (status) {
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        const placeholders = statuses.map(() => '?').join(',');
        conditions.push(`i.status IN (${placeholders})`);
        params.push(...statuses);
      } else {
        conditions.push('i.status = ?');
        params.push(status);
      }
    }

    // Filter by type
    if (type) {
      conditions.push('i.type = ?');
      params.push(type);
    }

    // Search query (for admin/responder)
    if (search && req.user.role !== 'Resident') {
      conditions.push('(u.full_name LIKE ? OR i.code LIKE ? OR u.barangay LIKE ? OR i.description LIKE ?)');
      const wildCard = `%${search}%`;
      params.push(wildCard, wildCard, wildCard, wildCard);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Push closed incidents ('Resolved' & 'False Alarm') to the bottom; active emergencies float to the top
    const keywordRegex = '(unconscious|bleeding|fire|trapped|armed|heart attack|stroke|not breathing|critical|severe|gun|knife|suicide|explosion)';
    if (req.user.role !== 'Resident') {
      query += ` ORDER BY 
        CASE WHEN i.status IN ('Resolved', 'False Alarm') THEN 2 ELSE 1 END ASC,
        CASE WHEN i.status NOT IN ('Resolved', 'False Alarm') AND i.description REGEXP '${keywordRegex}' THEN 1 ELSE 2 END ASC, 
        i.created_at DESC`;
    } else {
      query += ` ORDER BY 
        CASE WHEN i.status IN ('Resolved', 'False Alarm') THEN 2 ELSE 1 END ASC, 
        i.created_at DESC`;
    }

    const [incidents] = await db.query(query, params);
    
    // Epic Feature 4: Smart Incident Prioritization Algorithm
    const criticalKeywords = /(unconscious|bleeding|fire|trapped|armed|heart attack|stroke|not breathing|critical|severe|gun|knife|suicide|explosion)/i;
    
    const processedIncidents = incidents.map(inc => {
      let priority = 'Normal';
      // Only ACTIVE incidents can be prioritized as CRITICAL (closed or false alarm incidents should never be critical)
      const isClosed = inc.status === 'Resolved' || inc.status === 'False Alarm';
      if (!isClosed && inc.description && criticalKeywords.test(inc.description)) {
        priority = 'CRITICAL';
      }
      return { ...inc, priority };
    });

    return res.json(processedIncidents);

  } catch (error) {
    console.error('List incidents error:', error);
    return res.status(500).json({ message: 'Server error while fetching incidents' });
  }
});

// Get Incident Detail (with status history timeline)
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const [incidentRows] = await db.query(`
      SELECT i.*, 
             u.full_name as reporter_name, 
             u.phone as reporter_phone, 
             u.barangay as reporter_barangay,
             u.purok_sitio as reporter_purok_sitio,
             u.blood_type as reporter_blood_type,
             u.allergies as reporter_allergies,
             u.medical_conditions as reporter_medical_conditions,
             u.emergency_contact_name as reporter_emergency_contact_name,
             u.emergency_contact_phone as reporter_emergency_contact_phone,
             resp.full_name as responder_name,
             resp.phone as responder_phone,
             resp.current_lat as responder_lat,
             resp.current_lng as responder_lng,
             v.name as vehicle_name,
             v.type as vehicle_type,
             v.agency as vehicle_agency
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users resp ON i.responder_id = resp.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.id = ?
    `, [id]);

    const incident = incidentRows[0];

    if (!incident) {
      return res.status(404).json({ message: 'Incident report not found' });
    }

    // Security check: Residents can only view their own
    if (req.user.role === 'Resident' && incident.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [history] = await db.query(`
      SELECT h.*, u.full_name as updated_by_name, u.role as updated_by_role
      FROM incident_status_history h
      JOIN users u ON h.updated_by = u.id
      WHERE h.incident_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    // Fetch reporter's household members list
    const [household] = await db.query(`
      SELECT id, full_name, age, gender, medical_notes
      FROM household_members
      WHERE user_id = ?
      ORDER BY id ASC
    `, [incident.reporter_id]);

    return res.json({ 
      incident, 
      history, 
      reporterHousehold: household 
    });

  } catch (error) {
    console.error('Fetch incident detail error:', error);
    return res.status(500).json({ message: 'Server error while fetching incident detail' });
  }
});

// Epic Feature 1: Live Responder Tracking - Get Responder Location
router.get('/:id/responder-location', authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT i.reporter_id, i.responder_id, u.current_lat, u.current_lng, u.full_name as responder_name
      FROM incidents i
      LEFT JOIN users u ON i.responder_id = u.id
      WHERE i.id = ?
    `, [id]);

    const data = rows[0];

    if (!data) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    // Security check: Only the reporter or an Admin/Responder can track
    if (req.user.role === 'Resident' && data.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!data.responder_id) {
      return res.json({
        responder_name: null,
        lat: null,
        lng: null
      });
    }

    return res.json({
      responder_name: data.responder_name,
      lat: data.current_lat,
      lng: data.current_lng
    });

  } catch (error) {
    console.error('Fetch responder location error:', error);
    return res.status(500).json({ message: 'Server error while fetching responder location' });
  }
});

// Update Incident Status (Admin / Responder only)
router.put('/:id/status', authRequired, requireRole(['Admin', 'Responder']), async (req, res) => {
  const { id } = req.params;
  const { status, comment, response_notes, resources_used } = req.body;

  const validStatuses = ['Pending', 'Acknowledged', 'Responding', 'On Scene', 'Resolved', 'False Alarm'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [incidentRows] = await db.query('SELECT code, reporter_id, status, responder_id, vehicle_id, response_notes, resources_used FROM incidents WHERE id = ?', [id]);
    const incident = incidentRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (incident.status === status && !response_notes && !resources_used) {
      return res.status(400).json({ message: `Incident is already marked as ${status}` });
    }

    await db.transaction(async (conn) => {
      // 1. Update status, response_notes, resources_used (and auto-assign Responder if they are the first to change it from Pending)
      const isSwitchingToFalseAlarm = status === 'False Alarm';
      const providedNotes = response_notes && response_notes.trim() !== '' ? response_notes.trim() : null;
      const providedResources = resources_used && resources_used.trim() !== '' ? resources_used.trim() : null;

      let updateQuery = `
        UPDATE incidents 
        SET status = ?, 
            response_notes = ?, 
            resources_used = ?, 
            updated_at = CURRENT_TIMESTAMP
      `;
      const finalNotes = isSwitchingToFalseAlarm 
        ? providedNotes 
        : (providedNotes !== null ? providedNotes : (incident.response_notes || null));
      const finalResources = isSwitchingToFalseAlarm 
        ? providedResources 
        : (providedResources !== null ? providedResources : (incident.resources_used || null));

      const updateParams = [
        status,
        finalNotes || null,
        finalResources || null
      ];
      
      if (req.user.role === 'Responder' && incident.responder_id === null) {
        updateQuery += ', responder_id = ?';
        updateParams.push(req.user.id);
      }
      
      updateQuery += ' WHERE id = ?';
      updateParams.push(id);

      await conn.execute(updateQuery, updateParams);

      // Auto-release assigned emergency vehicle when incident is Resolved or False Alarm
      if ((status === 'Resolved' || status === 'False Alarm') && incident.vehicle_id) {
        await conn.execute("UPDATE vehicles SET status = 'Available' WHERE id = ?", [incident.vehicle_id]);
      }

      // 2. Insert into history
      const fullComment = [
        comment || `Status updated to ${status}.`,
        response_notes && response_notes.trim() ? `Action Taken: ${response_notes.trim()}` : null,
        resources_used && resources_used.trim() ? `Resources Used: ${resources_used.trim()}` : null
      ].filter(Boolean).join(' • ');

      await conn.execute(`
        INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
        VALUES (?, ?, ?, ?)
      `, [id, status, fullComment, req.user.id]);

      // 3. Notify resident
      if (incident.reporter_id) {
        await conn.execute(`
          INSERT INTO notifications (user_id, title, message, reference_type, reference_id)
          VALUES (?, ?, ?, 'incident', ?)
        `, [
          incident.reporter_id,
          'Report Status Update',
          `Your incident report ${incident.code} has been updated to "${status}".`,
          id
        ]);
      }
    });

      await db.logAudit(`Incident status updated to [${status}] for ${incident.code}`, req.user.username, req.ip);
      
      const io = req.app.get('io');
      if (io) {
        io.emit('incident-status-updated', { incidentId: id, status, reporterId: incident.reporter_id, code: incident.code });
        // Also emit to the specific incident room for residents tracking it
        io.to(`incident-${id}`).emit('incident-status-updated', { incidentId: id, status, reporterId: incident.reporter_id, code: incident.code });
      }

      return res.json({ message: `Incident status updated to ${status} successfully.` });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Server error while updating status: ' + (error.message || '') });
  }
});

// Delete Incident Report (Admin only)
router.delete('/:id', authRequired, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const [incidentRows] = await db.query('SELECT code FROM incidents WHERE id = ?', [id]);
    const incident = incidentRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await db.execute("DELETE FROM notifications WHERE reference_type = 'incident' AND reference_id = ?", [id]);
    await db.execute('DELETE FROM incident_status_history WHERE incident_id = ?', [id]);
    await db.execute('DELETE FROM incidents WHERE id = ?', [id]);

    await db.logAudit(`Incident report deleted permanently: ${incident.code}`, req.user.username, req.ip);
    return res.json({ message: 'Incident report deleted successfully.' });
  } catch (error) {
    console.error('Delete incident error:', error);
    return res.status(500).json({ message: 'Server error while deleting incident' });
  }
});

// Update Incident Lead Agency and Agency Notes (Admin / Responder)
router.put('/:id/agency', authRequired, requireRole(['Admin', 'Responder']), async (req, res) => {
  const { id } = req.params;
  const { lead_agency, agency_notes } = req.body;

  try {
    const [incRows] = await db.query('SELECT code, type, status, lead_agency FROM incidents WHERE id = ?', [id]);
    const incident = incRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const targetLead = lead_agency || incident.lead_agency || 'MDRRMO';

    await db.query(
      'UPDATE incidents SET lead_agency = COALESCE(?, lead_agency), agency_notes = COALESCE(?, agency_notes) WHERE id = ?',
      [lead_agency || null, agency_notes || null, id]
    );

    const currentStatus = incident.status || 'Pending';
    const logDetail = `Agency update: Lead [${targetLead}]. Notes: ${agency_notes || 'None'}`;
    await db.query(
      'INSERT INTO incident_status_history (incident_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
      [id, currentStatus, logDetail, req.user.id]
    );

    await db.logAudit(`Agency coordination updated for ${incident.code}: ${targetLead}`, req.user.username, req.ip);

    // Notify all active Responders belonging to the target Lead Agency (e.g., RHU, BFP, MDRRMO)
    try {
      let agencyAliases = [targetLead];
      if (targetLead === 'RHU') agencyAliases.push('Medical');
      else if (targetLead === 'BFP') agencyAliases.push('Fire');
      else if (targetLead === 'MDRRMO') agencyAliases.push('Rescue');

      const [agencyResponders] = await db.query(
        'SELECT id, push_subscription FROM users WHERE role = "Responder" AND is_active = 1 AND agency_type IN (?, ?)',
        [agencyAliases[0], agencyAliases[1] || agencyAliases[0]]
      );

      const notifTitle = `🚨 Inter-Agency Handoff (${targetLead})`;
      const notifBody = `Incident ${incident.code} (${incident.type}) is assigned to ${targetLead}.${agency_notes ? ' Notes: ' + agency_notes : ''}`;

      for (const resp of agencyResponders) {
        try {
          await db.execute(
            'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
            [resp.id, notifTitle, notifBody, 'incident', id]
          );

          if (resp.push_subscription) {
            const subscription = JSON.parse(resp.push_subscription);
            await webpush.sendNotification(subscription, JSON.stringify({
              title: notifTitle,
              body: notifBody,
              icon: '/logo.png',
              url: '/incidents/' + id
            })).catch(() => {});
          }
        } catch (respErr) {
          console.warn('Responder notification warning:', respErr.message);
        }
      }
    } catch (notifErr) {
      console.warn('Inter-agency notifications skipped:', notifErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('incident-status-updated', { incidentId: id });
      io.emit('agency-handoff', {
        incidentId: id,
        code: incident.code,
        type: incident.type,
        leadAgency: targetLead,
        notes: agency_notes || '',
        updatedById: req.user.id
      });
    }

    return res.json({ message: 'Agency coordination updated successfully.' });
  } catch (error) {
    console.error('Update agency error:', error);
    return res.status(500).json({ message: 'Server error while updating agency: ' + (error.message || '') });
  }
});

// --- INCIDENT CHAT ROUTES ---

// Get chat history for an incident
router.get('/:id/chat', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const [incRows] = await db.query('SELECT reporter_id FROM incidents WHERE id = ?', [id]);
    if (!incRows[0]) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    if (req.user.role === 'Resident' && incRows[0].reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [messages] = await db.query(`
      SELECT c.*, u.full_name, u.role, u.avatar 
      FROM incident_chats c
      JOIN users u ON c.sender_id = u.id
      WHERE c.incident_id = ?
      ORDER BY c.created_at ASC
    `, [id]);
    return res.json({ messages });
  } catch (error) {
    console.error('Fetch chat error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Send a chat message
router.post('/:id/chat', authRequired, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  try {
    const [incRows] = await db.query('SELECT reporter_id FROM incidents WHERE id = ?', [id]);
    if (!incRows[0]) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    if (req.user.role === 'Resident' && incRows[0].reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Save to database
    const [result] = await db.query(
      'INSERT INTO incident_chats (incident_id, sender_id, message) VALUES (?, ?, ?)',
      [id, req.user.id, message.trim()]
    );

    // Fetch the inserted message with sender details
    const [newMsgRows] = await db.query(`
      SELECT c.*, u.full_name, u.role, u.avatar 
      FROM incident_chats c
      JOIN users u ON c.sender_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    const newMessage = newMsgRows[0];

    // Emit to Socket.io Room
    const io = req.app.get('io');
    if (io) {
      io.to(`incident-${id}`).emit('new-chat-message', newMessage);
    }

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Send chat error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Assign Responder (Admin only) - supports initial dispatch AND additional backup/medical dispatch + vehicle fleet sync
router.put('/:id/assign', authRequired, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { responder_id, vehicle_id } = req.body;
  
  if (!responder_id) {
    return res.status(400).json({ message: 'responder_id is required' });
  }

  try {
    const [incRows] = await db.query(
      `SELECT i.id, i.reporter_id, i.responder_id, i.vehicle_id, i.status, i.code, i.type, i.description,
              i.location_address, i.location_lat, i.location_lng, i.agency_notes,
              u.full_name AS reporter_name, u.phone AS reporter_phone, u.barangay AS reporter_barangay
       FROM incidents i
       LEFT JOIN users u ON i.reporter_id = u.id
       WHERE i.id = ?`,
      [id]
    );
    const incident = incRows[0];

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    const [respRows] = await db.query('SELECT id, full_name, agency_type, push_subscription FROM users WHERE id = ?', [responder_id]);
    const assignedResponder = respRows[0];
    const respLabel = assignedResponder
      ? `${assignedResponder.full_name} (${assignedResponder.agency_type || 'MDRRMO'})`
      : `Responder #${responder_id}`;

    let assignedVehicle = null;
    if (vehicle_id) {
      const [vehRows] = await db.query('SELECT id, name, type, agency FROM vehicles WHERE id = ?', [vehicle_id]);
      assignedVehicle = vehRows[0] || null;
      if (assignedVehicle) {
        await db.query("UPDATE vehicles SET status = 'Dispatched' WHERE id = ?", [assignedVehicle.id]);
      }
    }

    const vehicleLabel = assignedVehicle ? ` with ${assignedVehicle.name} (${assignedVehicle.type})` : '';
    const nextStatus = ['Pending', 'Acknowledged'].includes(incident.status) ? 'Responding' : incident.status;
    const isBackup = Boolean(incident.responder_id && String(incident.responder_id) !== String(responder_id));

    if (isBackup) {
      // Additional / Backup Responder Dispatched (e.g. RHU Medical dispatched to support BFP Fire)
      const coNote = `[Backup Dispatched: ${respLabel}${vehicleLabel}]`;
      const updatedNotes = incident.agency_notes
        ? (incident.agency_notes.includes(coNote) ? incident.agency_notes : `${incident.agency_notes} | ${coNote}`)
        : coNote;
      const newVehicleId = incident.vehicle_id || (assignedVehicle ? assignedVehicle.id : null);
      await db.query(
        'UPDATE incidents SET status = ?, agency_notes = ?, vehicle_id = ? WHERE id = ?',
        [nextStatus, updatedNotes, newVehicleId, id]
      );
      await db.query(
        'INSERT INTO incident_status_history (incident_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
        [id, nextStatus, `Additional support unit dispatched: ${respLabel}${vehicleLabel}`, req.user.id]
      );
    } else {
      // Primary Responder Dispatched
      const newVehicleId = assignedVehicle ? assignedVehicle.id : incident.vehicle_id;
      await db.query(
        'UPDATE incidents SET responder_id = ?, vehicle_id = ?, status = ? WHERE id = ?',
        [responder_id, newVehicleId, nextStatus, id]
      );
      await db.query(
        'INSERT INTO incident_status_history (incident_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
        [id, nextStatus, `Incident dispatched to ${respLabel}${vehicleLabel}`, req.user.id]
      );
    }

    // Send Database and Web Push Notification to the dispatched responder
    if (assignedResponder) {
      const pushTitle = isBackup ? '🚨 BACKUP DISPATCH ALERT' : '🚨 EMERGENCY DISPATCH ALERT';
      const pushBody = isBackup
        ? `You have been dispatched as BACKUP for Incident ${incident.code}${vehicleLabel}. Respond immediately!`
        : `You have been dispatched to Incident ${incident.code}${vehicleLabel}. Respond immediately!`;

      await db.execute(
        'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
        [responder_id, pushTitle, pushBody, 'incident', id]
      );

      if (assignedResponder.push_subscription) {
        try {
          const subscription = JSON.parse(assignedResponder.push_subscription);
          const payload = JSON.stringify({
            title: pushTitle,
            body: pushBody,
            icon: '/logo.png',
            url: '/incidents/' + id
          });
          await webpush.sendNotification(subscription, payload);
        } catch (pushErr) {
          console.error('Failed to send dispatch push notification', responder_id);
        }
      }
    }
    
    // Emit real-time events via Socket.io with rich payload for Command Center & Responders
    const io = req.app.get('io');
    if (io) {
      const dispatchPayload = { 
        id, 
        incidentId: id, 
        status: nextStatus, 
        responderId: responder_id, 
        reporterId: incident.reporter_id,
        code: incident.code,
        type: incident.type,
        location_address: incident.location_address,
        location_lat: incident.location_lat,
        location_lng: incident.location_lng,
        reporterName: incident.reporter_name,
        reporterPhone: incident.reporter_phone,
        barangay: incident.reporter_barangay,
        description: isBackup
          ? `You have been dispatched as BACKUP assistance for Incident #${incident.code}${vehicleLabel}. Respond immediately.`
          : (incident.description || `You have been dispatched to Incident #${incident.code}${vehicleLabel}. Respond immediately.`),
        isBackup,
        vehicleName: assignedVehicle ? assignedVehicle.name : null,
        vehicleType: assignedVehicle ? assignedVehicle.type : null
      };

      io.emit('responder-dispatched', dispatchPayload);
      io.emit('incident-status-updated', { 
        id,
        incidentId: id, 
        status: nextStatus, 
        reporterId: incident.reporter_id, 
        code: incident.code 
      });
    }

    return res.json({ message: 'Responder dispatched successfully' });
  } catch (error) {
    console.error('Assign responder error:', error);
    return res.status(500).json({ message: 'Server error while assigning responder' });
  }
});

// Upload & Attach Video Evidence (Live stream recording or file upload)
router.post('/:id/video', authRequired, requireRole(['Admin', 'Responder', 'Resident']), uploadVideo.single('video'), async (req, res) => {
  const { id } = req.params;

  try {
    const [incRows] = await db.query('SELECT * FROM incidents WHERE id = ?', [id]);
    const incident = incRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Role check: Resident can only upload video to their own incident report
    if (req.user.role === 'Resident' && incident.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to attach video evidence to this incident' });
    }

    const video_path = req.file ? req.file.path : (req.body.video_url || null);
    if (!video_path) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    await db.query('UPDATE incidents SET video_path = ? WHERE id = ?', [video_path, id]);

    // Insert history entry
    await db.query(
      'INSERT INTO incident_status_history (incident_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
      [id, incident.status || 'In Progress', 'Official live feed video evidence attached to incident report.', req.user.id]
    );

    // Audit log
    await db.logAudit(`Video evidence attached to ${incident.code}`, req.user.username, req.ip);

    // Notify connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      const updateData = {
        id,
        incidentId: id,
        video_path,
        updatedBy: req.user.full_name || req.user.username
      };
      io.emit('incident-video-updated', updateData);
      io.to(`incident-${id}`).emit('incident-video-updated', updateData);
    }

    return res.json({
      message: 'Video evidence attached to incident successfully',
      video_path
    });
  } catch (error) {
    console.error('Attach video evidence error:', error);
    return res.status(500).json({ message: error.message || 'Server error while attaching video evidence' });
  }
});

module.exports = router;
