const fs = require('fs');
let data = fs.readFileSync('backend/routes/incidentRoutes.js', 'utf8');

const replacement = // 4. Fetch Potential Recipients (Only Admins get the initial report broadcast now)
      const [recipients] = await conn.query("SELECT id, role, agency_type, push_subscription FROM users WHERE role = 'Admin' AND is_active = 1");
      const [residentRows] = await conn.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
      const resident = residentRows[0];

      for (const recipient of recipients) {
        await conn.execute(
          'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
          [
            recipient.id,
            'New Emergency Report',
            'A new ' + type + ' report (' + code + ') has been reported by ' + (resident ? resident.full_name : 'a Resident') + '.',
            'incident',
            insId
          ]
        );

        if (recipient.push_subscription) {
          try {
            const subscription = JSON.parse(recipient.push_subscription);
            const payload = JSON.stringify({
              title: '?? URGENT: ' + type,
              body: 'Incident ' + code + ' reported by ' + (resident ? resident.full_name : 'Resident') + ' at ' + (address || 'GPS Location') + '!',
              icon: '/jamindan-seal.png',
              url: '/incidents'
            });
            await webpush.sendNotification(subscription, payload);
          } catch (pushErr) {
            console.error('Failed to send push notification', recipient.id);
          }
        }
      }

      return insId;

      // 3. Notify resident;

data = data.replace(/\/\/ 4\. Fetch Potential Recipients.*?\/\/ 3\. Notify resident/s, replacement);
fs.writeFileSync('backend/routes/incidentRoutes.js', data);
