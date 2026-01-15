# Project Change Log

This file documents all significant changes made to this fork of Express Gateway, starting May 2025.

## 2026-01-14

### Express v5 Support

- **Updated to Express v5:**
  - Upgraded Express.js dependency from v4 to v5.2.1.
  - Updated all code to be compatible with Express v5 breaking changes and new features.
  - Tested and validated all middleware, policies, and gateway functionality with Express v5.

## 2025-05-25

### Token-based Authentication and Management Removed

- **Removed all token-based features:**
  - Deleted AuthToken/RefreshToken logic, token service, token DAO, token admin APIs, and all related REST routes.
  - Removed all token-related tests and code references throughout the codebase.
  - Cleaned up configuration and schema files to remove accessTokens and refreshTokens sections.
  - Ensured no remaining code or config references to token/refreshToken features.

## 2025-05-23

### Major Removals and Refactoring

- **Removed OAuth2 and Generator Features:**
  - Deleted all code, configuration, and tests related to OAuth2 policies and generators.
  - Uninstalled and removed dependencies: `oauth2orize`, `passport-oauth2-client-password`, `yeoman-environment`, `yeoman-generator`, `yargs`, `yawn-yaml`, and devDependency `yeoman-test`.
  - Cleaned up credential models, config templates, and scripts to remove OAuth2 and generator references.
  - Deleted all OAuth2 and generator-related test files.
- **Removed CLI and Generator Code:**
  - Deleted CLI bootstrap and generator files from `bin/`.
  - Refactored E2E and integration tests to use only programmatic setup (admin API), removing all CLI dependencies.
- **Removed Plugin Installer:**
  - Deleted `lib/plugin-installer.js` and all related tests.
  - Removed all code and tests related to plugin installation.
- **Removed `cliExtensions` Plugin Feature:**
  - Deleted all code, type definitions, and tests related to `cliExtensions` and `registerCLIExtension`.
- **General Cleanup:**
  - Updated and cleaned up test teardown logic for reliability.
  - Ensured all remaining tests are CLI/generator-free and maintainable.

### Modernization and Dependency Cleanup

- **UUID Modernization:**
  - Replaced all usages of `uuid` and `uuid62` with the native Node.js `crypto.randomUUID` function throughout the codebase and tests.
  - Removed `uuid` and `uuid62` from dependencies and uninstalled them.
- **Test and Code Consistency:**
  - Updated all test and service files to use `crypto.randomUUID` for unique ID generation.
  - Ensured no legacy UUID libraries remain in the project.

### License and Forking Notes

- This project is a fork of Express Gateway, originally licensed under Apache 2.0.
- All changes are documented here and in file headers where appropriate, as required by the license.

---

For more details on any change, see the corresponding commit or contact the maintainers of this fork.
