# 🎵 Mellopoäng - Melodifestivalen Voting App

En snyggt designad nätverksapp för att bedöma Melodifestivalen-bidrag tillsammans med vänner. Admin sätter upp sessionen på datorn, andra ansluter via QR-kod på sina telefoner och röstar på bidragen i tre kategorier. Se resultat i realtid!

## ✨ Funktioner

- 🎯 **Admin-panel** - Sätt upp sessioner, namnge bidrag, hantera röstare
- 📱 **Mobil-optimerad** - Perfekt gränssnitt för telefonen
- 🏆 **Tre bedömningskategorier** - Klädsel, Uppträdande, Låt (1-10 poäng)
- 📊 **Live-resultat** - Se aggregerad poängtally och varje persons topplista
- 🔗 **QR-kodöverbryggning** - Enkelt för andra att ansluta på lokala nätverket
- 💾 **Persistent lagring** - Sessionsdata sparas mellan omstarter
- 🔄 **Sessionskontroll** - Starta om med rensbara röster eller börja helt nytt
- 🎭 **Flexibelt** - Redigera bidragnamn när som helst under sessionen

## 🚀 Installation & Start

### Förutsättningar

- Node.js och npm/yarn installerat
- Samma WiFi-nätverk för alla enheter (admin + mobiler)

### Installation

```bash
# Klona eller ladda ned projektet
cd mellopoang

# Installera alla dependencies
yarn install-all
# eller manuellt:
yarn install && cd server && yarn install && cd ../client && yarn install
```

### Starta appen

```bash
# Från projektroten - startar både server och client
yarn dev
```

Servern startar på: `http://localhost:8001`  
Klientens webgränssnitt: `http://localhost:3002` (eller nästa tillgänglig port)

**Lokalt nätverk:** `http://192.168.50.43:3002` (IP varierar beroende på nätverk)

## 📖 Hur appen fungerar

### Admin-flöde

1. Öppna admin-panelen på datorn
2. Ange **antal bidrag** som ska bedömas
3. Klicka **"Starta Session"** för att generera en sessionskod och QR-kod
4. **Namnge bidragen** manuellt om önskvärt
5. **Dela QR-koden** eller länken med andra deltagare
6. **Se sessionsöversikten** uppdateras i realtid när röstare ansluter
7. Klicka **"Se Resultat"** när alla är klara med sin röstning för att visa resultaten

### Användar-flöde (Röstare)

1. **Scanna QR-koden** med telefonen eller besök länken direkt
2. **Ange ditt namn**
3. **Rösta på varje bidrag** - tre kategorier, poäng från 1-10
4. **Navigera** mellan bidrag med nästa/tillbaka-knapparna
5. **Slutför** när du röstat på alla bidrag
6. **Se dina favoriter** samt gruppens favoriter (när admin revelar resultaten)

## 🏗️ Arkitektur & Logik

### Backend (Express.js + Node.js)

- **Server:** `/server/server.js` - Hanterar alla API-calls
- **Port:** 8001
- **Datalagring:** `session_data.json` - Persistent lagring mellan omstarter

#### API Endpoints

- `POST /api/admin/init` - Starta ny session med X bidrag
- `POST /api/admin/qrcode` - Generera QR-kod för session
- `POST /api/admin/reset-session` - Rensa röster men behåll bidrag
- `POST /api/admin/start-new-session` - Helt nystart
- `POST /api/user/join` - Användare ansluter
- `POST /api/user/vote` - Spara röst
- `GET /api/results` - Hämta aggregerade resultat

### Frontend (React + Vite)

- **Client:** `/client/src` - React-appen
- **Port:** 3002 (eller nästa tillgänglig)
- **Komponenter:**
  - `AdminPanel.jsx` - Admin-gränssnitt
  - `JoinPanel.jsx` - Anslutningsformulär
  - `VotingPanel.jsx` - Röstningsgränssnitt
  - `ResultsPanel.jsx` - Resultatvisning

### Datamodell

```javascript
sessionData = {
  sessionId: "ABC123XYZ",
  contestants: [{ id: 1, name: "Bidrag 1" }, ...],
  votes: {
    "userId": {
      "contestantId": { "categoryId": score }
    }
  },
  users: { "userId": { name: "Anna" } },
  resultsRevealed: false
}
```

## 💡 Tips & Tricks för användare

### För Admin

- **Redigera bidrag** - Klicka på "Redigera" för att ändra namn längre fram
- **Lägg till bidrag** - Kan lägga till fler bidrag under sessionens gång
- **Starta om med nya röster** - "🔄 Starta om session" rensar röster men behåller bidragen (perfekt mellan omgångar)
- **Helt nystart** - "➕ Starta ny session" börjar helt om för nästa kväll
- **Se resultat direkt** - Klicka "Se Resultat" för att visa dem för alla

### För Röstare

- **Mobil-vänlig** - Optimerad för både porträtt och landskapsläge
- **Spara progress** - Din röstning sparas lokalt - kan uppdatera sidan utan att förlora svar
- **Återanslutning** - Om du tappat anslutningen kan du klicka "Återanslut" för att fortsätta
- **Topplista** - Du ser dina egna favoriter och gruppens topplista när resultaten visas
- **1-10 poäng** - Du kan välja mellan två rader med 1-5 och 6-10 poäng per kategori

## 🔧 Teknik

**Backend:**

- Express.js - Web-server
- UUID - Unika användar-ID:n
- QRCode - QR-kod generering
- CORS - Cross-origin resource sharing

**Frontend:**

- React 18 - UI-ramverk
- Vite - Byggverktyg (snabb dev-server)
- Axios - HTTP-klient
- CSS3 - Modern styling med gradienter och animationer

## 📝 Lokala filer

- `package.json` - Root workspace-konfiguration
- `/server/` - Backend Express-server
- `/client/` - React frontend
- `/session_data.json` - Sparad sessiondata (genereras automatiskt)

## 🎮 Exempel-workflow

```
1. Admin startar appen och öppnar admin-panelen
2. Admin anger "5" bidrag och klickar "Starta Session"
3. Admin får sessionskod (t.ex. "A1B2C3D4") och QR-kod
4. Admin delar QR-koden eller säger koden högt
5. 4 vänner scannar QR eller besöker länken
6. Varje röstare ansluter, anger sitt namn
7. Varje röstare röstar på alla 5 bidrag (3 kategorier vardera)
8. Admin ser i realtid hur många som är klara
9. Admin klickar "Se Resultat" för att visa topplistan
10. Resultaten visas med blur tills admin klickar "Se Resultat"
```

## 🆘 Felsökning

**"Kan inte nå sidan från mobilen"**

- Kontrollera att du är på samma WiFi-nätverk
- Kontrollera IP-adressen i admin-panelen
- Prova att besöka `http://[IP]:3002` direkt

**"QR-kod leder till fel port"**

- Appen använder `window.location.port` dynamiskt - QR-koden har alltid rätt port

**"Sessionen försvinner när jag startar om"**

- Data sparas i `session_data.json` - den bör behållas mellan omstarter
- Använd "🔄 Starta om session" för att rensa röster utan att förlora bidrag

## 📄 Licens

MIT - Använd fritt!

---

**Gjord med ❤️ för Melodifestivalen-kvällar** 🎤🎵
