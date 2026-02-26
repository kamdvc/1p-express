require("dotenv").config();

const appMode = process.env.APP_MODE || "manager";

if (appMode === "tenant") {
  const { startTenantApp } = require("./tenantApp");
  startTenantApp();
} else {
  const { startManagerApp } = require("./managerApp");
  startManagerApp();
}
