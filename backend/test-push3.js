const webpush = require('web-push');
require('dotenv').config();
webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/dOvsAKnkxgM:APA91bHFqyuuS50pcxmQFqwdfm9xW8VX8WXqI-rlhnasoAQclXsVYIjsnbAaHfLbJ368GjCMnDFvrjcyXvbtLtlNAd52IUTgAPZttpRf740JP9D8craxyVwhtBH7HkLbB72vEDMr92t3', keys: { p256dh: 'BLIj25h-tcJ5Q4muavg7v5-P7akbdeHBrXllHntZ3ke_KauO3lZvdTKJ3fMcbuflQFLFRiJ60Ap1osRF_WC4pqc', auth: 'Zut8EfgfiGnxgTTQSNKd2Q' } };
webpush.sendNotification(subscription, JSON.stringify({title: 'Test', body: 'Test push from Jamindan', icon: '/jamindan-seal.png', url: '/'})).then(() => console.log('Sent successfully!')).catch(e => console.error('Push Failed:', e));
