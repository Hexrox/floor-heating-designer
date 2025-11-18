# Floor Plan Editor - Pełna Specyfikacja i Plan Implementacji

**Data utworzenia:** 2025-10-09
**Wersja:** 2.0 → 3.0 (Floor Plan Editor)
**Priorytet:** WYSOKI - Kluczowa zmiana architektury

---

## 🔍 ANALIZA OBECNEGO STANU (v2.0)

### ✅ CO DZIAŁA:
1. **Autentykacja** - Login/Register/ForgotPassword (nowoczesny UI)
2. **Rozdzielacz (Manifold)** - Umieszczanie na canvas, marker "M"
3. **Rysowanie wielokątów** - Klikanie punktów, zamykanie
4. **Generowanie pętli:**
   - Reverse Return Spiral
   - Meander
   - Supply (RED) + Return (BLUE) + Loop (ORANGE)
5. **Obliczenia:**
   - Routing distance (do/z manifoldu)
   - Długość pętli
   - Powierzchnia (przybliżona)
6. **PDF Export** - Z rozdzielaczem, legendą, pomieszczeniami
7. **Parametry:**
   - Średnica rury (14/16/20mm)
   - Rozstaw (15/20/25cm)
   - Strefa brzegowa (10/12/15cm)
   - Wzór (spirala/meandr)

### ❌ CO NIE DZIAŁA / PROBLEMY:

1. **Wczytywanie obrazu JPG nie działa**
   - `fabric.Image.fromURL()` nie ładuje obrazu
   - Canvas pozostaje pusty
   - Problem z asynchronicznym ładowaniem

2. **Skalowanie niepoprawne**
   - Nie wiadomo jaka jest skala (1px = ? cm)
   - Powierzchnia m² jest zgadywana (rough estimate)
   - Wymiary nieprecyzyjne

3. **Ręczne rysowanie wielokątów jest trudne**
   - Użytkownik musi dokładnie klikać
   - Brak snap to grid
   - Trudno narysować proste kąty (90°)
   - Brak możliwości poprawy

4. **Brak wymiarów**
   - Nie wiadomo ile ma pokój (np. 4m × 5m)
   - Wszystko przybliżone

5. **Nieprofesjonalne**
   - Profesjonalne narzędzia (RoomSketcher, Floorplanner, LoopCAD) mają wbudowany edytor
   - Nasza aplikacja wymaga external JPG

---

## 💡 NOWE ROZWIĄZANIE: FLOOR PLAN EDITOR

### Inspiracja - Profesjonalne narzędzia:
- **RoomSketcher** - "Draw walls. Windows and doors snap onto walls"
- **Floorplanner** - "Draw rooms, move walls, add doors and windows with ease"
- **Lucidcart** - "Objects automatically snap to grid"
- **Floor Plan Creator** - "Automatic calculation of room, walls and level area"

### Kluczowe cechy:
✅ **Grid System** - Siatka 50cm × 50cm, snap to grid
✅ **Wall Drawing** - Klik-klik rysowanie ścian
✅ **Auto Room Detection** - Automatyczne wykrywanie zamkniętych obszarów
✅ **Automatic Dimensions** - Wymiary na żywo
✅ **Doors & Windows** - Snap do ścian
✅ **Precise Measurements** - Dokładne m², cm
✅ **Professional Look** - Jak prawdziwe CAD

---

## 🎨 SZCZEGÓŁOWA SPECYFIKACJA UI

### 1. TOOLBAR (Górny pasek narzędzi)

```
┌──────────────────────────────────────────────────────┐
│ [☰ Widok] [📏 Ściana] [🚪 Drzwi] [🪟 Okno]         │
│ [🏠 Pokój] [🔴 Manifold] [📐 Wymiar] [🗑️ Usuń]    │
└──────────────────────────────────────────────────────┘

Aktywne narzędzie = podświetlone na niebiesko
```

**Narzędzia:**

1. **☰ Widok**
   - Pan (przesuwanie)
   - Zoom (+/-)
   - Fit to screen

2. **📏 Ściana** (GŁÓWNE)
   - Klik punkt A
   - Klik punkt B
   - Tworzy ścianę 20cm grubości
   - Snap to grid (co 50cm)
   - Wyświetla wymiar (np. "4.5m")
   - Możliwość edycji długości w input

3. **🚪 Drzwi**
   - Wybierz ścianę
   - Kliknij gdzie umieścić
   - Snap to wall
   - Szerokość: 80cm/90cm/100cm

4. **🪟 Okno**
   - Wybierz ścianę
   - Kliknij gdzie umieścić
   - Snap to wall
   - Szerokość: 100cm/120cm/150cm

5. **🏠 Pokój**
   - Kliknij wewnątrz zamkniętego obszaru
   - Auto-detekcja granic (ściany tworzą polygon)
   - Nadaj nazwę (np. "Salon")
   - Automatycznie oblicza m²
   - Wyświetla wymiary (długość × szerokość)

6. **🔴 Manifold**
   - Kliknij gdzie umieścić rozdzielacz
   - Snap to grid
   - Czerwony kwadrat "M"

7. **📐 Wymiar**
   - Dodaj dodatkowy wymiar
   - Klik punkt A → punkt B
   - Pokazuje odległość

8. **🗑️ Usuń**
   - Kliknij obiekt do usunięcia
   - Potwierdź

### 2. CANVAS (Główna powierzchnia rysowania)

```
┌─────────────────────────────────────────────────────┐
│  0    0.5   1.0   1.5   2.0   2.5   3.0   3.5   4.0 │ ← Oś X (metry)
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐  │
│ │     │     │     │     │     │     │     │     │  │
│0├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤  │
│ │     │     │     │     │     │     │     │     │  │
│.├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤  │
│5│     │     │█████████████     │     │     │     │  │
│ ├─────┼─────┼█████████████─────┼─────┼─────┼─────┤  │
│1│     │     │█ Salon    █     │     │     │     │  │ ← Oś Y
│.├─────┼─────┼█ 4.5 × 3m █─────┼─────┼─────┼─────┤  │
│0│     │     │█ 13.5 m²  █     │     │     │     │  │
│ ├─────┼─────┼█████████████─────┼─────┼─────┼─────┤  │
│1│     │     │█████████████     │     │     │     │  │
│.├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤  │
│5│     │     │     │  M  │     │     │     │     │  │ ← Manifold
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │
└─────────────────────────────────────────────────────┘

█ = Ściana (czarna, grubość 20cm)
Grid = Co 50cm (light gray)
M = Manifold (czerwony kwadrat)
```

**Właściwości Canvas:**
- **Grid:** 50cm × 50cm
- **Snap:** Automatyczny snap do gridu
- **Zoom:** Scroll wheel (100% → 200% → 50%)
- **Pan:** Middle mouse button / Space + drag
- **Dimensions:** Dynamiczne, zawsze widoczne
- **Tooltips:** Hover pokazuje informacje

### 3. SIDEBAR (Panel boczny - jak teraz)

**Pozostaje bez zmian:**
- Projekt (Export PDF)
- Rozdzielacz (Status)
- Pomieszczenia (Lista)
- Edycja pomieszczenia (Nazwa, temp)
- Konfiguracja (Parametry)
- Podsumowanie (Statystyki)

---

## 🏗️ ARCHITEKTURA TECHNICZNA

### Stack (bez zmian):
- React 18 + TypeScript
- Fabric.js 6.7 (canvas)
- Tailwind CSS 4
- jsPDF (export)

### Nowe komponenty:

```typescript
/src/components/
  FloorPlanEditor.tsx         // ← NOWY: Główny edytor
  /floorplan/
    Toolbar.tsx               // ← NOWY: Pasek narzędzi
    GridCanvas.tsx            // ← NOWY: Canvas z gridem
    WallTool.tsx              // ← NOWY: Narzędzie ścian
    DoorTool.tsx              // ← NOWY: Narzędzie drzwi
    WindowTool.tsx            // ← NOWY: Narzędzie okien
    RoomDetector.tsx          // ← NOWY: Auto-detekcja pomieszczeń
    DimensionDisplay.tsx      // ← NOWY: Wyświetlanie wymiarów

/src/utils/
  geometry.ts                 // ← NOWY: Algorytmy geometryczne
  roomDetection.ts            // ← NOWY: Wykrywanie zamkniętych obszarów
  gridSnap.ts                 // ← NOWY: Snap to grid logic
```

### Struktura danych:

```typescript
interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // 20cm = 0.2m
  fabricLine: fabric.Line;
}

interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1 (pozycja na ścianie)
  width: number; // 0.8 / 0.9 / 1.0 m
  fabricGroup: fabric.Group;
}

interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number; // 1.0 / 1.2 / 1.5 m
  fabricGroup: fabric.Group;
}

interface Room {
  id: string;
  name: string;
  walls: string[]; // Wall IDs
  polygon: Point[]; // Auto-detected boundary
  area: number; // Dokładne m²
  dimensions: { width: number; length: number }; // m
  temperature: number;
  // ... reszta jak teraz
}

interface Point {
  x: number; // w metrach (nie pikselach!)
  y: number;
}

interface FloorPlan {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  manifold: Point | null;
  scale: number; // pixels per meter (np. 50px = 1m)
}
```

---

## 🔧 ALGORYTMY DO IMPLEMENTACJI

### 1. Grid Rendering
```typescript
function renderGrid(canvas: fabric.Canvas, gridSize: number) {
  // gridSize = 0.5m (50cm)
  // Rysuj linie co gridSize
  // Numery na osiach
  // Light gray (#e5e7eb)
}
```

### 2. Snap to Grid
```typescript
function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}
```

### 3. Wall Drawing
```typescript
function drawWall(start: Point, end: Point): Wall {
  // Snap both points to grid
  // Create fabric.Line with thickness
  // Calculate length: distance(start, end)
  // Add dimension label
  // Return Wall object
}
```

### 4. Room Detection (WAŻNE!)
```typescript
function detectRooms(walls: Wall[]): Polygon[] {
  // 1. Stwórz graf z ścian
  // 2. Znajdź wszystkie zamknięte cykle (cycles)
  // 3. Dla każdego cyklu:
  //    - Sprawdź czy jest minimalny (nie zawiera mniejszych)
  //    - Oblicz polygon z punktów
  //    - Oblicz area
  // 4. Return list of room polygons

  // Algorytm: Cycle detection in planar graph
  // Lib: graphlib (opcjonalnie) lub własna implementacja
}
```

### 5. Point in Polygon (dla pętli)
```typescript
// Już mamy - bez zmian
function isPointInPolygon(point: Point, polygon: Point[]): boolean
```

### 6. Dimension Display
```typescript
function addDimension(start: Point, end: Point): fabric.Group {
  // Linia z strzałkami
  // Tekst na środku
  // Formatowanie: "4.5m" / "450cm"
}
```

---

## 📐 METRYKA I SKALOWANIE

### Założenia:
- **1 metr = 100 pikseli** (bazowa skala)
- **Grid = 50 pikseli = 0.5m = 50cm**
- **Wall thickness = 20cm = 20 pikseli**

### Konwersje:
```typescript
const PIXELS_PER_METER = 100;

function metersToPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}

function pixelsToMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

// Wszystkie współrzędne w state przechowujemy w METRACH
// Tylko na Fabric.js canvas konwertujemy do pikseli
```

### Dokładność:
- Wymiary wyświetlane z dokładnością do 1cm
- Obliczenia m² z dokładnością do 0.01m²

---

## 🎯 PLAN IMPLEMENTACJI (KROK PO KROKU)

### FAZA 1: PODSTAWY (2-3h)
1. ✅ Stwórz `FloorPlanEditor.tsx`
2. ✅ Grid rendering (50cm × 50cm)
3. ✅ Numery na osiach (0, 0.5m, 1m, 2m...)
4. ✅ Snap to grid funkcja
5. ✅ Toolbar component z przyciskami
6. ✅ State management (walls, rooms, manifold)

### FAZA 2: RYSOWANIE ŚCIAN (1-2h)
7. ✅ Wall tool - klik start/end
8. ✅ Podgląd ściany podczas rysowania (ghost line)
9. ✅ Snap obu punktów do gridu
10. ✅ Wyświetlanie długości ściany
11. ✅ Możliwość usunięcia ściany
12. ✅ Edycja długości (input field)

### FAZA 3: DRZWI I OKNA (1h)
13. ✅ Door tool - wybór ściany, klik pozycji
14. ✅ Window tool - j.w.
15. ✅ Snap do ściany
16. ✅ Wizualizacja drzwi (arc) i okna (rectangle)

### FAZA 4: POMIESZCZENIA (2-3h) **NAJTRUDNIEJSZE**
17. ✅ Algorytm wykrywania zamkniętych obszarów
18. ✅ Klik wewnątrz → auto-detect boundary
19. ✅ Obliczanie dokładnej powierzchni m²
20. ✅ Obliczanie wymiarów (width × length)
21. ✅ Label z nazwą + m²
22. ✅ Lista pomieszczeń w sidebar

### FAZA 5: MANIFOLD I PĘTLE (1h)
23. ✅ Umieszczanie manifoldu (snap to grid)
24. ✅ Generowanie pętli (bez zmian - używamy room.polygon)
25. ✅ Supply/Return routing (bez zmian)

### FAZA 6: EXPORT I POLISH (1h)
26. ✅ PDF export z dokładnymi wymiarami
27. ✅ Tooltips
28. ✅ Keyboard shortcuts (ESC = cancel, Delete = usuń)
29. ✅ Undo/Redo (opcjonalnie)
30. ✅ Save/Load projektu do JSON

---

## 📝 UWAGI I DECYZJE

### Co USUWAMY:
❌ Wczytywanie JPG (cały moduł)
❌ Drag & drop plików
❌ Ręczne rysowanie wielokątów (klikanie punktów)
❌ `floorPlanImage` state
❌ `uploadFloorPlan` funkcja

### Co ZOSTAJE:
✅ Manifold placement
✅ Loop generation (spiral/meander)
✅ Supply/Return routing
✅ PDF export
✅ Wszystkie parametry (średnica, rozstaw, strefa brzegowa)
✅ Room management (lista, edycja)

### Co DODAJEMY:
➕ Grid canvas
➕ Wall drawing
➕ Room auto-detection
➕ Doors & Windows
➕ Precise measurements
➕ Professional CAD-like interface

---

## 🚀 EFEKT KOŃCOWY

### Użytkownik otwiera aplikację:

1. **Widzi pusty canvas z gridem** (50cm × 50cm)
2. **Klik "Ściana"** → klik start (np. 0, 0) → klik end (np. 4m, 0)
   - Pojawia się ściana z wymiarem "4.0m"
3. **Rysuje 4 ściany** → tworzy prostokąt 4m × 5m
4. **Klik "Pokój"** → klik wewnątrz
   - Auto-detekcja: "To jest pokój 4.0m × 5.0m = 20.0 m²"
   - Nadaj nazwę: "Salon"
5. **Klik "Manifold"** → klik gdzie umieścić (np. korytarz)
6. **Klik "Generuj pętle"**
   - Supply RED z manifoldu do Salonu
   - Loop ORANGE w Salonie (reverse return spiral)
   - Return BLUE z Salonu do manifoldu
7. **Klik "Export PDF"**
   - Dokładny rzut z wymiarami
   - "Salon: 4.0m × 5.0m = 20.0 m²"
   - "Długość rur: 85m (73m pętla + 12m routing)"

### To jest **PROFESJONALNE** 🎉

---

## 📚 BIBLIOTEKI I RESOURCES

### Potrzebne (już mamy):
- ✅ Fabric.js 6.7 - canvas rendering
- ✅ jsPDF - PDF export
- ✅ React 18 - UI
- ✅ Tailwind - styling

### Opcjonalnie:
- `graphlib` - dla room detection (cycle finding)
- `poly-decomp` - dla złożonych polygonów

### Resources do przeczytania:
1. **Cycle detection in planar graphs**
   - https://en.wikipedia.org/wiki/Cycle_(graph_theory)
2. **Snap to grid algorithms**
   - Round to nearest multiple
3. **Room detection from walls**
   - Convert walls to graph
   - Find minimal cycles
   - Filter out outer boundary

---

## 🎨 MOCKUP UI (ASCII)

```
╔════════════════════════════════════════════════════════════════╗
║ Floor Heating Designer v3.0 - Professional Edition            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  [Widok] [Ściana] [Drzwi] [Okno] [Pokój] [M] [Wymiar] [X]   ║
║                                                                ║
╠═══════╦════════════════════════════════════════════════════════╣
║       ║  0    1m   2m   3m   4m   5m   6m   7m   8m          ║
║       ║  ┌────┬────┬────┬────┬────┬────┬────┬────┐           ║
║ 🏠    ║  │    │    │    │    │    │    │    │    │  0        ║
║ Salon ║  ├────┼────┼────┼────┼────┼────┼────┼────┤           ║
║ 20m²  ║  │    │    │████│███████│█│    │    │    │  1m       ║
║       ║  ├────┼────┼████│███████│█├────┼────┼────┤           ║
║ 🏠    ║  │    │    │█Kuchnia █│█│    │    │    │  2m       ║
║ Kuchnia║ ├────┼────┼████│███████│█├────┼────┼────┤           ║
║ 12m²  ║  │    │    │████│███████│█│    │    │    │  3m       ║
║       ║  ├────┼────┼████│███████│█├────┼────┼────┤           ║
║ 🔴    ║  │    │    │    │🚪     │█│    │    │    │  4m       ║
║ M     ║  ├────┼────┼────┼────┬──┴─┼────┼────┼────┤           ║
║       ║  │    │    │    │  M │    │    │    │    │  5m       ║
║ ⚙️    ║  └────┴────┴────┴────┴────┴────┴────┴────┘           ║
║ Config║                                                        ║
║       ║  █ = Ściana (20cm)                                   ║
║ 📊    ║  🚪 = Drzwi                                          ║
║ Stats ║  M = Manifold                                         ║
║       ║                                                        ║
╚═══════╩════════════════════════════════════════════════════════╝
```

---

## ⚠️ POTENCJALNE PROBLEMY I ROZWIĄZANIA

### Problem 1: Room detection zbyt skomplikowany
**Rozwiązanie:**
Zacznij od prostej wersji - użytkownik **ręcznie** klika "To jest pokój" wewnątrz. Możemy dodać auto-detection później.

### Problem 2: Fabric.js performance z dużą ilością obiektów
**Rozwiązanie:**
- Używaj `objectCaching: true`
- Group walls razem gdy nie edytujemy
- Lazy rendering dla niewidocznych części

### Problem 3: Snap to grid irytujący
**Rozwiązanie:**
- Opcja Toggle snap (Shift = bez snap)
- Snap tylko w trybie Wall tool

### Problem 4: Trudność z krzywymi ścianami
**Rozwiązanie:**
- Pierwsza wersja = tylko straight walls
- Curves można dodać później

---

## 📋 CHECKLIST PRZED ROZPOCZĘCIEM

- [ ] Przeczytaj całą specyfikację
- [ ] Zrozum algorytm room detection
- [ ] Przygotuj mockup UI
- [ ] Zaplanuj state management
- [ ] Zdefiniuj wszystkie TypeScript interfaces
- [ ] Przygotuj test data (przykładowy floor plan)

---

## 🎯 SUKCES = GDY:

✅ Użytkownik może narysować rzut piętra w < 2 minuty
✅ Wymiary są dokładne (do 1cm)
✅ Pomieszczenia auto-detect działa
✅ Manifold + pętle generują się poprawnie
✅ PDF pokazuje profesjonalny rzut z wymiarami
✅ Wygląda jak **prawdziwe CAD**

---

## 📞 KONTAKT / PYTANIA

Jeśli coś niejasne w następnej sesji:
1. Przeczytaj ten dokument od początku
2. Sprawdź sekcję "Plan Implementacji"
3. Zacznij od Fazy 1 (podstawy)
4. Nie implementuj wszystkiego naraz - po kolei!

---

**KONIEC SPECYFIKACJI**
**Powodzenia w następnej sesji! 🚀**

---

## 📎 APPENDIX: Przykładowy kod snippets

### Grid rendering:
```typescript
function renderGrid(canvas: fabric.Canvas, gridSize: number, scale: number) {
  const width = canvas.width!;
  const height = canvas.height!;
  const pixelGridSize = gridSize * scale; // 0.5m * 100px/m = 50px

  // Vertical lines
  for (let x = 0; x <= width; x += pixelGridSize) {
    const line = new fabric.Line([x, 0, x, height], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });
    canvas.add(line);
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += pixelGridSize) {
    const line = new fabric.Line([0, y, width, y], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });
    canvas.add(line);
  }

  // Axis labels
  for (let x = 0; x <= width; x += pixelGridSize) {
    const meters = x / scale;
    const text = new fabric.Text(`${meters}m`, {
      left: x,
      top: -20,
      fontSize: 10,
      fill: '#666',
      selectable: false
    });
    canvas.add(text);
  }
}
```

### Snap to grid:
```typescript
function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}
```

### Room detection (pseudo):
```typescript
function detectRooms(walls: Wall[]): Room[] {
  // 1. Build graph
  const graph = buildGraphFromWalls(walls);

  // 2. Find cycles
  const cycles = findMinimalCycles(graph);

  // 3. Convert to rooms
  return cycles.map(cycle => ({
    id: generateId(),
    name: 'Nowy pokój',
    polygon: cycleToPolygon(cycle),
    area: calculatePolygonArea(polygon),
    dimensions: calculateDimensions(polygon)
  }));
}
```
