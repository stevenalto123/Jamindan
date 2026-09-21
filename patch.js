const fs = require('fs');
let data = fs.readFileSync('frontend/src/pages/ReportIncident.jsx', 'utf8');

const target1 = "const formData = new FormData();";
const rep1 = "let isMultipart = false;\n    const formData = new FormData();";
data = data.replace(target1, rep1);

const target2 = "if (photo) formData.append('photo', photo);";
const rep2 = "if (photo) { formData.append('photo', photo); isMultipart = true; }";
data = data.replace(target2, rep2);

const target3 = "const res = await axios.post('/api/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });";
const rep3 = "let payload = formData;\n      let config = { headers: { 'Content-Type': 'multipart/form-data' } };\n      if (!isMultipart) {\n        payload = { type, description: \[Location Details: \] \\, location_lat: lat, location_lng: lng, location_address: address };\n        if (Object.keys(details).length > 0) payload.details = JSON.stringify(details);\n        config = {};\n      }\n      const res = await axios.post('/api/incidents', payload, config);";
data = data.replace(target3, rep3);

fs.writeFileSync('frontend/src/pages/ReportIncident.jsx', data);
