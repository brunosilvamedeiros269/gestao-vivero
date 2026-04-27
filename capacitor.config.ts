import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestaovivero.app',
  appName: 'Gestao Vivero',
  webDir: 'out',
  server: {
    url: 'https://gestao-vivero.vercel.app/',
    cleartext: true
  }
};

export default config;
