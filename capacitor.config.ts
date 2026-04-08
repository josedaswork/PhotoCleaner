import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipeclean.app',
  appName: 'SwipeClean',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#f9fafb',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f9fafb',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#10b981',
    },
  },
};

export default config;
