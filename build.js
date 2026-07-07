const fs = require("fs");
const path = require("path");

const config = `const CONFIG = {
  WEATHER_API_KEY: "${process.env.WEATHER_API_KEY || ""}",
  OMDB_API_KEY: "${process.env.OMDB_API_KEY || ""}"
};
`;

fs.writeFileSync(path.join(__dirname, "js", "config.js"), config);
console.log("✓ config.js olusturuldu");
