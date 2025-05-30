const request = require("supertest");
const should = require("should");

const services = require("../../lib/services");
const credentialService = services.credential;
const userService = services.user;
const serverHelper = require("../common/server-helper");
const db = require("../../lib/db");

const testHelper = require("../common/routing.helper");
const config = require("../../lib/config");
const originalGatewayConfig = config.gatewayConfig;

describe("Functional Tests basic auth Policy", () => {
  const helper = testHelper();
  let user, app;

  before("setup", () => {
    config.gatewayConfig = {
      http: { port: 0 },
      serviceEndpoints: {
        backend: {
          url: "http://localhost:6067",
        },
      },
      apiEndpoints: {
        authorizedEndpoint: {
          host: "*",
          paths: ["/authorizedPath"],
          scopes: ["authorizedScope"],
        },
        unauthorizedEndpoint: {
          host: "*",
          paths: ["/unauthorizedPath"],
          scopes: ["unauthorizedScope"],
        },
      },
      policies: ["basic-auth", "proxy"],
      pipelines: {
        pipeline1: {
          apiEndpoint: "authorizedEndpoint",
          policies: [
            { "basic-auth": {} },
            {
              proxy: { action: { serviceEndpoint: "backend" } },
            },
          ],
        },
        pipeline2: {
          apiEndpoint: "unauthorizedEndpoint",
          policies: [
            { "basic-auth": {} },
            {
              proxy: { action: { serviceEndpoint: "backend" } },
            },
          ],
        },
      },
    };

    return db.flushdb().then(() => {
      const user1 = {
        username: "irfanbaqui",
        firstname: "irfan",
        lastname: "baqui",
        email: "irfan@eg.com",
      };

      return userService
        .insert(user1)
        .then((_fromDbUser1) => {
          should.exist(_fromDbUser1);
          user = _fromDbUser1;

          return credentialService.insertScopes([
            "authorizedScope",
            "unauthorizedScope",
          ]);
        })
        .then(() =>
          credentialService.insertCredential(user.id, "basic-auth", {
            password: "user-secret",
            scopes: ["authorizedScope"],
          }),
        )
        .then((userRes) => {
          should.exist(userRes);
          return serverHelper.generateBackendServer(6067);
        })
        .then(helper.setup)
        .then((apps) => {
          app = apps.app;
        });
    });
  });

  after("cleanup", () => {
    config.gatewayConfig = originalGatewayConfig;
    return helper.cleanup();
  });

  it("should not authenticate token for requests without token header", function () {
    return request(app).get("/authorizedPath").expect(401);
  });

  it("should not authenticate token for requests if requester doesn't have authorized scopes", function () {
    const credentials = Buffer.from(
      user.username.concat(":user-secret"),
    ).toString("base64");

    return request(app)
      .get("/unauthorizedPath")
      .set("Authorization", "basic " + credentials)
      .expect(401);
  });

  it("should authenticate token for requests with scopes if requester is authorized", function () {
    const credentials = Buffer.from(
      user.username.concat(":user-secret"),
    ).toString("base64");

    return request(app)
      .get("/authorizedPath")
      .set("Authorization", "basic " + credentials)
      .expect(200);
  });

  it("should not authenticate invalid token", function () {
    const credentials = Buffer.from(
      user.username.concat(":wrongPassword"),
    ).toString("base64");

    return request(app)
      .get("/authorizedPath")
      .set("Authorization", "basic " + credentials)
      .expect(401);
  });
});
