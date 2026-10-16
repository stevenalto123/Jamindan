const db = require('./config/db');

async function seedIncidents() {
  console.log('Seeding realistic Jamindan demo incidents...');

  const incidentsData = [
    {
      code: '#2026-10-1011',
      reporter_id: 6, // resident
      responder_id: 3, // bfp_responder
      type: 'Fire',
      lead_agency: 'BFP',
      description: 'Residential structure fire reported near Jamindan Public Market. Dense smoke and flames observed from wooden 2-storey house. Surrounding homes being evacuated.',
      details: JSON.stringify({ structure_type: 'Residential Timber', fire_alarm_level: 'First Alarm', affected_families: 2, injured: 0 }),
      photo_path: null,
      location_lat: 11.3975,
      location_lng: 122.3998,
      location_address: 'Poblacion, Jamindan, Capiz (Near Public Market)',
      status: 'In Progress',
      triage_tag: 'Yellow',
      response_notes: 'BFP Engine 1 and water tanker on scene. Water line deployed from municipal fire hydrant. Primary search complete, no civilian casualties.',
      agency_notes: 'BFP requested MDRRMO WASAR rescue van to standby for family evacuation transport.'
    },
    {
      code: '#2026-10-1012',
      reporter_id: 6, // resident
      responder_id: 4, // rhu_medic
      type: 'Medical',
      lead_agency: 'RHU',
      description: 'Head-on collision between motorcycle and passenger tricycle along highway near Lucero Elementary School. 2 motorists sustained open wounds and head trauma.',
      details: JSON.stringify({ vehicles: 'Motorcycle & Tricycle', casualties: 2, triage: '1 Red, 1 Yellow', transport: 'Jamindan Rural Health Unit' }),
      photo_path: null,
      location_lat: 11.4120,
      location_lng: 122.3850,
      location_address: 'Barangay Lucero, Jamindan, Capiz',
      status: 'In Progress',
      triage_tag: 'Red',
      response_notes: 'RHU paramedic team arrived on site. Cervical spine immobilization and bleeding control applied. Patient 1 prepared for immediate ambulance transport.',
      agency_notes: '[PNP Referral] MDRRMO notified Jamindan PNP Station (0908-641-5589) for traffic diversion and incident scene investigation.'
    },
    {
      code: '#2026-10-1013',
      reporter_id: 6, // resident
      responder_id: 2, // responder (MDRRMO)
      type: 'Flood',
      lead_agency: 'MDRRMO',
      description: 'Panay River tributary overflowed following continuous heavy rainfall. Low-lying Purok 3 inundated with waist-deep floodwaters. 5 families trapped on upper floor.',
      details: JSON.stringify({ water_level: '1.2 meters (Waist-deep)', affected_households: 5, total_individuals: 18, evacuation_site: 'Agloloway Barangay Hall' }),
      photo_path: null,
      location_lat: 11.3850,
      location_lng: 122.4150,
      location_address: 'Barangay Agloloway, Jamindan, Capiz (Purok 3)',
      status: 'In Progress',
      triage_tag: 'Yellow',
      response_notes: 'MDRRMO WASAR rescue squad deployed aluminum response boat and life vests. Extrication of 18 residents ongoing towards barangay evacuation center.',
      agency_notes: 'MDRRMO coordinating with MSWDO for immediate distribution of relief family food packs.'
    },
    {
      code: '#2026-10-1014',
      reporter_id: 6, // resident
      responder_id: 2, // responder (MDRRMO)
      type: 'Landslide',
      lead_agency: 'MDRRMO',
      description: 'Mountain slope erosion caused soil, rocks, and fallen bamboo trees to block provincial access road. Complete obstruction for all vehicles.',
      details: JSON.stringify({ road_condition: 'Fully Cleared and Passable', debris_volume_cubic_meters: 15, equipment_dispatched: 'Backhoe & Dump Truck' }),
      photo_path: null,
      location_lat: 11.4250,
      location_lng: 122.3680,
      location_address: 'Barangay Linambasan, Jamindan, Capiz (Km 14)',
      status: 'Resolved',
      triage_tag: 'Green',
      response_notes: 'MDRRMO clearing crew dispatched with heavy wheel loader. Roadway thoroughly scraped, washed, and declared safe for regular vehicular traffic at 14:15.',
      agency_notes: 'MDRRMO safety inspector declared hillside stable. No resident houses damaged.'
    },
    {
      code: '#2026-10-1015',
      reporter_id: 6, // resident
      responder_id: 4, // rhu_medic
      type: 'Medical',
      lead_agency: 'RHU',
      description: 'Elderly resident (68 y/o male) experiencing severe respiratory distress and acute chest pains. Family requesting emergency oxygen delivery and medical transport.',
      details: JSON.stringify({ patient_age: 68, initial_spO2: '88%', post_treatment_spO2: '97%', disposition: 'Admitted for Observation' }),
      photo_path: null,
      location_lat: 11.3780,
      location_lng: 122.3890,
      location_address: 'Barangay Jagnaya, Jamindan, Capiz',
      status: 'Resolved',
      triage_tag: 'Red',
      response_notes: 'RHU emergency ambulance responded within 7 minutes. Patient stabilized via supplemental oxygen and IV access. Transferred safely to Rural Health Center.',
      agency_notes: 'RHU Medical Officer Dr. confirmed vitals normalized. Patient stable under medical monitoring.'
    },
    {
      code: '#2026-10-1016',
      reporter_id: 6, // resident
      responder_id: 3, // bfp_responder
      type: 'Fire',
      lead_agency: 'BFP',
      description: 'Grassland fire ignited near an agricultural poultry facility. High winds spreading embers towards farm perimeter fencing.',
      details: JSON.stringify({ estimated_area_sqm: 450, facility_status: 'Protected and Unharmed', cause_of_fire: 'Open field brush ignition' }),
      photo_path: null,
      location_lat: 11.4050,
      location_lng: 122.4200,
      location_address: 'Barangay Bayuyan, Jamindan, Capiz',
      status: 'Resolved',
      triage_tag: 'Green',
      response_notes: 'BFP firefighting crew deployed two 1.5-inch attack hose lines. Fire completely extinguished and perimeter damped down. Zero damage to commercial poultry shed.',
      agency_notes: 'BFP investigator completed post-fire clearance with farm owner.'
    }
  ];

  try {
    for (const data of incidentsData) {
      // Check if already seeded
      const [existing] = await db.execute('SELECT id FROM incidents WHERE code = ?', [data.code]);
      if (existing.length > 0) {
        console.log(`Incident ${data.code} already exists. Skipping.`);
        continue;
      }

      const [res] = await db.execute(`
        INSERT INTO incidents (
          code, reporter_id, responder_id, type, lead_agency, description, details, 
          photo_path, location_lat, location_lng, location_address, status, 
          triage_tag, response_notes, agency_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.code, data.reporter_id, data.responder_id, data.type, data.lead_agency,
        data.description, data.details, data.photo_path, data.location_lat,
        data.location_lng, data.location_address, data.status, data.triage_tag,
        data.response_notes, data.agency_notes
      ]);

      const incidentId = res.insertId;

      // Add status history
      await db.execute(`
        INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
        VALUES (?, 'Pending', 'Initial emergency report logged by resident.', ?)
      `, [incidentId, data.reporter_id]);

      if (data.status === 'In Progress' || data.status === 'Resolved') {
        await db.execute(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
          VALUES (?, 'In Progress', 'Lead agency dispatched active response unit.', ?)
        `, [incidentId, data.responder_id]);
      }

      if (data.status === 'Resolved') {
        await db.execute(`
          INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
          VALUES (?, 'Resolved', 'Operation concluded. Incident scene cleared and verified.', ?)
        `, [incidentId, data.responder_id]);
      }

      console.log(`Successfully seeded incident ${data.code} (ID: ${incidentId}) [${data.type} -> ${data.lead_agency}]`);
    }

    console.log('Incident seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed incidents:', err);
    process.exit(1);
  }
}

seedIncidents();
