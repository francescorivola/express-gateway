const httpProxy = require("http-proxy");
const http = require("http");
const assert = require("assert");
const request = require("superagent");
const gwHelper = require("../common/gateway.helper");

["HTTP_PROXY", "http_proxy"].forEach((envVariable) => {
  describe.skip("@e2e @proxy through proxy", () => {
    const gatewayConfig = {
      apiEndpoints: {
        api: {
          path: "/test",
        },
      },
      policies: ["proxy"],
      pipelines: {
        pipeline1: {
          apiEndpoints: ["api"],
          policies: [
            {
              proxy: {
                action: { serviceEndpoint: "backend" },
              },
            },
          ],
        },
      },
    };

    const proxiedUrls = {};
    let gw, proxy, srv, bs;

    before("init", (done) => {
      gwHelper.bootstrapFolder().then((dirInfo) => {
        proxy = httpProxy.createProxyServer({ changeOrigin: true });

        srv = http.createServer(function (req, res) {
          proxiedUrls[req.url] = true;
          proxy.web(req, res, { target: req.url });
        });

        const server = srv.listen(0, (err) => {
          if (err) {
            return done(err);
          }

          process.env[envVariable] = `http://localhost:${
            server.address().port
          }`;
          gwHelper
            .startGatewayInstance({ dirInfo, gatewayConfig })
            .then(({ gatewayProcess, backendServers }) => {
              gw = gatewayProcess;
              bs = backendServers[0];
              done();
            })
            .catch(done);
        });
      });
    });

    after("cleanup", (done) => {
      delete process.env[envVariable];
      gw.kill();
      proxy.close();
      srv.close(() => bs.close(done));
    });

    it(`should respect ${envVariable} env var and send through proxy`, () => {
      return request
        .get(`http://localhost:${gatewayConfig.http.port}/test`)
        .then((res) => {
          assert.ok(res.text);
          // we need to ensure that request went through proxy, not directly
          assert.ok(
            proxiedUrls[
              `${gatewayConfig.serviceEndpoints.backend.urls[0]}/test`
            ],
            "Proxy was not called",
          );
        });
    });
  });
});
