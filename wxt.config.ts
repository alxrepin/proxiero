import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      'proxy',
      'storage',
      'webRequest',
      // Ответ на запрос авторизации прокси: в Firefox нужен blocking-режим,
      // в Chrome MV3 — отдельное разрешение webRequestAuthProvider.
      ...(browser === 'firefox' ? ['webRequestBlocking'] : ['webRequestAuthProvider']),
    ],
    host_permissions: ['<all_urls>'],
    browser_specific_settings:
      browser === 'firefox'
        ? {
            gecko: {
              id: 'proxiero@repin.dev',
              strict_min_version: '109.0',
              data_collection_permissions: { required: ['none'] },
            },
          }
        : undefined,
  }),
});
