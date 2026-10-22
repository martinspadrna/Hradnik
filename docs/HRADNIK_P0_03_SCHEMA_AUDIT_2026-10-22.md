# Hradník – audit zakládací migrace P0-03
**Datum:** 22. 10. 2026 · **Prostředí:** samostatná Supabase `abqiprdggptuxebhpfyi` · **Režim:** pouze čtení

## Výsledek

Porovnány soubory `supabase/migrations/20261003_hradnik_standalone_baseline.sql` a `20261007_hradnik_photo_urls_https.sql` s katalogy skutečné PostgreSQL databáze `pg_class`, `pg_proc`, `pg_trigger`, `pg_policy`, `pg_constraint`, `pg_indexes` a `information_schema.columns`. Neprováděl se žádný DDL, DML ani nový projekt; pouze SELECT systémových metadat a agregovaných počtů.

| Kategorie | V migraci | Ve stávající DB | Výsledek |
| --- | ---: | ---: | --- |
| Tabulky `hradnik_*` | 9 | 9 | Shoda názvů |
| Sloupce | 106 | 106 | Shoda názvů a datových typů (vč. `text[]`) |
| Samostatně vytvářené indexy | 27 | 27 | Všechny existují |
| Implicitní indexy primárních/unikátních klíčů | Definované přes PK/UNIQUE | 12 | Očekávané, nikoli 12 chybějících migrací |
| SQL funkce `hradnik_*` | 14 | 14 | Shoda názvů |
| Uživatelské triggery | 5 | 5 | Shoda názvů |
| Veřejné SELECT RLS politiky | 3 | 3 | Shoda názvů |
| Cizí klíče | 5 | 5 | Shoda odkazovaných tabulek a `ON DELETE CASCADE` |
| Všechna omezení | PK, FK, CHECK, UNIQUE | 24 | 9 PK + 5 FK + 7 CHECK + 3 UNIQUE |
| Zapnuté RLS | 9 tabulek | 9 tabulek | Shoda |

**Ověřená práva:** `anon`/`authenticated` mají SELECT pouze na `hradnik_sources`, `hradnik_places`, `hradnik_place_sources`. Na 6 interních tabulek (`users`, `sessions`, `user_place_state`, `sync_runs`, `sync_control`, `enrich_control`) SELECT nemají; fungují přes Edge Functions s kontrolou tokenu/role a serverovou rolí. **Nesnažit se „opravit“ INFO o RLS bez politiky vytvořením veřejné politiky.**

**Rozšíření:** `pgcrypto` a `pg_trgm` jsou v `extensions` a baseline je deklaruje. Existující `pg_net` je v `public` (security advisor WARN); baseline jeho založení nevyžaduje, automaticky nemigrovat. Nový Supabase projekt musí mít běžnou `extensions` schema připravenou, než se v ní deklarovaná rozšíření vytvoří.

## Závislosti, které samotný SQL základ nedodá

1. **Katalog:** ostrá databáze obsahuje 3 004 památek a 9 katalogových zdrojů. Baseline automaticky založí metadata 9 zdrojů, kontrolní klíče a prázdné tabulky, **neobsahuje export 3 004 míst ani jejich vazeb a fotografií**. Pro identickou obnovu je nutný bezpečný export/import katalogu a `hradnik_place_sources` s zachováním ID a sekvencí; alternativně prvotní synchronizace vytvoří nový katalog, který nemusí být okamžitě identický.
2. **Osobní stav:** `hradnik_users`, `hradnik_sessions`, `hradnik_user_place_state` se z bezpečnostních důvodů **nesmějí** dostat do Git repozitáře ani do veřejných seedů. Při skutečné obnově osobních dat musí být samostatný šifrovaný a přístupově omezený postup, jinak budou účty nové/prázdné.
3. **Edge Functions:** databázové migrace samy nenasadí `hradnik-auth`, `hradnik-admin`, `hradnik-quality`, `hradnik-photo`, `hradnik-sync`, `hradnik-enrich-v4`, `hradnik-geocode-v3`. Je nutné nasazení zdrojů z `supabase/functions` do **nového**, správně zvoleného projektu. Starší `hradnik-geocode` není aktuálně nasazená a není součástí ověřeného cílového seznamu. Dočasný `hradnik-migrate-temporary` v produkci pouze vrací 410 a pro novou instalaci se nemá aktivovat.
4. **Tajemství a konfigurace:** klient má `VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY` (veřejné). Supabase funkce čtou `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ze serverového prostředí; tajný klíč nikdy neposílat do browseru. `hradnik_sync_control.sync_key` se generuje náhodně při založení DB, stejně tak enrich klíč. Tyto hodnoty držet pouze v zabezpečené konfiguraci oprávněných volání. Žádné produkční přístupové tokeny ani hesla v SQL seedu.
5. **Fotografie:** současný zdroj `hradnik-photo` ukládá externí HTTPS URL do `hradnik_places.photo_urls`; audit nenašel žádný Hradník-specific Supabase Storage bucket ani Storage API volání v těchto klíčových Edge Functions. Migrace z 7. 10. opravuje staré HTTP Wikimedia odkazy, ale nenahrazuje samotný katalog.
6. **Automatizace spuštění:** import katalogu, kontrola klíčů a nasazení funkcí zatím nejsou end-to-end otestovány ani plně zdokumentované jako spustitelný orchestrátor. Nic nezakládat na živé databázi kvůli tomuto auditu.

## Kontrola v repozitáři

Nový offline skript `scripts/verify-sql-baseline.mjs` kontroluje 9 tabulek/RLS, 14 chráněných funkcí a jejich GRANT/REVOKE, 5 triggerů, 27 indexů, 3 veřejné politiky, cizí klíče, seed 9 zdrojů, náhodný synchronizační klíč a následnou HTTPS migraci. Spouští se přes `npm run test:schema` a automaticky také v `prebuild`. **Neprovádí SQL na serveru ani nevolá Supabase.** Nemůže nahradit spuštění migrací v čistém prostředí.

## Bezpečný postup pro budoucí čistý restore – zatím NESPUŠTĚNO

1. Po samostatném schválení nákladů vytvořit **nový oddělený testovací Supabase projekt/branch**; ověřit, že není připojen k produkčnímu Vercelu ani živému Hradníku.
2. Ověřit Supabase CLI dle aktuální `--help` a připravenost `extensions`. Aplikovat obě SQL migrace v pořadí názvů **jen na prázdnou testovací DB**. Zkontrolovat 9 tabulek, 106 sloupců, 14 funkcí, 5 triggerů, 3 RLS politiky, granty, cizí klíče, vygenerovaný `sync_key`.
3. Nasadit **jen cílové Edge Functions** do testovacího projektu, nastavit serverovou konfiguraci a zkontrolovat odmítnutí anonymního přístupu k admin/quality.
4. Naplnit katalog z bezpečně schváleného zdroje a případně otestovat první synchronizaci. Produkční osobní data **nekopírovat automaticky** a neukládat tajemství do GitHubu.
5. V izolovaném Vercel preview připojeném pouze k testovací Supabase ověřit registraci, katalog, uživatelské stavy, fotografie, role, administraci a kontrolu kvality na PC/iPhonu.
6. Uložit výsledky a teardown/rollback postup. Produkční Hradník a staré databáze nechat beze změn.

**Stav HRA-P0-03:** VERIFY 95 % (struktura a statický preflight ověřené; skutečné založení na čisté DB ne). **HRA-P2-10:** BLOCKED 10 %, dokud neexistuje schválené oddělené prostředí.

## Izolovaný PostgreSQL smoke test bez vytvoření Supabase projektu

Jako další mezikrok lze testovat fyzickou aplikaci zakládacích SQL migrací v **dočasné PostgreSQL 16 službě** spuštěné pouze v GitHub Actions. To je odlišné od obnovy v nové Supabase, ale odhalí chyby `CREATE TABLE`/`CREATE FUNCTION`/`CREATE TRIGGER`, FK, RLS či chybějící rozšíření dříve, než se začne připravovat skutečný Supabase restore. CI workflow `.github/workflows/clean-schema-smoke.yml` a test `scripts/clean-schema-smoke.sql` nezapisují do žádné živé databáze, nenahrávají produkční data ani tajné klíče. Zahrnují i test následné HTTPS fotografie na výhradně fiktivní památce. P2-10 i po úspěšném smoke testu zůstává blokován, dokud nebude schválena a provedena oddělená Supabase instalace včetně Edge Functions a katalogu.

## Fyzická první aplikace migrací – GitHub Actions PASS (22. 10. 2026)

Na commitu `605d8923615388e38cf0e42e007cf68707dd7efb` proběhl job `Hradník clean PostgreSQL schema smoke`, run `39808221750`, **PASS**: izolovaný PostgreSQL 16, role pro lokální simulaci Supabase, obě skutečné migrace, jeden fiktivní záznam, HTTP→HTTPS foto `UPDATE 1`, úspěšný `scripts/clean-schema-smoke.sql`. Bez jakéhokoli přístupu k živým databázím. Navazující workflow bylo rozšířeno o **opakované provedení obou migrací na stejné ephemeral DB**, aby šlo prověřit jejich idempotenci; PASS tohoto doplnění musí potvrdit nové CI. P0-03 se posouvá na `VERIFY 98 %`, P2-10 zůstává `BLOCKED 10 %` – plný Supabase restore neproběhl.

## Ověření opakovaného použití migrací – PASS (22. 10. 2026)

GitHub Actions run `39808766154` pro commit `799a2e2f426a068e841f4d6f2657f9f1fc4fc238`: **PASS**. Migrační soubory `20261003_hradnik_standalone_baseline.sql` a `20261007_hradnik_photo_urls_https.sql` byly na nové ephemeral PostgreSQL 16 aplikovány **dvakrát**, pokaždé s `ON_ERROR_STOP=1`. Po obou průchodech následovala úspěšná strukturální a bezpečnostní kontrola `scripts/clean-schema-smoke.sql`; při druhém průchodu fotomigrace aktualizovala 0 řádků (první průchod 1 testovací záznam). Podporuje závěr, že SQL baseline je aplikovatelný a opakovaně použitelný na čistém PostgreSQL 16 s připravenými `extensions` a imitovanými rolemi Supabase. **Neprokazuje** instalaci Edge Functions ani prvotní import katalogu či celé platformy Supabase. P0-03 `VERIFY 98 %`, P2-10 `BLOCKED 10 %`.

## Připravený integrační smoke datových toků (22. 10. 2026)

Doplněn `scripts/clean-data-flow-smoke.sql` a odpovídající GitHub Actions krok. Na dočasné PostgreSQL 16 se mají ověřit vyvolání `hradnik_ingest_source_records` pro vytvoření památky, opakovanou aktualizaci a propojení druhého zdroje, dále SQL trigger kvality, relace a stav „navštíveno“ s datem, smazání účtu s kaskádou a kontrola oddělení oprávnění `anon`/`service_role`. Test používá pouze fiktivní položky v `BEGIN ... ROLLBACK`; nic nekopíruje z produkční databáze. **Stav je zatím připravený, nikoli potvrzený PASS**, dokud nové GitHub Actions neprojdou. Plná obnova celé aplikace v Supabase stále neproběhla.

## 22. 10. 2026 – CI integrace datových toků dokončena

GitHub Actions `Hradník clean PostgreSQL schema smoke`, run `39817922883` na `4f581d09`, **PASS**. Nad výhradně lokálním PostgreSQL kontejnerem po dvojí aplikaci obou migrací prošel `scripts/clean-data-flow-smoke.sql`: RPC ingest, aktualizace stejného zdroje, napojení druhého zdroje bez duplicity památky, trigger kvality, stav návštěvy a datum, relace a FK cascade, oprávnění klientských rolí, rollback fikčních testovacích záznamů. `Build Hradník` run `39817922938` **PASS**, produkční Vercel pro shodnou SHA READY. Vizuální workflow `39817922860` při zápisu čekalo na dokončení. P0-03 zůstává VERIFY 98 %, P2-10 BLOCKED 10 %, protože žádný skutečný Supabase restore/import katalogu nebyl vytvořen ani spuštěn.
