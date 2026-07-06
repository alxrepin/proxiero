# Contributing to Proxiero

Thanks for considering a contribution!

## Getting started

```bash
git clone https://github.com/alxrepin/proxiero.git
cd proxiero
npm install
npm run dev            # Chrome with HMR
npm run dev:firefox    # Firefox
```

## Before you open a PR

Make sure all three pass locally:

```bash
npm run lint     # Biome — lint, formatting, import order
npm run check    # svelte-check — types
npm run build && npm run build:firefox
```

## Guidelines

- **Architecture**: the popup changes state only through `stores/`; stores write to
  `storage.local`; the background script applies changes via `storage.onChanged`.
  Don't call proxy APIs from UI code.
- **Styles** live in `assets/styles/` (no `<style>` blocks in components). Use the
  design tokens from `tokens.css` — no hardcoded colors. Test both light and dark themes.
- **Strings**: no hardcoded UI text — add keys to both `locales/en.json` and
  `locales/ru.json` and use `t('key')`.
- **Icons**: add SVG paths to the registry in `components/Icon.svelte` (Lucide style,
  2px stroke) — no emoji, no separate image assets.
- Keep it lightweight: no new runtime dependencies without a very good reason.

## Reporting bugs

Open an issue with the browser name/version, extension version, steps to reproduce,
and what you expected vs. what happened.
