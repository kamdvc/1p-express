const express = require("express");
const path = require("path");

const { getInstances, saveInstances } = require("./lib/instancesStore");
const { getNextPort } = require("./lib/portAllocator");
const { createDockerInstance, destroyDockerInstance } = require("./lib/dockerManager");

function sanitizeName(input) {
  const clean = String(input || "cliente")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "cliente";
}

function buildInstance(name, port) {
  const now = Date.now();
  const id = `${name}-${now}`;

  return {
    id,
    name,
    projectName: `tenant_${id}`.replace(/-/g, "_"),
    appPort: port,
    dbName: `db_${id}`.replace(/-/g, "_"),
    dbUser: "app_user",
    dbPassword: "app_password_123",
    mysqlRootPassword: "root_password_123",
    createdAt: new Date().toISOString()
  };
}

function startManagerApp() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.use(express.json());
  app.use(express.static(path.resolve(process.cwd(), "public")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: "manager" });
  });

  app.get("/api/instances", (_req, res) => {
    const instances = getInstances();
    res.json(instances);
  });

  app.post("/api/instances", async (req, res) => {
    try {
      const requestedName = sanitizeName(req.body?.name);
      const instances = getInstances();
      const nextPort = await getNextPort(instances);
      const instance = buildInstance(requestedName, nextPort);

      createDockerInstance(instance);

      instances.push(instance);
      saveInstances(instances);

      res.status(201).json({
        message: "Instancia creada correctamente.",
        instance
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al crear la instancia.",
        error: error.message
      });
    }
  });

  app.delete("/api/instances/:id", (req, res) => {
    try {
      const instances = getInstances();
      const instance = instances.find((item) => item.id === req.params.id);

      if (!instance) {
        return res.status(404).json({ message: "Instancia no encontrada." });
      }

      destroyDockerInstance(instance);

      const nextInstances = instances.filter((item) => item.id !== req.params.id);
      saveInstances(nextInstances);

      return res.json({ message: "Instancia eliminada correctamente." });
    } catch (error) {
      return res.status(500).json({
        message: "Error al eliminar instancia.",
        error: error.message
      });
    }
  });

  app.listen(port, () => {
    console.log(`Manager corriendo en http://localhost:${port}`);
  });
}

module.exports = {
  startManagerApp
};
