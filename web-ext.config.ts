import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    ...(process.env.ZEN === '1' && {
      firefox: '/Applications/Zen.app/Contents/MacOS/zen',
    }),
  },
});
