# ResourceHub — Interaktivní prototyp rezervačního systému

## O projektu
Interní nástroj pro malý hybridní tým (10–20 lidí) ke sdílení fyzických zdrojů (zasedačky, auto, zařízení). Systém nahrazuje neefektivní koordinaci přes kalendář a domluvu — zamezuje dvojitým rezervacím, eviduje no-shows a neoprávněné užití.

**Anonymizovaný název:** ResourceHub
**Tier:** Lean

## Tech-stack
- React 18+ s TypeScript
- Vite (build tool)
- Tailwind CSS (styling, mobile-first)
- Mock API (in-memory, žádný reálný backend)

## Obrazovky (z MACHINE_DATA screens[])

| Screen ID | Účel | Role |
|-----------|------|------|
| SCR-01_Dashboard | Přehled dostupnosti zdrojů (kalendářový pohled) | Uživatel, Správce |
| SCR-02_Rezervace | Formulář vytvoření/detail/zrušení rezervace | Uživatel, Správce |
| SCR-03_MojeRezervace | Seznam vlastních rezervací (aktivní/nadcházející/minulé) | Uživatel, Správce |
| SCR-04_SpravaZdroju | CRUD operace nad zdroji | Správce |
| SCR-05_EvidenceKonfliktu | Evidence a řešení konfliktů | Správce |

## Role (z navigation_by_role)

| Role | Přístupné obrazovky |
|------|-------------------|
| Uživatel (end_user) | SCR-01, SCR-02, SCR-03 |
| Správce (admin) | SCR-01, SCR-02, SCR-03, SCR-04, SCR-05 |

## Adresářová struktura

```
RezervaceZdroju/
├── CLAUDE.md
├── docs/                          # Zdrojová dokumentace (read-only)
│   ├── PAB_Rezervace_zdroju_v1_revised.md
│   ├── PRD_Rezervace_zdroju_v1_revised.md
│   ├── UAT_Rezervace_zdroju_v1_revised.md
│   ├── TRACEABILITY_Rezervace_zdroju.md
│   └── logo.svg
├── public/
│   ├── logo.svg                   # NDA modal logo
│   ├── favicon.png                # Light mode favicon
│   └── favicon-dark.png           # Dark mode favicon
├── src/
│   ├── components/                # Globální UI komponenty (Fáze B)
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   ├── TextInput.tsx
│   │   ├── SelectInput.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── DataCard.tsx
│   │   ├── ErrorToast.tsx
│   │   ├── ConfirmationModal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── StatusBadge.tsx
│   ├── screens/                   # Obrazovky (Fáze C)
│   │   ├── SCR01_Dashboard.tsx
│   │   ├── SCR02_Rezervace.tsx
│   │   ├── SCR03_MojeRezervace.tsx
│   │   ├── SCR04_SpravaZdroju.tsx
│   │   └── SCR05_EvidenceKonfliktu.tsx
│   ├── api/                       # Mock API handlery (Fáze E)
│   │   └── mockHandlers.ts
│   ├── data/                      # Seed data + typy (Fáze F)
│   │   ├── types.ts
│   │   └── seedData.ts
│   ├── context/                   # Role context (Fáze D)
│   │   └── RoleContext.tsx
│   ├── tour/                      # Demo walkthrough (Fáze G)
│   │   └── DemoWalkthrough.tsx
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Schválený implementační plán (Fáze A–H)

### Fáze A — Scaffold projektu
Vite + React + TypeScript + Tailwind. `npm create vite@latest`, konfigurace tailwind, routing (react-router-dom).

### Fáze B — Design system base
Z `global_components[]` v MACHINE_DATA: PrimaryButton, SecondaryButton, TextInput, SelectInput, DateTimePicker, DataCard, ErrorToast, ConfirmationModal, LoadingSpinner, StatusBadge. Konzistentní styling, mobile-first.

### Fáze C — Screen scaffolding
Z `screens[]` v MACHINE_DATA: 5 obrazovek. Každá s:
- State machine skeleton (default/transient/error/success/empty)
- Formulářová pole z `data_bindings[]`
- Akce z `actions[]` napojené na mock API
- Microcopy jako konstanty
- Telemetry event placeholdery (console.log)

### Fáze D — Role switcher
Z `navigation_by_role{}`: RoleContext (React Context), přepínač v pravém horním rohu, filtrování navigace.

### Fáze E — Mock API vrstva
Z `api_specification`: 8 endpointů. RBAC (403 pro neautorizovanou roli). Simulovaná latence 300ms.

Endpointy:
| Metoda | Endpoint | RBAC |
|--------|----------|------|
| GET | /api/resources/availability | Uživatel, Správce |
| POST | /api/reservations | Uživatel, Správce |
| DELETE | /api/reservations/:id | Vlastník nebo Správce |
| GET | /api/reservations/my | Uživatel (vlastní) |
| POST | /api/conflicts | Správce |
| POST | /api/resources | Správce |
| PUT | /api/resources/:id | Správce |
| PATCH | /api/resources/:id | Správce |

### Fáze F — Seed data
TS interfaces z column definitions + JSON seed data:
- 12 users (10 uživatelů + 2 správci, české fiktivní jména)
- 5 resources (2 zasedačky, 1 auto, 1 notebook, 1 kamera)
- 40 reservations (mix stavů, leden–duben 2026)
- 5 conflicts (2 no_show, 2 neoprávněné_užití, 1 dvojitá_rezervace)

Invarianty v seed datech:
- INV-01: Žádné překrývající se aktivní/vytvořené rezervace
- time_to > time_from
- time_from max 14 dní dopředu (pro "vytvořena" záznamy)
- FK konzistence (reservation.resource_id existuje, conflict.reservation_id existuje)

### Fáze G — Demo walkthrough
5 Happy Path scénářů jako guided tour:
1. SC-01.1: Zobrazení dostupnosti (SCR-01)
2. SC-02.1: Vytvoření rezervace (SCR-01 → SCR-02)
3. SC-03.1: Zrušení rezervace (SCR-03)
4. SC-04.1: Evidence no-show (SCR-05) [role: Správce]
5. SC-05.1: Přidání zdroje (SCR-04) [role: Správce]

Tlačítko "Demo průchod" v headeru spustí overlay tour.

### Fáze H — NDA modal + anonymizace + /preview
- NDA modal s logem (`public/logo.svg`) při prvním otevření
- Text: "Vítejte v interaktivním prototypu projektu ResourceHub. Z důvodu NDA jsou data anonymizována. Využijte přepínač v pravém horním rohu a vyzkoušejte si celý průchod aplikací pod různými uživatelskými rolemi. [Spustit prototyp]"
- `/preview` stránka s mobilním (375px) a tabletovým (768px) iframe náhledem
- Favicon: `public/favicon.png` (light), `public/favicon-dark.png` (dark)

## MACHINE_DATA zdroje
Všechny MACHINE_DATA JSONy jsou v `docs/`:
- `docs/PAB_Rezervace_zdroju_v1_revised.md` — 2 JSON bloky (PA + UX)
- `docs/PRD_Rezervace_zdroju_v1_revised.md` — 1 JSON blok
- `docs/UAT_Rezervace_zdroju_v1_revised.md` — 1 JSON blok

Parsuj JSON bloky uvozené `## MACHINE_DATA` na konci každého souboru.

## Build & Run
```bash
npm install
npm run dev
```
Aplikace běží na `http://localhost:5173`.

## Out of scope
- Reálný backend (pouze mock data)
- Integrace s Google Calendar
- Push notifikace
- Automatické penalizace za no-show
- Reporting a statistiky
- Finance
- Testy (UAT scénáře slouží jen pro demo walkthrough)
- Deploy (git init + Vercel = úkol uživatele)

## Pravidla buildu
- **Anonymizace:** Nikdy neuvádět skutečný název klienta. Používat "ResourceHub".
- **Česká diakritika:** Všechny texty z MACHINE_DATA (microcopy, error messages) používat přímo včetně diakritiky.
- **Žádná nová logika:** Builder konzumuje MACHINE_DATA, nevymýšlí nové obrazovky, stavy nebo pravidla.
- **Mock API:** Simulovaná latence 300ms, RBAC kontroly, deterministické odpovědi.
