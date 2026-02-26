const net = require("net");

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

async function getNextPort(instances, startPort = 4100, maxPort = 5000) {
  const usedPorts = new Set(instances.map((instance) => Number(instance.appPort)));

  for (let port = startPort; port <= maxPort; port += 1) {
    if (usedPorts.has(port)) {
      continue;
    }

    const available = await checkPortAvailable(port);
    if (available) {
      return port;
    }
  }

  throw new Error("No hay puertos disponibles para una nueva instancia.");
}

module.exports = {
  getNextPort
};
