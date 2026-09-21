const fs = require("fs");
let data = fs.readFileSync("frontend/src/pages/ReportIncident.jsx", "utf8");
data = data.replace(/payload = \{ type, description: \[Location Details: \] \\, location_lat: lat, location_lng: lng, location_address: address \};/, "payload = { type, description: `[Location Details: ${locationText.trim()}] ${description.trim()}`, location_lat: lat, location_lng: lng, location_address: address };");
fs.writeFileSync("frontend/src/pages/ReportIncident.jsx", data);
