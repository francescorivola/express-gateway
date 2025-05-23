# Project Change Log

This file documents all significant changes made to this fork of Express Gateway, starting May 2025.

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

### License and Forking Notes

- This project is a fork of Express Gateway, originally licensed under Apache 2.0.
- All changes are documented here and in file headers where appropriate, as required by the license.

---

For more details on any change, see the corresponding commit or contact the maintainers of this fork.
