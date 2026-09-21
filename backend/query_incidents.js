const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'jamindan_emergency'
  });

  const [rows] = await connection.execute('SELECT id, type, location_address, status FROM incidents WHERE status = "Pending"');
  console.log('Pending Incidents:');
  console.table(rows);

  await connection.end();
}
main();
