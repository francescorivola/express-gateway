const assert = require("assert");
const fs = require("fs");
const tls = require("tls");
const path = require("path");
const config = require("../lib/config");
const testHelper = require("./common/routing.helper");

const testCases = [
  {
    clientOptions: {
      testTitle:
        "should connect to a.example.com but fail to verify client chain (ca1 issuer is not known to server)",
      key: loadPEM("agent1-key"),
      cert: loadPEM("agent1-cert"), // NOTE: agent1 cert issued by ca1
      ca: [loadPEM("ca1-cert")], // this is to bypass chain validation for self signed certs
      servername: "a.example.com",
      rejectUnauthorized: false,
    },
    expected: {
      serverError: null,
      serverResult: { sni: "a.example.com", authorized: false },
      clientError: null,
      clientResult: true,
    },
  },
  {
    clientOptions: {
      testTitle:
        "should connect to a.example.com and authorize client because agent4 is issued by ca2, allowed by server",
      key: loadPEM("agent4-key"), // NOTE: issued by ca2
      cert: loadPEM("agent4-cert"),
      ca: [loadPEM("ca1-cert")],
      servername: "a.example.com",
      rejectUnauthorized: false,
    },
    expected: {
      serverError: null,
      serverResult: { sni: "a.example.com", authorized: true },
      clientError: null,
      clientResult: true,
    },
  },
  {
    clientOptions: {
      testTitle: "should connect to b.example.com",
      key: loadPEM("agent2-key"),
      cert: loadPEM("agent2-cert"), // NOTE: issued by agent2
      ca: [loadPEM("ca2-cert")],
      servername: "b.example.com",
      rejectUnauthorized: false,
    },
    expected: {
      serverError: null,
      serverResult: { sni: "b.example.com", authorized: false },
      clientError: null,
      clientResult: true,
    },
  },
  {
    clientOptions: {
      testTitle:
        "should fail to connect to c.another.com (not defined in EG config)",
      key: loadPEM("agent3-key"),
      cert: loadPEM("agent3-cert"), // NOTE: issued by ca2
      ca: [loadPEM("ca1-cert")],
      servername: "c.another.com",
      rejectUnauthorized: false,
    },
    expected: {
      serverError: "cannot start TLS SNI - no cert configured",
      serverResult: null,
      clientError: "ECONNRESET",
      clientResult: false,
    },
  },
];

let serverResult = null;
let serverError = null;

describe("sni", () => {
  let servers, helper, originalGatewayConfig;
  before("setup", () => {
    originalGatewayConfig = config.gatewayConfig;

    helper = testHelper();
    helper.addPolicy("test", () => (req, res) => {
      res.json({
        result: "test",
        hostname: req.hostname,
        url: req.url,
        apiEndpoint: req.egContext.apiEndpoint,
      });
    });

    config.gatewayConfig = {
      https: {
        port: 10441,
        options: {
          requestCert: true,
          rejectUnauthorized: false,
        },
        tls: {
          "a.example.com": {
            key: "./test/fixtures/agent1-key.pem",
            cert: "./test/fixtures/agent1-cert.pem",
            ca: ["./test/fixtures/ca2-cert.pem"],
          },
          "b.example.com": {
            key: "./test/fixtures/agent3-key.pem",
            cert: "./test/fixtures/agent3-cert.pem",
          },
        },
      },
      apiEndpoints: { test: {} },
      policies: ["test"],
      pipelines: {
        pipeline1: {
          apiEndpoint: "test",
          policies: { test: {} },
        },
      },
    };

    return helper.setup().then((_servers) => {
      servers = _servers;
    });
  });

  testCases.forEach((tc) => {
    const options = tc.clientOptions;
    tc.actual = {};
    it("sni " + options.testTitle, () => {
      beforeEach(() => {
        serverError = null;
        serverResult = null;
      });

      options.port = servers.httpsApp.address().port;

      return new Promise((resolve) => {
        const clientErrorPromise = new Promise((resolve) => {
          servers.httpsApp.once("tlsClientError", function (err) {
            serverResult = null;
            serverError = err.message;
            resolve();
          });
        });

        const secureConnectionPromise = new Promise((resolve) => {
          servers.httpsApp.once("secureConnection", (tlsSocket) => {
            serverResult = {
              sni: tlsSocket.servername,
              authorized: tlsSocket.authorized,
            };
            resolve();
          });
        });

        const client = tls.connect(options, function () {
          Promise.race([clientErrorPromise, secureConnectionPromise]).then(
            () => {
              tc.actual.clientResult =
                /Hostname\/IP doesn't/.test(client.authorizationError) ||
                client.authorizationError === "ERR_TLS_CERT_ALTNAME_INVALID";
              tc.actual.serverResult = serverResult;
              tc.actual.clientError = null;
              tc.actual.serverError = serverError;
              client.end();
              resolve();
            },
          );
        });

        client.on("error", function (err) {
          Promise.race([clientErrorPromise, secureConnectionPromise]).then(
            () => {
              tc.actual.clientResult = false;
              tc.actual.clientError = err.code;
              tc.actual.serverError = serverError;
              tc.actual.serverResult = serverResult;
              client.destroy(err);
              resolve();
            },
          );
        });
      }).then(() => {
        assert.deepStrictEqual(
          tc.actual.serverResult,
          tc.expected.serverResult,
        );
        assert.strictEqual(tc.actual.clientResult, tc.expected.clientResult);
        assert.strictEqual(tc.actual.clientError, tc.expected.clientError);
        assert.strictEqual(tc.actual.serverError, tc.expected.serverError);
      });
    });
  });

  after("check", () => {
    config.gatewayConfig = originalGatewayConfig;
    return helper.cleanup();
  });
});

function loadPEM(n) {
  return fs.readFileSync(path.join(__dirname, "./fixtures", `${n}.pem`));
}
