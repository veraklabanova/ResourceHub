# ACCEPTANCE CRITERIA & BUSINESS SCENARIOS
## Rezervace sdílených zdrojů | Verze: v1 | Tier: Lean

---

## Globální akceptační kritéria (MUST)

| ID | Kritérium | Měřitelná metrika |
|----|-----------|-------------------|
| GAC-01 | Systém musí zamezit dvojité rezervaci stejného zdroje ve stejném čase. | 0 % úspěšných kolizních rezervací (INV-01). |
| GAC-02 | Každý proces musí skončit definovaným stavem — žádná rezervace nesmí zůstat v neurčitém stavu. | 0 rezervací ve stavu "processing" déle než 30s. |
| GAC-03 | Historie evidence (konflikty, no-shows) je neměnná. | 0 smazaných záznamů v audit logu (INV-05). |
| GAC-04 | Systém musí být použitelný na mobilním zařízení. | Všechny CORE flows (UC-01 až UC-04) dokončitelné na viewportu 375px. |
| GAC-05 | Rezervace nesmí být vytvořena více než 14 dní dopředu. | 100 % odmítnutých pokusů o rezervaci > 14 dní. |

---

## Modul 1: Přehled dostupnosti (UC-01 → SCR-01)

### SC-01.1: Happy Path — Zobrazení dostupnosti
**Zdroj:** UC-01, SCR-01_Dashboard

```gherkin
Scenario: Uživatel zobrazí dostupnost zdrojů
  Given systém obsahuje 3 zdroje (Zasedačka A, Auto, Notebook)
  And Zasedačka A má rezervaci dnes 10:00–11:00 uživatelem "Jan"
  When uživatel otevře přehled dostupnosti na dnešní den
  Then systém zobrazí 3 zdroje s kalendářovým přehledem
  And slot Zasedačka A 10:00–11:00 je označen jako "obsazený" s informací "Jan"
  And ostatní sloty jsou označeny jako "volné"
```

### SC-01.2: Edge — Prázdný stav (žádné zdroje)
**Zdroj:** UC-01, SCR-01_Dashboard

```gherkin
Scenario: Systém nemá definované žádné zdroje
  Given správce nepřidal žádné zdroje
  When uživatel otevře přehled dostupnosti
  Then systém zobrazí prázdný stav s textem "Správce zatím nepřidal žádné zdroje. Kontaktujte správce."
```

---

## Modul 2: Vytvoření rezervace (UC-02 → SCR-02)

### SC-02.1: Happy Path — Úspěšná rezervace ★ (Skin in the Game)
**Zdroj:** UC-02, SCR-02_Rezervace

```gherkin
Scenario: Uživatel úspěšně vytvoří rezervaci
  Given Zasedačka A je volná zítra 14:00–15:00
  When uživatel vybere Zasedačku A na zítra 14:00–15:00 s poznámkou "Schůzka s klientem"
  And klikne Rezervovat
  Then systém vytvoří rezervaci ve stavu "vytvořena"
  And slot 14:00–15:00 je označen jako "obsazený"
  And uživatel vidí potvrzení "Rezervace vytvořena!"
```

### SC-02.2: Edge — Souběh (KCS-01, INV-01)
**Zdroj:** UC-02, SCR-02_Rezervace

```gherkin
Scenario: Dva uživatelé rezervují stejný slot současně
  Given Zasedačka A je volná zítra 14:00–15:00
  When uživatel A odešle rezervaci na 14:00–15:00
  And uživatel B odešle rezervaci na 14:00–15:00 ve stejnou chvíli
  Then systém vytvoří rezervaci pro prvního (first-come-first-served)
  And druhý dostane chybu "Slot byl právě obsazen. Zobrazuji nejbližší volný."
  And systém nabídne alternativní slot
```

### SC-02.3: Edge — Rezervace příliš daleko do budoucnosti
**Zdroj:** UC-02, SCR-02_Rezervace

```gherkin
Scenario: Uživatel se pokusí rezervovat za 20 dní
  Given je 13. dubna 2026
  When uživatel se pokusí vytvořit rezervaci na 3. května 2026
  Then systém odmítne s chybou "Nelze rezervovat více než 14 dní dopředu."
```

---

## Modul 3: Zrušení rezervace (UC-03 → SCR-02, SCR-03)

### SC-03.1: Happy Path — Uživatel ruší vlastní rezervaci
**Zdroj:** UC-03, SCR-03_MojeRezervace

```gherkin
Scenario: Uživatel zruší svou nadcházející rezervaci
  Given uživatel má rezervaci Zasedačka A zítra 14:00–15:00 ve stavu "vytvořena"
  When uživatel klikne Zrušit na této rezervaci
  And potvrdí v modálu
  Then stav rezervace se změní na "zrušena"
  And slot 14:00–15:00 se uvolní pro ostatní
```

### SC-03.2: Edge — Pokus o zrušení cizí rezervace
**Zdroj:** UC-03, SCR-03_MojeRezervace

```gherkin
Scenario: Uživatel se pokusí zrušit cizí rezervaci
  Given uživatel B má rezervaci, která patří uživateli A
  When uživatel B se pokusí zrušit tuto rezervaci
  Then systém odmítne s chybou "Nemůžeš zrušit cizí rezervaci."
```

---

## Modul 4: Evidence konfliktu (UC-04 → SCR-05)

### SC-04.1: Happy Path — Správce eviduje no-show (KCS-02)
**Zdroj:** UC-04, SCR-05_EvidenceKonfliktu

```gherkin
Scenario: Správce eviduje no-show
  Given uživatel má aktivní rezervaci Auto dnes 10:00–11:00
  And uživatel nepřišel (uplynulo 30 minut od začátku)
  When správce otevře evidenci konfliktů
  And vybere typ "no_show", přiřadí rezervaci, zapíše popis "Uživatel nepřišel, auto nebylo využito"
  And zapíše řešení "Rezervace zrušena, auto uvolněno"
  And klikne Evidovat
  Then systém vytvoří záznam konfliktu
  And stav rezervace se změní na "no_show"
  And Auto se uvolní
  And záznam je neměnný (INV-05)
```

### SC-04.2: Edge — Neoprávněné užití (KCS-03)
**Zdroj:** UC-04, SCR-05_EvidenceKonfliktu

```gherkin
Scenario: Správce eviduje neoprávněné užití
  Given uživatel A má rezervaci Zasedačky A dnes 14:00–15:00
  And uživatel B sedí v Zasedačce A bez rezervace
  When správce eviduje typ "neoprávněné_užití" s popisem "B sedí v místnosti bez rezervace, A přišel se schůzkou"
  And zapíše řešení "B uvolnil místnost, A pokračoval"
  Then systém vytvoří záznam konfliktu
  And záznam je neměnný (INV-05)
```

---

## Modul 5: Správa zdrojů (UC-05 → SCR-04)

### SC-05.1: Happy Path — Přidání nového zdroje
**Zdroj:** UC-05, SCR-04_SpravaZdroju

```gherkin
Scenario: Správce přidá nový zdroj
  Given správce je přihlášen
  When správce vyplní název "Kamera Canon", typ "zařízení"
  And klikne Přidat zdroj
  Then systém vytvoří nový zdroj ve stavu "aktivní"
  And zdroj se zobrazí v přehledu dostupnosti (SCR-01)
```

### SC-05.2: Edge — Smazání zdroje s aktivními rezervacemi
**Zdroj:** UC-05, SCR-04_SpravaZdroju

```gherkin
Scenario: Správce se pokusí smazat zdroj s rezervacemi
  Given Zasedačka A má 2 aktivní rezervace na příští týden
  When správce se pokusí smazat Zasedačku A
  Then systém odmítne s chybou "Zdroj má aktivní rezervace — nelze smazat."
```

---

## Out of Scope & GAPs

| ID | Popis | Důvod | Zdroj |
|----|-------|-------|-------|
| GAP-01 | Automatická detekce no-show (bez manuálního zásahu správce) | Out of MVP — vyžaduje IoT/check-in | PA Kap. 3 |
| GAP-02 | Push notifikace o blížící se rezervaci | Out of MVP | PA Kap. 3 |
| GAP-03 | Automatické penalizace za no-show | Explicitně out of scope | Zadání |

---

## Self-check

- [x] Každý modul odkazuje na source_use_case_id a source_ui_screen_id
- [x] GIVEN popisuje stav systému, ne UI navigaci
- [x] THEN je deterministicky ověřitelné
- [x] Lean: Happy path + max 2 edge/negative na UC
- [x] Globální AC jsou MUST-level s měřitelnou metrikou
- [x] Česká diakritika v BDD krocích
- [x] GAPs odkazují na PAB/zadání

---

## MACHINE_DATA
```json
{
  "_meta": {"project_id": "Rezervace_zdroju", "agent": "uat_bdd_generator", "version": "v1", "iteration": 1},
  "global_acceptance_criteria": [
    {"id": "GAC-01", "criterion": "Systém musí zamezit dvojité rezervaci stejného zdroje ve stejném čase.", "measurable_metric": "0 % úspěšných kolizních rezervací", "priority": "MUST"},
    {"id": "GAC-02", "criterion": "Každý proces musí skončit definovaným stavem.", "measurable_metric": "0 rezervací v neurčitém stavu déle než 30s", "priority": "MUST"},
    {"id": "GAC-03", "criterion": "Historie evidence je neměnná.", "measurable_metric": "0 smazaných záznamů v audit logu", "priority": "MUST"},
    {"id": "GAC-04", "criterion": "Systém musí být použitelný na mobilním zařízení.", "measurable_metric": "Všechny CORE flows dokončitelné na 375px", "priority": "MUST"},
    {"id": "GAC-05", "criterion": "Rezervace max 14 dní dopředu.", "measurable_metric": "100 % odmítnutých pokusů > 14 dní", "priority": "MUST"}
  ],
  "business_scenarios": [
    {"id": "SC-01.1", "name": "Zobrazení dostupnosti", "source_use_case_id": "UC-01", "source_ui_screen_id": "SCR-01_Dashboard", "type": "happy_path"},
    {"id": "SC-01.2", "name": "Prázdný stav (žádné zdroje)", "source_use_case_id": "UC-01", "source_ui_screen_id": "SCR-01_Dashboard", "type": "edge_case"},
    {"id": "SC-02.1", "name": "Úspěšná rezervace", "source_use_case_id": "UC-02", "source_ui_screen_id": "SCR-02_Rezervace", "type": "happy_path"},
    {"id": "SC-02.2", "name": "Souběh dvou rezervací", "source_use_case_id": "UC-02", "source_ui_screen_id": "SCR-02_Rezervace", "type": "negative"},
    {"id": "SC-02.3", "name": "Rezervace příliš daleko", "source_use_case_id": "UC-02", "source_ui_screen_id": "SCR-02_Rezervace", "type": "edge_case"},
    {"id": "SC-03.1", "name": "Zrušení vlastní rezervace", "source_use_case_id": "UC-03", "source_ui_screen_id": "SCR-03_MojeRezervace", "type": "happy_path"},
    {"id": "SC-03.2", "name": "Pokus o zrušení cizí rezervace", "source_use_case_id": "UC-03", "source_ui_screen_id": "SCR-03_MojeRezervace", "type": "negative"},
    {"id": "SC-04.1", "name": "Evidence no-show", "source_use_case_id": "UC-04", "source_ui_screen_id": "SCR-05_EvidenceKonfliktu", "type": "happy_path"},
    {"id": "SC-04.2", "name": "Evidence neoprávněného užití", "source_use_case_id": "UC-04", "source_ui_screen_id": "SCR-05_EvidenceKonfliktu", "type": "negative"},
    {"id": "SC-05.1", "name": "Přidání nového zdroje", "source_use_case_id": "UC-05", "source_ui_screen_id": "SCR-04_SpravaZdroju", "type": "happy_path"},
    {"id": "SC-05.2", "name": "Smazání zdroje s rezervacemi", "source_use_case_id": "UC-05", "source_ui_screen_id": "SCR-04_SpravaZdroju", "type": "negative"}
  ],
  "coverage_check": {
    "use_cases_covered": ["UC-01", "UC-02", "UC-03", "UC-04", "UC-05"],
    "use_cases_missing": [],
    "screens_covered": ["SCR-01_Dashboard", "SCR-02_Rezervace", "SCR-03_MojeRezervace", "SCR-04_SpravaZdroju", "SCR-05_EvidenceKonfliktu"],
    "screens_missing": []
  },
  "identified_gaps": [
    {"id": "GAP-01", "description": "Automatická detekce no-show", "reason": "Out of MVP"},
    {"id": "GAP-02", "description": "Push notifikace", "reason": "Out of MVP"},
    {"id": "GAP-03", "description": "Automatické penalizace za no-show", "reason": "Out of scope"}
  ]
}
```
