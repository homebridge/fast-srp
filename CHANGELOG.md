# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.5] - Unreleased

### Changed

- Minimum supported Node.js version is now 18, matching HAP-NodeJS 0.14 (`engines.node` was `>=10.17.0`).
- `SrpServer` derives its exponent as `H(PAD(b) | PAD(v))` in a protected `deriveExponent()` method. Messages on the wire are unchanged and clients need no update.
- Upgraded dev dependencies: TypeScript 5, ESLint 10 (flat config with `typescript-eslint` and `@stylistic`), TypeDoc 0.28, nyc 18, rimraf 6, `@types/node` 20.
- `tsconfig.json` only loads `@types/node`, so builds no longer pick up unrelated type packages.

### Added

- Tests for `SrpServer` created from a `{ username, salt, password }` identity (the form HAP-NodeJS uses), `genKey`, argument checks and the short client key warning.
- This changelog.

### Fixed

- CI workflows referenced the shared `homebridge/.github` workflows at a branch that no longer exists, so no runs started.
- Release Drafter keeps a draft GitHub release for the next version up to date from merged PRs.
- Releases now use the shared `npm-release.yml` workflow with npm trusted publishing (OIDC): GitHub releases publish `latest`, and `beta-X.Y.Z` / `alpha-X.Y.Z` branches publish prereleases.
- `repository.url` in `package.json` uses the form npm expects.
- README build badge points at the current workflow.
- Resolved `npm audit` findings in dev dependencies.

## [2.0.4] - 2021-10-07

### Changed

- Upgraded dev dependencies and regenerated docs.

## [2.0.3] - 2021-01-10

### Changed

- Use `instanceof` instead of function name checks, so the library works after minification.
- Updated linting rules; excluded the bundled `jsbn` library from test coverage.

### Fixed

- `SrpClient.checkM2()` throws if the protocol is incomplete.

## [2.0.2] - 2020-04-12

### Fixed

- Repository link in `package.json`.

## [2.0.1] - 2020-04-12

### Fixed

- `types` entry point in `package.json`.

## [2.0.0] - 2020-04-12

### Changed

- Converted to TypeScript.

### Added

- Support for saved verifiers.

[2.0.5]: https://github.com/homebridge/fast-srp/compare/v2.0.4...beta-2.0.5
[2.0.4]: https://github.com/homebridge/fast-srp/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/homebridge/fast-srp/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/homebridge/fast-srp/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/homebridge/fast-srp/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/homebridge/fast-srp/releases/tag/v2.0.0
