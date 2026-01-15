# Express Gateway (Community Fork)

This project is a community-maintained fork of the original [Express Gateway](https://github.com/ExpressGateway/express-gateway) project.

> **Note:** This fork is not affiliated with the original maintainers. It is based on the last public release and has been significantly refactored and simplified. See `CHANGES.md` for a summary of all major changes, removals, and modernization efforts.

## About

Express Gateway is a microservices API gateway built on top of Express.js and Express middleware. It secures your microservices and serverless functions and exposes them through APIs using Node.js, Express, and Express middleware.

**This fork now supports Express v5**, taking advantage of the latest features and improvements in the Express framework.

This fork removes unused features such as OAuth2, CLI, generators, plugin installer, and all token-based authentication and management features (including AuthToken/RefreshToken logic, token service, token admin APIs, and related tests). All configuration and management is now done via the admin API and configuration files.

## License

This project is licensed under the [Apache-2.0 License][apache-license].

See [`CHANGES.md`](./CHANGES.md) for a summary of all major changes in this fork.

[apache-license]: https://github.com/expressgateway/express-gateway/blob/master/LICENSE
