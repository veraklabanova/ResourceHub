import type { User, Resource, Reservation, Conflict } from './types'

export const users: User[] = [
  { id: 'u1', jméno: 'Jan Novák', email: 'jan.novak@resourcehub.cz', role: 'end_user' },
  { id: 'u2', jméno: 'Petra Svobodová', email: 'petra.svobodova@resourcehub.cz', role: 'end_user' },
  { id: 'u3', jméno: 'Martin Dvořák', email: 'martin.dvorak@resourcehub.cz', role: 'end_user' },
  { id: 'u4', jméno: 'Eva Černá', email: 'eva.cerna@resourcehub.cz', role: 'end_user' },
  { id: 'u5', jméno: 'Tomáš Procházka', email: 'tomas.prochazka@resourcehub.cz', role: 'end_user' },
  { id: 'u6', jméno: 'Lucie Veselá', email: 'lucie.vesela@resourcehub.cz', role: 'end_user' },
  { id: 'u7', jméno: 'Jakub Kučera', email: 'jakub.kucera@resourcehub.cz', role: 'end_user' },
  { id: 'u8', jméno: 'Anna Pokorná', email: 'anna.pokorna@resourcehub.cz', role: 'end_user' },
  { id: 'u9', jméno: 'David Marek', email: 'david.marek@resourcehub.cz', role: 'end_user' },
  { id: 'u10', jméno: 'Kateřina Horáková', email: 'katerina.horakova@resourcehub.cz', role: 'end_user' },
  { id: 'u11', jméno: 'Filip Němec', email: 'filip.nemec@resourcehub.cz', role: 'admin' },
  { id: 'u12', jméno: 'Markéta Benešová', email: 'marketa.benesova@resourcehub.cz', role: 'admin' },
]

export const resources: Resource[] = [
  { id: 'r1', název: 'Zasedačka A (2. patro)', typ: 'zasedačka', popis: 'Kapacita 8 osob, projektor, whiteboard', aktivní: true },
  { id: 'r2', název: 'Zasedačka B (3. patro)', typ: 'zasedačka', popis: 'Kapacita 4 osoby, TV, videokonference', aktivní: true },
  { id: 'r3', název: 'Služební vůz Škoda Octavia', typ: 'auto', popis: 'SPZ 1A2 3456, parkování P1', aktivní: true },
  { id: 'r4', název: 'Notebook Dell Latitude', typ: 'zařízení', popis: 'i7, 16 GB RAM, náhradní notebook', aktivní: true },
  { id: 'r5', název: 'Kamera Sony A7III', typ: 'zařízení', popis: 'Včetně objektivu 24-70mm a stativu', aktivní: true },
]

export const reservations: Reservation[] = [
  // Leden 2026 — dokončené
  { id: 'res1', zdroj_id: 'r1', uživatel_id: 'u1', od: '2026-01-05T09:00', do: '2026-01-05T11:00', stav: 'dokončena', poznámka: 'Týmový standup' },
  { id: 'res2', zdroj_id: 'r2', uživatel_id: 'u2', od: '2026-01-06T14:00', do: '2026-01-06T15:30', stav: 'dokončena', poznámka: 'Pohovor kandidát' },
  { id: 'res3', zdroj_id: 'r3', uživatel_id: 'u3', od: '2026-01-07T08:00', do: '2026-01-07T16:00', stav: 'dokončena', poznámka: 'Cesta k zákazníkovi Brno' },
  { id: 'res4', zdroj_id: 'r4', uživatel_id: 'u4', od: '2026-01-08T09:00', do: '2026-01-08T17:00', stav: 'dokončena', poznámka: 'Školení nového SW' },
  { id: 'res5', zdroj_id: 'r5', uživatel_id: 'u5', od: '2026-01-09T10:00', do: '2026-01-09T14:00', stav: 'dokončena', poznámka: 'Fotodokumentace kanceláří' },
  { id: 'res6', zdroj_id: 'r1', uživatel_id: 'u6', od: '2026-01-12T13:00', do: '2026-01-12T15:00', stav: 'dokončena', poznámka: 'Retrospektiva sprintu' },
  { id: 'res7', zdroj_id: 'r2', uživatel_id: 'u7', od: '2026-01-13T09:00', do: '2026-01-13T10:00', stav: 'dokončena', poznámka: '1-on-1 s manažerem' },
  { id: 'res8', zdroj_id: 'r3', uživatel_id: 'u8', od: '2026-01-14T07:00', do: '2026-01-14T15:00', stav: 'zrušena', poznámka: 'Cesta odložena' },

  // Únor 2026 — dokončené + zrušené
  { id: 'res9', zdroj_id: 'r1', uživatel_id: 'u9', od: '2026-02-02T10:00', do: '2026-02-02T12:00', stav: 'dokončena', poznámka: 'Workshop design thinking' },
  { id: 'res10', zdroj_id: 'r4', uživatel_id: 'u10', od: '2026-02-03T09:00', do: '2026-02-03T17:00', stav: 'dokončena', poznámka: 'Testování na jiném OS' },
  { id: 'res11', zdroj_id: 'r5', uživatel_id: 'u1', od: '2026-02-04T08:00', do: '2026-02-04T12:00', stav: 'dokončena', poznámka: 'Video pro marketing' },
  { id: 'res12', zdroj_id: 'r2', uživatel_id: 'u2', od: '2026-02-05T15:00', do: '2026-02-05T16:30', stav: 'zrušena', poznámka: 'Schůzka přesunuta online' },
  { id: 'res13', zdroj_id: 'r1', uživatel_id: 'u3', od: '2026-02-09T09:00', do: '2026-02-09T11:00', stav: 'dokončena', poznámka: 'Sprint planning' },
  { id: 'res14', zdroj_id: 'r3', uživatel_id: 'u4', od: '2026-02-10T06:00', do: '2026-02-10T18:00', stav: 'dokončena', poznámka: 'Služební cesta Ostrava' },
  { id: 'res15', zdroj_id: 'r5', uživatel_id: 'u5', od: '2026-02-11T13:00', do: '2026-02-11T16:00', stav: 'dokončena', poznámka: 'Focení produktů' },
  { id: 'res16', zdroj_id: 'r4', uživatel_id: 'u6', od: '2026-02-12T09:00', do: '2026-02-12T17:00', stav: 'dokončena', poznámka: 'Prezentace u klienta' },

  // Březen 2026 — dokončené
  { id: 'res17', zdroj_id: 'r1', uživatel_id: 'u7', od: '2026-03-02T09:00', do: '2026-03-02T11:00', stav: 'dokončena', poznámka: 'Kvartální review' },
  { id: 'res18', zdroj_id: 'r2', uživatel_id: 'u8', od: '2026-03-03T14:00', do: '2026-03-03T15:00', stav: 'dokončena', poznámka: 'Call s partnerem' },
  { id: 'res19', zdroj_id: 'r3', uživatel_id: 'u9', od: '2026-03-04T08:00', do: '2026-03-04T14:00', stav: 'dokončena', poznámka: 'Veletrh Praha' },
  { id: 'res20', zdroj_id: 'r4', uživatel_id: 'u10', od: '2026-03-05T09:00', do: '2026-03-05T17:00', stav: 'dokončena', poznámka: 'Migrace dat' },
  { id: 'res21', zdroj_id: 'r5', uživatel_id: 'u1', od: '2026-03-06T10:00', do: '2026-03-06T15:00', stav: 'zrušena', poznámka: 'Počasí nevhodné pro exteriér' },
  { id: 'res22', zdroj_id: 'r1', uživatel_id: 'u2', od: '2026-03-09T09:00', do: '2026-03-09T10:30', stav: 'dokončena', poznámka: 'Onboarding nováček' },
  { id: 'res23', zdroj_id: 'r2', uživatel_id: 'u3', od: '2026-03-10T11:00', do: '2026-03-10T12:00', stav: 'dokončena', poznámka: 'Sync s remote týmem' },
  { id: 'res24', zdroj_id: 'r3', uživatel_id: 'u4', od: '2026-03-11T07:00', do: '2026-03-11T16:00', stav: 'dokončena', poznámka: 'Audit u zákazníka' },

  // Duben 2026 — aktivní + nadcházející (vytvořené)
  { id: 'res25', zdroj_id: 'r1', uživatel_id: 'u5', od: '2026-04-06T09:00', do: '2026-04-06T11:00', stav: 'dokončena', poznámka: 'Týmový standup Q2' },
  { id: 'res26', zdroj_id: 'r2', uživatel_id: 'u6', od: '2026-04-07T14:00', do: '2026-04-07T15:30', stav: 'dokončena', poznámka: 'Demo pro stakeholdery' },
  { id: 'res27', zdroj_id: 'r3', uživatel_id: 'u7', od: '2026-04-08T08:00', do: '2026-04-08T16:00', stav: 'dokončena', poznámka: 'Cesta na konferenci' },
  { id: 'res28', zdroj_id: 'r4', uživatel_id: 'u8', od: '2026-04-09T09:00', do: '2026-04-09T17:00', stav: 'dokončena', poznámka: 'Testování release' },
  { id: 'res29', zdroj_id: 'r1', uživatel_id: 'u1', od: '2026-04-13T09:00', do: '2026-04-13T11:00', stav: 'aktivní', poznámka: 'Sprint planning Q2' },
  { id: 'res30', zdroj_id: 'r2', uživatel_id: 'u2', od: '2026-04-13T13:00', do: '2026-04-13T14:30', stav: 'aktivní', poznámka: 'Pohovor senior dev' },
  { id: 'res31', zdroj_id: 'r5', uživatel_id: 'u3', od: '2026-04-13T10:00', do: '2026-04-13T16:00', stav: 'aktivní', poznámka: 'Natáčení promo videa' },
  { id: 'res32', zdroj_id: 'r3', uživatel_id: 'u4', od: '2026-04-14T08:00', do: '2026-04-14T15:00', stav: 'vytvořena', poznámka: 'Návštěva pobočky Plzeň' },
  { id: 'res33', zdroj_id: 'r1', uživatel_id: 'u9', od: '2026-04-14T09:00', do: '2026-04-14T10:30', stav: 'vytvořena', poznámka: 'Retrospektiva' },
  { id: 'res34', zdroj_id: 'r4', uživatel_id: 'u10', od: '2026-04-15T09:00', do: '2026-04-15T17:00', stav: 'vytvořena', poznámka: 'Instalace nového SW' },
  { id: 'res35', zdroj_id: 'r2', uživatel_id: 'u5', od: '2026-04-15T14:00', do: '2026-04-15T15:00', stav: 'vytvořena', poznámka: 'Call s dodavatelem' },
  { id: 'res36', zdroj_id: 'r5', uživatel_id: 'u6', od: '2026-04-16T09:00', do: '2026-04-16T13:00', stav: 'vytvořena', poznámka: 'Produktové foto e-shop' },
  { id: 'res37', zdroj_id: 'r1', uživatel_id: 'u7', od: '2026-04-17T09:00', do: '2026-04-17T11:00', stav: 'vytvořena', poznámka: 'All-hands meeting' },
  { id: 'res38', zdroj_id: 'r3', uživatel_id: 'u8', od: '2026-04-18T07:00', do: '2026-04-18T15:00', stav: 'vytvořena', poznámka: 'Přeprava materiálu' },
  { id: 'res39', zdroj_id: 'r2', uživatel_id: 'u1', od: '2026-04-20T10:00', do: '2026-04-20T11:30', stav: 'vytvořena', poznámka: 'Design review' },
  { id: 'res40', zdroj_id: 'r4', uživatel_id: 'u3', od: '2026-04-21T09:00', do: '2026-04-21T17:00', stav: 'vytvořena', poznámka: 'Školení bezpečnost' },
]

export const conflicts: Conflict[] = [
  { id: 'c1', rezervace_id: 'res1', typ: 'no_show', popis: 'Uživatel se nedostavil na rezervovanou zasedačku, ostatní čekali.', řešení: 'Upozornění zasláno, příště bude eskalováno.', stav: 'vyřešený', vytvořeno: '2026-01-05T12:00' },
  { id: 'c2', rezervace_id: 'res9', typ: 'no_show', popis: 'Zasedačka blokována celé dopoledne, nikdo nepřišel.', řešení: 'Telefonický kontakt, omluva přijata.', stav: 'vyřešený', vytvořeno: '2026-02-02T13:00' },
  { id: 'c3', rezervace_id: 'res14', typ: 'neoprávněné_užití', popis: 'Vůz používán osobou bez platné rezervace.', řešení: 'Interní šetření, uživateli odebrán přístup na 2 týdny.', stav: 'vyřešený', vytvořeno: '2026-02-10T19:00' },
  { id: 'c4', rezervace_id: 'res19', typ: 'neoprávněné_užití', popis: 'Vůz vrácen pozdě, překryv s další rezervací.', řešení: 'Domluva s oběma stranami, posunutí druhé rezervace.', stav: 'vyřešený', vytvořeno: '2026-03-04T15:00' },
  { id: 'c5', rezervace_id: 'res29', typ: 'dvojitá_rezervace', popis: 'Systémem prošly dvě souběžné rezervace na zasedačku A.', řešení: '', stav: 'čeká_na_řešení', vytvořeno: '2026-04-13T09:30' },
]
