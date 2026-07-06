import { defineWebExtConfig } from 'wxt';

// Машинно-специфичные настройки запуска браузера в dev-режиме.
// ZEN=1 подменяет бинарник Firefox на Zen (см. скрипт dev:zen).
export default defineWebExtConfig({
  binaries: {
    ...(process.env.ZEN === '1' && {
      firefox: '/Applications/Zen.app/Contents/MacOS/zen',
    }),
  },
});
