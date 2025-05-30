const testHelper = require("../common/routing.helper");
const config = require("../../lib/config");

describe("Multi entry api endpoint with methods", () => {
  const helper = testHelper();
  const originalGatewayConfig = config.gatewayConfig;
  helper.addPolicy("test", () => (req, res) => {
    res.json({
      result: "test",
      hostname: req.hostname,
      url: req.url,
      apiEndpoint: req.egContext.apiEndpoint,
    });
  });

  before("setup", () => {
    config.gatewayConfig = {
      http: { port: 9081 },
      apiEndpoints: {
        api: [
          {
            // Contains 2 entries with different configs
            pathRegex: "/wild-cats$",
            methods: "POST,PUT", // comma separated string syntax
          },
          {
            path: "/admin",
            methods: ["PUT"], // array syntax
          },
        ],
      },
      policies: ["test"],
      pipelines: {
        pipeline1: {
          apiEndpoints: ["api"],
          policies: { test: {} },
        },
      },
    };

    return helper.setup();
  });

  after("cleanup", () => {
    config.gatewayConfig = originalGatewayConfig;
    return helper.cleanup();
  });

  it(
    "should serve POST when pathRegex matched",
    helper.validateSuccess({
      setup: {
        url: "/wild-cats",
        postData: {},
      },
      test: {
        host: "127.0.0.1",
        url: "/wild-cats",
        result: "test",
      },
    }),
  );
  it(
    "should serve PUT when pathRegex matched",
    helper.validateSuccess({
      setup: {
        url: "/wild-cats",
        putData: {},
      },
      test: {
        host: "127.0.0.1",
        url: "/wild-cats",
        result: "test",
      },
    }),
  );

  it(
    "should not serve GET even when pathRegex matched",
    helper.validate404({
      setup: {
        url: "/wild-cats",
      },
    }),
  );
  it(
    "should 404 when regexPath not matched but method matches",
    helper.validate404({
      setup: {
        url: "/wild-cats2",
        postData: {},
      },
    }),
  );

  it(
    "should serve PUT when path matched",
    helper.validateSuccess({
      setup: {
        url: "/admin",
        putData: {},
      },
      test: {
        host: "127.0.0.1",
        url: "/admin",
        result: "test",
      },
    }),
  );
  it(
    "should not serve POST when path matched",
    helper.validate404({
      setup: {
        url: "/admin",
        postData: {},
      },
    }),
  );
  it(
    "should not serve GET when path matched",
    helper.validate404({
      setup: {
        url: "/admin",
      },
    }),
  );
  it(
    "should 404 for default host and path not matched",
    helper.validate404({
      setup: {
        url: "/admin/new",
      },
    }),
  );
});
