# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-06

### Added

- One-click proxy toggle with a large power button and dynamic toolbar icon (green = on, gray = off).
- Proxy server list: HTTP, HTTPS, SOCKS4, SOCKS5 with optional username/password authentication.
- Latency check for every server when the popup opens.
- Full-screen add/edit form with draft autosave (input survives popup close) and smart paste
  of `scheme://user:pass@host:port` strings.
- State persistence: the enabled proxy is re-applied after browser restart.
- Automatic light/dark theme following the system setting.
- English and Russian localization with an in-UI language switcher; extension name and
  description localized via `_locales`.
- About screen with description, author/GitHub links and a small FAQ.
- Cross-browser builds from one codebase (WXT + Svelte 5): Chrome MV3, Firefox MV2, Zen Browser.
- Dev tooling: Biome (lint + format), svelte-check, dependency-free icon generator.
