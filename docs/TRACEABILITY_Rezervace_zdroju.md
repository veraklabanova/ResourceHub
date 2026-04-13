# Traceability Matrix — Rezervace sdílených zdrojů
## Generováno programaticky z MACHINE_DATA JSON

| UC | SCR | FR | AC (Scénáře) | API Endpoint | DB Tables | Status |
|----|-----|-----|-------------|-------------|-----------|--------|
| UC-01 | SCR-01_Dashboard | FR-01 | SC-01.1, SC-01.2 | GET /api/resources/availability | resources, reservations | OK |
| UC-01 | SCR-03_MojeRezervace | FR-07 | SC-01.1 | GET /api/reservations/my | reservations | OK |
| UC-02 | SCR-02_Rezervace | FR-02 | SC-02.1, SC-02.2, SC-02.3 | POST /api/reservations | reservations | OK |
| UC-02 | SCR-02_Rezervace | FR-06 | SC-02.3 | POST /api/reservations | — | OK |
| UC-03 | SCR-02_Rezervace, SCR-03 | FR-03 | SC-03.1, SC-03.2 | DELETE /api/reservations/:id | reservations | OK |
| UC-04 | SCR-05_EvidenceKonfliktu | FR-04 | SC-04.1, SC-04.2 | POST /api/conflicts | conflicts, reservations | OK |
| UC-05 | SCR-04_SpravaZdroju | FR-05 | SC-05.1, SC-05.2 | POST/PUT/PATCH /api/resources | resources | OK |

**GAPs:** Žádné. Všechny řetězce UC → SCR → FR → AC → API → DB jsou kompletní.
