const request = require("supertest");
const gwHelper = require("../common/gateway.helper");
const adminHelperFactory = require("../common/admin-helper");
const { randomUUID } = require("crypto");

const username = randomUUID();
const headerName = "Authorization";

let gatewayPort, gatewayProcess, backendServer;
let keyCred;

const proxyPolicy = {
  proxy: { action: { serviceEndpoint: "backend" } },
};

describe.skip("E2E: key-auth Policy", () => {
  let adminHelper, admin;
  before("setup", async function () {
    this.timeout(10000);
    const gatewayConfig = {
      apiEndpoints: {
        authorizedEndpoint: {
          host: "*",
          paths: ["/authorizedPath"],
          scopes: ["authorizedScope"],
        },
        onlyQueryParamEndpoint: {
          host: "*",
          paths: ["/by_query"],
        },
        unauthorizedEndpoint: {
          host: "*",
          paths: ["/unauthorizedPath"],
          scopes: ["unauthorizedScope"],
        },
      },
      policies: ["key-auth", "proxy"],
      pipelines: {
        pipeline1: {
          apiEndpoints: ["authorizedEndpoint"],
          policies: [
            {
              "key-auth": {
                action: {
                  apiKeyHeader: "TEST_HEADER",
                  apiKeyHeaderScheme: "SCHEME1",
                },
              },
            },
            proxyPolicy,
          ],
        },
        pipeline2: {
          apiEndpoints: ["unauthorizedEndpoint"],
          policies: [
            {
              "key-auth": {},
            },
            proxyPolicy,
          ],
        },
        pipeline_by_query: {
          apiEndpoints: ["onlyQueryParamEndpoint"],
          policies: [
            {
              "key-auth": [
                {
                  action: {
                    apiKeyField: "customApiKeyParam",
                    disableHeaders: true,
                  },
                },
              ],
            },
            proxyPolicy,
          ],
        },
      },
    };
    const dirInfo = await gwHelper.bootstrapFolder();
    const gwInfo = await gwHelper.startGatewayInstance({
      dirInfo,
      gatewayConfig,
    });
    gatewayProcess = gwInfo.gatewayProcess;
    backendServer = gwInfo.backendServers[0];
    gatewayPort = gwInfo.gatewayPort;

    adminHelper = adminHelperFactory();
    await adminHelper.start({ config: gatewayConfig });
    admin = adminHelper.admin;

    // Create scopes
    await admin.scopes.create(["authorizedScope", "unauthorizedScope"]);
    // Create user
    const newUser = await admin.users.create({
      username,
      firstname: "Kate",
      lastname: "Smith",
    });
    // Create credential
    keyCred = await admin.credentials.create(newUser.id, "key-auth", {
      scopes: ["authorizedScope"],
    });
  });

  after((done) => {
    gatewayProcess.kill();
    backendServer.close(() => {
      if (adminHelper) adminHelper.stop();
      done();
    });
  });

  it("should not authenticate key for requests without authorization header", function () {
    return request(`http://localhost:${gatewayPort}`)
      .get("/authorizedPath")
      .expect(401);
  });

  it("should not authorise key for requests if requester doesn't have authorized scopes", function (done) {
    const apikey = "apiKey " + keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/unauthorizedPath")
      .set(headerName, apikey)
      .expect(403)
      .end(function (err) {
        done(err);
      });
  });

  it("should authenticate key with scheme in headers for requests with scopes if requester is authorized", function (done) {
    const apikey = "SCHEME1 " + keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/authorizedPath")
      .set("TEST_HEADER", apikey)
      .expect(200)
      .end(done);
  });

  it("should authenticate key with scheme ignoring case in headers for requests with scopes if requester is authorized", function (done) {
    const apikey = "scheME1 " + keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/authorizedPath")
      .set("TEST_HEADER", apikey)
      .expect(200)
      .end(done);
  });

  it("should authenticate key in query for requests with scopes if requester is authorized ", function (done) {
    const apikey = keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/authorizedPath?apiKey=" + apikey)
      .expect(200)
      .end(done);
  });

  it("should not authorize invalid key", function (done) {
    const apikey = "apiKey test:wrong";

    request(`http://localhost:${gatewayPort}`)
      .get("/authorizedPath")
      .set(headerName, apikey)
      .expect(401)
      .end(done);
  });

  it("should authenticate key in query if endpoint allows only query ", function (done) {
    const apikey = keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/by_query?customApiKeyParam=" + apikey)
      .expect(200)
      .end(done);
  });

  it("should not authenticate with header of EP allows only query", function (done) {
    const apikey = "apiKey " + keyCred.keyId + ":" + keyCred.keySecret;

    request(`http://localhost:${gatewayPort}`)
      .get("/by_query")
      .set(headerName, apikey)
      .expect(401)
      .end(function (err) {
        done(err);
      });
  });
});
