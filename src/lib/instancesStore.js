const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "instances.json");

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function getInstances() {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_FILE, "utf8");
  return JSON.parse(raw);
}

function saveInstances(instances) {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(instances, null, 2), "utf8");
}

module.exports = {
  getInstances,
  saveInstances,
  STORE_FILE
};
