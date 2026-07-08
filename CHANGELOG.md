# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Split tunneling** — a settings screen (gear icon in the header) with an on/off switch (off by
  default), a whitelist/blacklist mode toggle, and a dynamic list of domain inputs. Whitelist routes
  only the listed domains through the proxy; blacklist proxies everything except them. A domain also
  matches its subdomains. Toggling the feature off keeps the mode and domain list intact. Applied via
  a generated PAC script on Chrome and a per-host check on Firefox.

### Changed

- Header actions are grouped more tightly and now include a settings (gear) button.

## [0.1.0] — 2026-07-06

### Added

- Public release
