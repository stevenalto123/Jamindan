const fs = require("fs"); let data = fs.readFileSync("backend/routes/incidentRoutes.js", "utf8"); data = data.replace(/\\n/g, "\n"); fs.writeFileSync("backend/routes/incidentRoutes.js", data);
