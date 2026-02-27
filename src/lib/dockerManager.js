const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const INSTANCES_DIR = path.resolve(process.cwd(), "instances");
const DOCKER_BIN = process.env.DOCKER_BIN || "docker";

function runCompose(composeArgs) {
  try {
    execSync(`${DOCKER_BIN} compose ${composeArgs}`, { stdio: "inherit" });
    return;
  } catch (error) {
    try {
      execSync(`docker-compose ${composeArgs}`, { stdio: "inherit" });
      return;
    } catch (_composeV1Error) {
      // continue with Windows fallback below
    }

    // Si Node corre en Windows, intentamos automáticamente por WSL.
    if (process.platform === "win32") {
      execSync(`wsl docker compose ${composeArgs}`, { stdio: "inherit" });
      return;
    }
    throw error;
  }
}

function ensureInstancesDir() {
  if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true });
  }
}

function buildComposeFile(instance) {
  return `services:
  mysql:
    image: mysql:8.0
    container_name: ${instance.projectName}_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${instance.mysqlRootPassword}
      MYSQL_DATABASE: ${instance.dbName}
      MYSQL_USER: ${instance.dbUser}
      MYSQL_PASSWORD: ${instance.dbPassword}
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    image: 1p-express-app:latest
    container_name: ${instance.projectName}_app
    restart: always
    ports:
      - "${instance.appPort}:3000"
    environment:
      APP_MODE: tenant
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${instance.dbUser}
      DB_PASSWORD: ${instance.dbPassword}
      DB_NAME: ${instance.dbName}
      DB_WAIT_RETRIES: 30
      DB_WAIT_DELAY_MS: 2000
    depends_on:
      - mysql

volumes:
  mysql_data:
`;
}

function writeComposeFile(instance) {
  ensureInstancesDir();
  const instanceDir = path.join(INSTANCES_DIR, instance.id);
  if (!fs.existsSync(instanceDir)) {
    fs.mkdirSync(instanceDir, { recursive: true });
  }

  const composeFilePath = path.join(instanceDir, "docker-compose.yml");
  fs.writeFileSync(composeFilePath, buildComposeFile(instance), "utf8");
  return composeFilePath;
}

function createDockerInstance(instance) {
  const composeFilePath = writeComposeFile(instance);
  runCompose(`-p ${instance.projectName} -f "${composeFilePath}" up -d`);
}

function destroyDockerInstance(instance) {
  const composeFilePath = path.join(INSTANCES_DIR, instance.id, "docker-compose.yml");
  if (!fs.existsSync(composeFilePath)) {
    return;
  }

  runCompose(`-p ${instance.projectName} -f "${composeFilePath}" down -v`);
}

module.exports = {
  createDockerInstance,
  destroyDockerInstance
};
