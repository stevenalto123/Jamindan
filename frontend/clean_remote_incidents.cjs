const axios = require('axios');

async function main() {
  try {
    const loginRes = await axios.post('https://jamindan.onrender.com/api/auth/login', {
      username: 'admin',
      password: 'AdminPass123!'
    });
    const token = loginRes.data.token;
    console.log('Login successful');

    const incidentsRes = await axios.get('https://jamindan.onrender.com/api/incidents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check the structure of incidentsRes.data
    const incidents = Array.isArray(incidentsRes.data) ? incidentsRes.data : (incidentsRes.data.incidents || []);
    
    const toDelete = incidents.filter(i => 
      i.status === 'Pending' && 
      (!i.location_address || !i.location_address.toLowerCase().includes('quios'))
    );

    console.log(`Found ${toDelete.length} incidents to delete out of ${incidents.length} total.`);
    
    for (const incident of toDelete) {
      console.log(`Deleting incident: ${incident.code} - ${incident.location_address}`);
      await axios.delete(`https://jamindan.onrender.com/api/incidents/${incident.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Deleted ${incident.code}`);
    }

    console.log('Done cleaning up incidents.');
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

main();
