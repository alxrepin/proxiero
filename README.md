<div align="center">

<img src="public/icon/128.png" width="72" alt="Proxiero logo" />

# Proxiero

**One-click proxy switching for Chrome and Firefox**

Keep a list of proxy servers, check their latency, toggle the active one with a single click —
and have it survive browser restarts.

[![CI](https://github.com/alxrepin/proxiero/actions/workflows/ci.yml/badge.svg)](https://github.com/alxrepin/proxiero/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Firefox MV2](https://img.shields.io/badge/Firefox-MV2-FF7139?logo=firefoxbrowser&logoColor=white)

[Русская версия](README.ru.md)

<img src="docs/popup-light.png" width="330" alt="Popup, light theme" />
<img src="docs/popup-dark.png" width="330" alt="Popup, dark theme" />

</div>

## Features

- **Server list** — HTTP, HTTPS, SOCKS4, SOCKS5, with optional username/password auth.
- **Split tunneling** — route only chosen domains through the proxy (whitelist), or everything except them (blacklist). A domain matches all its subdomains.
- **Latency check** — every server is pinged when the popup opens; status and ms shown inline.
- **Survives restarts** — state is stored locally and re-applied on browser startup.
- **Smart paste** — drop `socks5://user:pass@1.2.3.4:1080` into the address field and it splits itself into fields.
- **Draft autosave** — the add/edit form keeps your input even if the popup loses focus.
- **Localized** — English and Russian, switchable in the UI, defaults to your browser language.
- **Light & dark themes** — follows the system automatically.
- **Tiny** — one codebase (WXT + Svelte 5), ~90 KB unpacked, zero runtime dependencies.

## Installation

Not yet published to the stores — build from source:

```bash
git clone https://github.com/alxrepin/proxiero.git
cd proxiero
npm install
npm run build            # Chrome  → .output/chrome-mv3/
npm run build:firefox    # Firefox → .output/firefox-mv2/
```

| Browser | How to load |
|---|---|
| **Chrome** | `chrome://extensions` → enable *Developer mode* → *Load unpacked* → `.output/chrome-mv3` |
| **Firefox** | `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → any file in `.output/firefox-mv2` |
| **Zen Browser** | Same build as Firefox. For a permanent install: `npm run zip:firefox`, set `xpinstall.signatures.required = false` in `about:config`, then install the zip via `about:addons` |

## Development

```bash
npm run dev            # Chrome with HMR
npm run dev:firefox    # Firefox
npm run dev:zen        # Zen Browser (binary path lives in web-ext.config.ts)
npm run lint           # Biome: lint + format + import sorting
npm run lint:fix       # same, with autofix
npm run check          # svelte-check (types)
npm run icons          # regenerate toolbar icons (zero-dependency PNG generator)
```

## How it works

The popup never touches proxy APIs. It writes state to `storage.local`; the background
script listens for `storage.onChanged` and applies it:

| | Chrome | Firefox / Zen |
|---|---|---|
| Routing | `chrome.proxy.settings` (`fixed_servers`) | `proxy.onRequest` — per-request decision, no private-window permission needed |
| Auth | `webRequest.onAuthRequired` (`asyncBlocking`) | same, `blocking`; SOCKS5 credentials go directly into `proxyInfo` |
| Local traffic | `bypassList` | hostname check in the handler |
| Split tunneling | generated `pac_script` when a domain list is set | per-host check in `proxy.onRequest` |
| Restart | `runtime.onStartup` re-applies the saved state | same |

### Project structure

```
entrypoints/
  background/            # split by responsibility
    index.ts             #   orchestration: browser events → applyAll()
    context.ts           #   state from storage + change subscription
    routing.ts           #   Firefox onRequest / Chrome settings
    auth.ts              #   proxy authorization (onAuthRequired)
    icon.ts              #   dynamic toolbar icon (green/gray)
  popup/
    App.svelte           # thin root: view switching + form draft autosave
components/              # UI components (no <style> — styles in assets/styles)
stores/                  # reactive state built on Svelte 5 runes
  app.svelte.ts          #   proxies / active / enabled + actions
  form.svelte.ts         #   form fields, draft, edit mode
  pings.svelte.ts        #   ping statuses
utils/                   # pure modules: types, storage IO, ping, parsing, i18n, split-tunneling
assets/styles/           # tokens (themes), base, per-component styles, fonts
locales/                 # UI dictionaries (en, ru)
scripts/gen-icons.mjs    # dependency-free PNG icon generator
```

## Limitations

- While a proxy is active, pings to the other servers go through it.
- In Chrome, another extension with higher priority (e.g. a VPN) can take over proxy control.
- Passwords are stored in `storage.local` unencrypted — same as most extensions of this kind.

## Font

The UI is designed for **TT Interphases Pro** (commercial, by TypeType) with a system-font
fallback. Font files are not included: either install the font system-wide, or drop
`TTInterphasesPro-{Regular,Medium,DemiBold,Bold}.woff2` into `public/fonts/`
(see `assets/styles/font.css`).

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Alexander Repin
