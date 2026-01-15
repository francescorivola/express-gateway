const transformObject = require("../request-transformer/transform-object");

module.exports = {
  schema: {
    ...require("../request-transformer/schema"),
    $id: "http://express-gateway.io/schemas/policies/response-transformer.json",
  },
  policy: (params) => {
    return (req, res, next) => {
      if (params.body) {
        const _write = res.write;
        res.write = (data) => {
          try {
            const body = transformObject(
              params.body,
              req.egContext,
              JSON.parse(data)
            );
            const bodyData = JSON.stringify(body);

            res.setHeader("Content-Length", Buffer.byteLength(bodyData));
            _write.call(res, bodyData);
          } catch {
            _write.call(res, data);
          }
        };
      }

      if (params.headers) {
        const _writeHead = res.writeHead;

        res.writeHead = (statusCode, statusMessage, headers) => {
          const transformedHeaders = transformObject(
            params.headers,
            req.egContext,
            res.getHeaders()
          );

          // Apply transformed headers back to response
          Object.keys(res.getHeaders()).forEach((key) => {
            res.removeHeader(key);
          });
          Object.keys(transformedHeaders).forEach((key) => {
            res.setHeader(key, transformedHeaders[key]);
          });

          return _writeHead.call(res, statusCode, statusMessage, headers);
        };
      }
      next();
    };
  },
};
