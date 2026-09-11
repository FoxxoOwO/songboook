# 🎸 Zpěvník (Interactive Songbook PWA & Web)

Moderní, plnohodnotná aplikace pro hudebníky, zpěváky a kapely. Funguje na počítači i na mobilních zařízeních (telefon, tablet) s plnou podporou offline režimu (PWA).

---

## ✨ Klíčové funkce

### 🎶 Texty a akordy
- **Interaktivní zobrazení akordů**: Akordy jsou přesně zarovnány nad slovy a slabikami.
- **Prstoklady akordů (Chord Diagrams)**:
  - Při najetí myší (nebo klepnutí na mobilu) se zobrazí detailní vektorový SVG diagram hmatníku.
  - Podpora pro **Kytaru** i **Ukulele**.
  - Možnost přepnutí na **levoruký hmatník** (zrcadlení strun).
  - Tlačítko pro **zvukové přehrání akordu** (přirozený akustický zvuk přes Web Audio API).
- **Transpozice v reálném čase**:
  - Okamžitý posun tóniny o +/- půltóny jedním kliknutím.
  - Možnost přepnutí mezi křížky (`#`) a béčky (`b`).
- **Podpora Kapodastru (Capo)**:
  - Výběr pražce kapodastru (1–9).
- **Plynulý Autoscroll**:
  - Automatický posun textu při hraní.
  - Rychlost je plynule nastavitelná a **automaticky se ukládá pro každou píseň zvlášť**.
  - Ovládání mezerníkem (Start/Pauza) nebo plovoucím panelem.
- **Dvou-sloupcový režim (Two-Column View)**:
  - Na tabletech a PC rozdělí píseň do 2 sloupců, aby se i delší skladba vešla na jednu obrazovku bez nutnosti posunu.
- **Tisk a export do PDF**:
  - Tlačítko pro čistý tisk bez navigačních prvků pro přípravu papírového zpěvníku.

### 🎙️ Chromatická ladička (Tuner)
- **Reálné snímání mikrofonem** přes Web Audio API (autokorelační algoritmus).
- Vizuální ručičkový ukazatel odchylky v centech (-50 až +50) se zeleným indikátorem přesného naladění.
- Předvolby:
  - Kytara Standard (EADGBE)
  - Kytara Drop D (DADGBE)
  - Ukulele Standard (GCEA)
  - Chromatický režim
- **Referenční tóny (Pitch Pipe)**: Kliknutím na strunu si přehrajete přesný tón pro ladění podle sluchu i nápovědu prvního tónu pro zpěv.

### ⏱️ Metronom s Tap Tempem
- Vizuální světelný indikátor rytmu (zvýrazněná první doba taktu).
- Zvukový klik (možnost ztlumit pro tichý pódiový režim).
- Možnost taktu: 4/4, 3/4, 2/4, 6/8.
- **Tap Tempo**: Vyťukáním rytmu na tlačítko se automaticky spočítá a nastaví BPM.

### 📋 Playlisty & Koncertní režim (Stage Mode)
- Tvorba vlastních setlistů / playlistů na vystoupení, k táboráku nebo na zkoušku.
- Řazení skladeb (nahoru/dolů).
- **Stage Mode (Pódiový režim)**:
  - Celoobrazovkový kontrastní černý režim s velkým písmem.
  - Podpora **Bluetooth pedálu (Page Turner)** a klávesových zkratek:
    - `PageDown` / `Šipka vpravo` → Další skladba
    - `PageUp` / `Šipka vlevo` → Předchozí skladba
    - `Mezerník` → Spuštění / zastavení autoscrollu
    - `Escape` → Návrat

### 📥 Import z Ultimate Guitar
- **Přímé vložení URL** z Ultimate Guitar (`https://tabs.ultimate-guitar.com/...`).
- **Vyhledávání přímo v aplikaci**: Zadejte název skladby, prohlédněte si hodnocení a počet hlasů a jedním klikem importujte.
- Automatický převod značek a formátování do čistého ChordPro.

### 🔗 Hudební odkazy
- U každé písničky přímé odkazy na **YouTube**, **Spotify** a **Deezer**.
- Možnost automatického vygenerování odkazů podle autora a názvu.
- Integrovaný mini YouTube přehrávač pro cvičení s originální nahrávkou.

### 🏷️ Vyhledávání a štítky (Tagy)
- Fulltextové vyhledávání podle názvu, autora, alba i tagů.
- Filtrování pomocí štítků (např. `#táborák`, `#akustika`, `#rock`, `#české`).
- Řazení podle názvu, interpreta nebo data přidání.

---

## 🚀 Jak aplikaci spustit

### Požadavky
- Node.js (v18+)
- npm

### 1. Instalace závislostí
V kořenové složce projektu spusťte:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Spuštění vývojového serveru
Spustí současně backend i frontend:
```bash
npm run dev
```

- **Frontend**: Otevřete v prohlížeči: [http://localhost:3000](http://localhost:3000)
- **Backend API**: Běží na [http://localhost:3001](http://localhost:3001)

---

## 📱 Použití na mobilním telefonu (PWA)
Aplikace je vytvořena jako **Progressive Web App (PWA)**:
1. Otevřete aplikaci v mobilním prohlížeči (např. Safari na iOS nebo Chrome na Androidu).
2. Zvolte v menu prohlížeče **"Přidat na plochu"** (Add to Home Screen).
3. Aplikace se nainstaluje jako plnohodnotná aplikace bez lišt prohlížeče a funguje i v offline režimu bez signálu (např. v lese u táboráku).

---

## 🐳 Spuštění v Dockeru

Aplikace je plně kontejnerizována pomocí multi-stage `Dockerfile`. Frontend i backend běží sjednoceně v jednom lehkém kontejneru na bázi Node.js Alpine.

### Rychlé spuštění přes Docker Compose

```bash
docker compose up -d
```
Aplikace bude okamžitě dostupná na [http://localhost:3000](http://localhost:3000). Databáze písní a playlistů je perzistentně uložena ve svazku `songbook_data`.

### Samostatný Docker Build & Run

```bash
# Sestavení lokálního image
docker build -t songbook .

# Spuštění s připojením lokální složky pro perzistenci dat
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name songbook songbook
```

---

## 🚀 Automatický GitHub Actions Build (CI/CD)

V repozitáři je připraven workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml), který:
1. Při každém pushnutí do větve `main` / `master` nebo vytvoření tagu (např. `v1.0.0`) automaticky sestaví multi-arch image (`linux/amd64`, `linux/arm64` např. pro Raspberry Pi).
2. Automaticky jej publikuje do **GitHub Container Registry (GHCR)**:
   ```text
   ghcr.io/foxxoowo/songbook:latest
   ```
3. Využívá vestavěný `GITHUB_TOKEN`, takže není potřeba konfigurovat žádné externí tajné klíče.

### Jak nahrát kód na svůj GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit of monochromatic songbook with docker support"
git branch -M main
git remote add origin https://github.com/FoxxoOwO/songboook.git
git push -u origin main
```
Po pushnutí na GitHub proběhne automatický build a image bude dostupný ve vašem profilu [https://github.com/FoxxoOwO](https://github.com/FoxxoOwO?tab=packages).

---

## 📱 Nativní Android Aplikace (Jetpack Compose)

V adresáři [`android/`](android/) je kompletní nativní Android aplikace vyvinutá v **Kotlinu** s **Jetpack Compose** a **Material 3**:
- **100% Offline fungování**: Obsahuje lokální databázi písní a playlistů, ukládanou do perzistentního JSON úložiště zařízení.
- **Interaktivní akordy a transpozice**: Kliknutím na akord se zobrazí vektorový diagram hmatníku (Kytara i Ukulele) a lze přehrát zvuk akordu.
- **Plynulý Autoscroll**: Nastavitelná rychlost posunu s plovoucím panelem.
- **Chromatická ladička**: Využívá mikrofon zařízení v reálném čase (autokorelační algoritmus) s centovým ukazatelem a pitch pipe pro referenční tóny.
- **Metronom**: Nastavení BPM, takty (4/4, 3/4, 2/4, 6/8), pulsující indikátory a funkce **Tap Tempo** pro vyťukání rytmu.
- **Pódiový režim (Stage Mode)**: Celoobrazovkový OLED černý režim s velkým písmem pro hraní na koncertech.
- **Monochromatický design**: Plná podpora Dark i Light mode.

### Sestavení APK balíčku:
```bash
cd android
./gradlew assembleDebug
```
Vygenerovaný balíček naleznete v:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧪 Testování
Spuštění jednotkových testů:
- **Web & Backend**: `npm run test`
- **Android**: `cd android && ./gradlew testDebugUnitTest`
