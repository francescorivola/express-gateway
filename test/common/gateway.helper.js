const yaml = require("js-yaml");
const fs = require("fs");
const { fork } = require("child_process");
const path = require("path");
const request = require("superagent");
const util = require("util");
const _cpr = util.promisify(require("cpr"));
const {
  generateBackendServer,
  findOpenPortNumbers,
} = require("../common/server-helper");
let gatewayPort = null;
let adminPort = null;
let backendPorts = null;

// Set gateway.config or system.config yml files
module.exports.setYmlConfig = function ({ ymlConfigPath, newConfig }) {
  fs.writeFileSync(ymlConfigPath, yaml.dump(newConfig));
};

// Get config by path (gateway.config.yml or system.config.yml)
module.exports.getYmlConfig = function () {
  const content = fs.readFileSync();
  return yaml.load(content);
};

module.exports.startGatewayInstance = function ({
  dirInfo,
  gatewayConfig,
  backendServers = 1,
}) {
  return findOpenPortNumbers(2 + backendServers)
    .then((ports) => {
      gatewayPort = ports.shift();
      adminPort = ports.shift();
      backendPorts = ports;

      gatewayConfig.http = { port: gatewayPort };
      gatewayConfig.admin = { port: adminPort };
      gatewayConfig.serviceEndpoints = gatewayConfig.serviceEndpoints || {};
      gatewayConfig.serviceEndpoints.backend = {
        urls: backendPorts.map(
          (backendPort) => `http://localhost:${backendPort}`,
        ),
      };

      return this.setYmlConfig({
        ymlConfigPath: dirInfo.gatewayConfigPath,
        newConfig: gatewayConfig,
      });
    })
    .then(() =>
      _cpr(
        path.join(__dirname, "../../lib/config/models"),
        path.join(dirInfo.configDirectoryPath, "models"),
        { overwrite: true },
      ),
    )
    .then(() =>
      Promise.all(
        backendPorts.map((backendPort) => generateBackendServer(backendPort)),
      ),
    )
    .then((backendServers) => {
      return new Promise((resolve, reject) => {
        const childEnv = Object.assign({}, process.env);
        childEnv.EG_CONFIG_DIR = dirInfo.configDirectoryPath;
        // Tests, by default have config watch disabled.
        // Need to remove this paramter in the child process.
        delete childEnv.EG_DISABLE_CONFIG_WATCH;

        const modulePath = path.join(__dirname, "..", "..", "lib", "index.js");
        const gatewayProcess = fork(modulePath, [], {
          cwd: dirInfo.basePath,
          env: childEnv,
          stdio: "pipe",
        });

        gatewayProcess.on("error", reject);

        gatewayProcess.stdout.once("data", () => {
          request
            .get(`http://localhost:${gatewayPort}/not-found`)
            .ok(() => true)
            .end((err) => {
              if (err) {
                gatewayProcess.kill();
                reject(err);
              }
              resolve({
                gatewayProcess,
                gatewayPort,
                adminPort,
                backendPorts,
                dirInfo,
                backendServers: backendServers.map((bs) => bs.app),
              });
            });
        });
      });
    });
};
