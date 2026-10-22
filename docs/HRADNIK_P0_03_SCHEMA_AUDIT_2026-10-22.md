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
