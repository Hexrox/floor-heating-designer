# 🏠 Floor Heating Designer

Aplikacja webowa do projektowania instalacji ogrzewania podłogowego.

## 🚀 Quick Start

### Uruchomienie lokalnie

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173/`

### Build produkcyjny

```bash
npm run build
```

Pliki produkcyjne znajdą się w folderze `dist/`

## 📋 Funkcje (Planowane MVP)

### Wersja 1.0 (Obecna - UI Mockup)
- ✅ Podstawowy interfejs użytkownika
- ✅ Panel parametrów (średnica, rozstaw, wzór)
- ✅ Sidebar z opcjami
- ✅ Responsywny layout

### Wersja 1.1 (Następne kroki)
- [ ] Import JPG z rzutem pomieszczenia
- [ ] Rysowanie konturów pomieszczeń
- [ ] Zaznaczanie stref bez grzania (meble, szafy)
- [ ] Umieszczenie rozdzielacza

### Wersja 1.2
- [ ] Generowanie pętli (spirala/meandr)
- [ ] Algorytm omijania przeszkód
- [ ] Obliczenia (długość, powierzchnia, przepływ)
- [ ] Walidacje i ostrzeżenia

### Wersja 1.3
- [ ] Strefy brzegowe przy oknach
- [ ] Automatyczny podział na wiele obwodów
- [ ] Eksport do PDF
- [ ] Zestawienie materiałów

## 🛠 Stack Technologiczny

- **Frontend:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Canvas:** Fabric.js (do zaimplementowania)
- **State:** Zustand (do zaimplementowania)
- **Geometria:** Turf.js (do zaimplementowania)
- **Eksport:** jsPDF (do zaimplementowania)

## 📁 Struktura Projektu

```
floor-heating-app/
├── src/
│   ├── components/       # Komponenty React
│   │   ├── Canvas/      # Komponenty Canvas
│   │   ├── Wizard/      # Kroki projektu
│   │   └── ui/          # Komponenty UI
│   ├── lib/
│   │   ├── algorithms/  # Algorytmy generowania pętli
│   │   └── utils/       # Funkcje pomocnicze
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Główny komponent
│   └── main.tsx         # Entry point
├── public/              # Statyczne pliki
├── docs/                # Dokumentacja
│   ├── research-notes.md    # Research techniczny
│   └── ui-mockups.md        # Mockupy interfejsu
└── VPS-DEPLOYMENT.md    # Instrukcje wdrożenia
```

## 🎨 Kolory aplikacji

- **Zasilanie (rura ciepła):** `#F44336` (czerwony)
- **Powrót (rura chłodna):** `#2196F3` (niebieski)
- **Strefa bez grzania:** `#9E9E9E` (szary)
- **Strefa brzegowa:** `#FFC107` (pomarańczowy)
- **Rozdzielacz:** `#4CAF50` (zielony)

## 📖 Dokumentacja

- [Research Notes](../research-notes.md) - Szczegółowy research techniczny
- [UI Mockups](../ui-mockups.md) - Mockupy interfejsu użytkownika
- [VPS Deployment](./VPS-DEPLOYMENT.md) - Instrukcje wdrożenia na VPS

## 🚀 Wdrożenie

### Opcja 1: Nginx (Statyczne pliki)

```bash
npm run build
# Prześlij folder dist/ na VPS
# Skonfiguruj Nginx (szczegóły w VPS-DEPLOYMENT.md)
```

### Opcja 2: GitHub Actions (Automatyczne)

Push do branch `main` automatycznie wdraża na VPS.

Szczegóły: [VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md)

## 🧪 Testy

```bash
# Uruchom testy (gdy będą dostępne)
npm run test
```

## 📦 Dependencies

### Produkcyjne
- `react` - Framework UI
- `fabric` - Canvas manipulation
- `zustand` - State management
- `@turf/turf` - Geometric calculations
- `pathfinding` - Pathfinding dla omijania przeszkód
- `jspdf` - PDF export
- `html2canvas` - Canvas to image

### Deweloperskie
- `vite` - Build tool
- `typescript` - Type safety
- `tailwindcss` - Styling
- `eslint` - Linting

## 🤝 Contributing

To jest projekt w fazie development. Sugestie i pull requesty mile widziane!

## 📄 Licencja

MIT

## 🔗 Przydatne linki

- [Norma PN-EN 1264](https://www.ogrzewnictwo.pl/) - Normy ogrzewania podłogowego
- [Fabric.js Docs](http://fabricjs.com/docs/) - Dokumentacja Fabric.js
- [Tailwind CSS](https://tailwindcss.com/) - Dokumentacja Tailwind

## ✨ Status Projektu

🚧 **W fazie development**

Aktualna wersja: **1.0** (UI Mockup)

Następny milestone: Import JPG i rysowanie konturów
