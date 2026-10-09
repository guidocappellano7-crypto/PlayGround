# Da questo progetto ad APK/AAB con Android Studio (+ Gemini) — guida passo passo

Questa cartella `android/` è il progetto nativo **già creato da me con Capacitor**:
l'app Android apre il tuo server (VPS o PC in LAN). Tu + Gemini dovete solo
configurare l'URL, compilare e firmare. Niente codice da riscrivere.

> Regole d'oro: **non cambiare mai l'appId** (`it.preventivismart.app`) dopo la
> prima pubblicazione, conserva il **keystore** di firma per sempre e a ogni
> aggiornamento aumenta `versionCode` di 1.

## 0. Cosa ti serve

- Android Studio (versione recente, con SDK Android 34+ e JDK incluso).
- Il server acceso e raggiungibile:
  - **Prove locali**: PC server in esecuzione (`npm run dev -p 3002`) e telefono/emulatore
    sulla **stessa Wi-Fi**. URL tipo `http://192.168.1.20:3002` (IP del tuo PC).
  - **Produzione/Play Store**: URL **https** della VPS, es. `https://app.tua-azienda.it`.

## 1. Punta l'app al tuo server (2 minuti)

1. Apri `capacitor.config.ts` (nella root del progetto).
2. Imposta l'URL del server in uno di questi due modi:
   - modifica la riga `url: ...` con il tuo indirizzo, oppure
   - lancia la sincronizzazione con variabile d'ambiente:
     - LAN: `CAP_SERVER_URL=http://192.168.1.20:3002 npm run cap:sync`
     - Prod: `CAP_SERVER_URL=https://app.tua-azienda.it npm run cap:sync`
3. Verifica che `android/app/src/main/assets/capacitor.config.json` contenga il tuo URL.

> Per l'emulatore Android, `http://10.0.2.2:3002` punta al `localhost` del tuo PC.

## 2. Apri in Android Studio e compila

1. Android Studio → **Open** → seleziona la cartella `android/` di questo progetto.
2. Attendi **Gradle Sync** (prima volta: scarica dipendenze, serve internet).
3. Collega telefono (debug USB) o avvia un emulatore, poi **Run ▶** (`app`).
4. L'app si apre sul tuo server. Se vedi schermata bianca vai alla sezione problemi.

## 3. APK di prova (da installare e far provare)

1. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
2. Trovi il file in `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Passalo sul telefono e installalo (consenti "origini sconosciute").
4. Questo APK è **debug**: va bene per le prove, NON per il Play Store.

## 4. Release firmata: AAB per il Play Store (e APK firmato)

Il Play Store accetta solo **AAB** firmati. La firma richiede un keystore:

1. **Crea il keystore** (una sola volta, conservalo + password in cassaforte):
   `Build → Generate Signed Bundle / APK → Android App Bundle → Create new…`
2. Compila la release: stesso wizard → otterrai
   `android/app/build/outputs/bundle/release/app-release.aab`.
3. Se vuoi anche un APK firmato da distribuire fuori Play Store: ripeti il wizard
   scegliendo **APK** invece di Bundle.
4. Carica l'AAB su **Play Console** (account sviluppatore 25$): crea app →
   Produzione/Test → carica AAB → compila scheda store, questionario contenuti,
   modulo **sicurezza dei dati** (dichiara: login email/password, dati clienti e
   preventivi sul tuo server, link con token) e **privacy policy** (obbligatoria).
5. Ad ogni aggiornamento: in `android/app/build.gradle` aumenta `versionCode`
   (1 → 2 → 3…) ed eventualmente `versionName` ("1.0" → "1.1"), poi ricompila.

## 5. Prompt pronti da dare a Gemini in Android Studio

Copia-incolla questi a Gemini quando serve:

- Compilazione: *«Ho aperto la cartella android di un progetto Capacitor in
  Android Studio. Fai Gradle Sync, spiegami eventuali errori e falli risolvere.»*
- Firma: *«Guidami a creare il keystore e configurare signingConfigs release in
  android/app/build.gradle, poi genera App Bundle firmato.»*
- Problema schermo bianco: *«L'app Capacitor mostra schermata bianca. Verifica
  che capacitor.config.json abbia il server.url giusto, che il telefono
  raggiunga quell'URL e che usesCleartextTraffic sia true per http in LAN.»*
- Aggiornamento: *«Aumenta versionCode e versionName per un nuovo upload sul
  Play Store e ricompila l'AAB.»*

## 6. Problemi comuni (soluzioni in 1 riga)

| Sintomo | Causa e fix |
|---|---|
| Schermata bianca all'avvio | Server spento o URL errato: apri l'URL nel browser del telefono e correggi `CAP_SERVER_URL` + `npm run cap:sync` |
| `ERR_CLEARTEXT_NOT_PERMITTED` | Stai usando `http`: `usesCleartextTraffic="true"` è già impostato in `AndroidManifest.xml`; se manca, rimettilo |
| `net::ERR_CONNECTION_REFUSED` in LAN | PC e telefono su Wi-Fi diverse, o firewall del PC: apri la porta 3002 |
| Gradle Sync fallito | Niente internet al primo sync, oppure JDK/SDK da aggiornare in Android Studio |
| Play rifiuta l'upload | Stai caricando un APK: ricompila come **AAB**; controlla `versionCode` maggiore del precedente |
| Icona/nome sbagliati | Icone già sostituite in `res/mipmap-*`, nome in `res/values/strings.xml` (`app_name`) |

## 7. File importanti (non cancellare)

- `capacitor.config.ts` — URL server, appId, nome app.
- `android/app/build.gradle` — `applicationId`, `versionCode`, `versionName`.
- `android/app/src/main/AndroidManifest.xml` — permessi (INTERNET) e cleartext LAN.
- `android/app/src/main/res/mipmap-*/` — icone generate dal logo del progetto.
- `android/app/src/main/assets/capacitor.config.json` — ricreato a ogni `cap sync`.
