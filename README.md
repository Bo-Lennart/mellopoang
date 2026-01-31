# Melodifestivalen Voting App

En lokal nätverksapp för att bedöma Melodifestivalen-bidrag tillsammans.

## Funktioner

- 🎯 Admin-panel för att sätta upp antal bidrag
- 📱 Mobil-vänlig gränssnitt för bedömning
- 🏆 Tre bedömningskategorier: Klädsel, Uppträdande, Låt (1-10 poäng)
- 📊 Resultatöversikt med aggregerad poängtally
- 🔗 QR-kod för enkel anslutning på lokalt nätverk
- 💾 Persistent datalagring

## Installation

```bash
# Installera alla dependencies
yarn install-all

# Eller installera manuellt
yarn install
cd server && yarn install
cd ../client && yarn install
```

## Start

```bash
# Kör både server och client
yarn dev

# Eller individuellt
yarn server   # Port 5000
yarn client   # Port 5173
```

Öppna `http://localhost:5173` i webbläsaren.

## Projektstruktur

```
.
├── server/          # Express backend
├── client/          # React frontend (Vite)
└── README.md
```

## Användning

1. **Admin-sida**: Ange antal bidrag som ska bedömas
2. **Dela länk/QR**: Andra användare ansluter via länk eller QR-kod
3. **Bedöm bidrag**: Ge poäng för varje bidrag i de tre kategorierna
4. **Resultat**: Se aggregerad statistik och varje users top 3 bidrag
