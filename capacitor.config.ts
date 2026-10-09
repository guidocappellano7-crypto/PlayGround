import type { CapacitorConfig } from '@capacitor/cli';

// ============================================================
// Preventivi Smart — configurazione Capacitor (wrapper Android)
// Come funziona: l'APK apre l'app dal SERVER (VPS/PC server).
// - Produzione: metti l'URL https della VPS in CAP_SERVER_URL
// - Prove in LAN: usa http://IP-PC:3002 (serve cleartext: true)
// Gemini / Android Studio: NON cambiare appId dopo la prima
// pubblicazione sul Play Store (l'update usa lo stesso appId
// + stesso keystore di firma).
// ============================================================
const config: CapacitorConfig = {
  appId: 'it.preventivismart.app',
  appName: 'Preventivi Smart',
  webDir: 'public',
  server: {
    // URL del server. Senza variabile d'ambiente -> placeholder da cambiare.
    url: process.env.CAP_SERVER_URL || 'https://TUA-VPS-O-DOMINIO.it',
    cleartext: true, // permette http:// in LAN (prove locali). In prod è https.
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
