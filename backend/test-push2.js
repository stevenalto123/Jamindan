const webpush = require('web-push');
require('dotenv').config();
webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
const subscription = { endpoint: 'https://wns2-bl2p.notify.windows.com/w/?token=BQYAAAAjGxp8XS8YjW%2fC6lOPG6yMPgy454EJysnfrgzpGYnOHqXpSM0YtS2K3Bm66xSTBrMenhLto0Bdh3q1zaFytJO6nRMe7ACq3iBN5tzYZyu5MZ%2fktuQchR0CNTWh%2fPGZh6triatVAQlQxtfLu8n%2bjbTASwUSGucQBc00gosT%2bA3AgKiUN32A1m0ROD1LNaScu2o%2bu5%2b3GFU8P6Xo%2blKdWPpnbhLyuw7UmXKh5uJAuy729resOHQ7lkP8csOMXXrt23rppQHjgEWp%2fwb%2fZtw%2b3a0KqrXW5xecsm2RvUzMaTDu%2b20E7hyHrPSgJMJp%2f0WpxWU9Vt5C8QGU2CYXDQKLDtvV', keys: { p256dh: 'BD6oUQYJcYISYemRvK8oKR7EawF1rlVULABuksT_O5H2O13vuEA5ubUbhRVnKMK-2yQzmEtC43PJWkA6zK3Y9iU', auth: 'mAddxJjn6Y4Xj_nnaitutA' } };
webpush.sendNotification(subscription, JSON.stringify({title: 'Test', body: 'Test push', icon: '/jamindan-seal.png', url: '/'})).then(() => console.log('Sent successfully!')).catch(e => console.error('Push Failed:', e));
