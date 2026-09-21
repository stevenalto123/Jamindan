const fs = require("fs"); let data = fs.readFileSync("frontend/src/pages/ReportIncident.jsx", "utf8"); 
data = data.replace(/const formData = new FormData\(\);\r?\n\s*let address = locationText;/g, 
  "let payload;\\n      let isMultipart = false;\\n      const formData = new FormData();\\n      let address = locationText;"
);
data = data.replace(/if \(photo\) formData\.append\('photo', photo\);/g, 
  "if (photo) { formData.append('photo', photo); isMultipart = true; }"
);
data = data.replace(/const res = await axios\.post\('/api/incidents', formData, \{ headers: \{ 'Content-Type': 'multipart/form-data' \} \}\);/g, 
  "\\n        if (!isMultipart) {\\n          payload = { type, description: `[Location Details: ${locationText.trim()}] ${description.trim()}`, location_lat: lat, location_lng: lng, location_address: address };\\n          if (Object.keys(details).length > 0) payload.details = JSON.stringify(details);\\n        }\\n        const res = await axios.post('/api/incidents', isMultipart ? formData : payload, isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});"
);
fs.writeFileSync("frontend/src/pages/ReportIncident.jsx", data);
