# Hradník – P2-10: bezpečná příprava obnovy na čisté Supabase

**23. 10. 2026 · pouze plán. ŽÁDNÁ OBNOVA NOVÉ SUPABASE ZATÍM NEPROBĚHLA.**

## Ověřený výchozí stav
- GitHub `main` na začátku přípravy: `1083fdaca0c2ce3f3c7713e0efe627d14469beb6`. Build PASS (run `39821344414`), visual regression PASS (run `39821344327`), produkční Vercel READY.
- Již otestováno v GitHub Actions: dvojí čistá instalace SQL na PostgreSQL 16, import výhradně **syntetického** katalogu včetně ID a sekvencí, oprávnění, RLS, testovací uživatelské stavy a rollback. Dokumentace: `docs/HRADNIK_P0_03_SCHEMA_AUDIT_2026-10-22.md`.
- Starý projekt `cgshssdjgzzuprlwnabl` a současná produkční Supabase `abqiprdggptuxebhpfyi` nejsou cílem obnovy a NESMĚJÍ se měnit.

## Předpoklady před skutečným restore (vyžaduje nové výslovné schválení)
1. Zvolit vlastní **novou izolovanou Supabase** se známými podmínkami a případnými náklady. Nevytvářet automaticky, nepoužívat produkční ani starý projekt.
2. Zvolit **neprodukční Vercel preview** s odlišnou URL. Ověřit, že nesdílí produkční proměnné pro projekt/servisní roli.
3. Schválit, zda lze testovat jen syntetická data, nebo i **samostatnou zabezpečenou katalogovou zálohu**; produkční uživatele, hesla, session tokeny a osobní návštěvy nepřenášet bez zvláštního rozhodnutí. Katalog není totéž co osobní stavy.
4. Projít offline bezpečnostní kontrolou s `HRADNIK_RESTORE_APPROVED=yes`, `HRADNIK_RESTORE_TARGET_URL=https://<novy-ref>.supabase.co`, `HRADNIK_PREVIEW_URL=https://<oddeleny-preview>.vercel.app` spuštěním `node scripts/verify-restore-target.mjs`. Kontrola **pouze validuje konfiguraci a neotevírá síť**. Tyto proměnné neobsahují tajné klíče; schválení se nesmí dovozovat z pouhého PASS tohoto skriptu.

## Izolovaný postup – zatím NESPouštěno
1. V čisté Supabase zkontrolovat `extensions` schema a aktuální požadavky Supabase CLI; provést migrace `20261003_hradnik_standalone_baseline.sql` a `20261007_hradnik_photo_urls_https.sql` v uvedeném pořadí.
2. Ověřit 9 tabulek, 106 sloupců, 39 indexů, 14 funkcí, 5 triggerů, 3 RLS politiky, 5 FK, 9 seed zdrojů, role/granty a interní náhodné kontrolní klíče.
3. Nasadit pouze aktivní Hradník Edge Functions z repozitáře: `hradnik-auth`, `hradnik-admin`, `hradnik-quality`, `hradnik-photo`, `hradnik-sync`, `hradnik-enrich-v4`, `hradnik-geocode-v3`; nenahrazovat starou či dočasnou migrační funkci. Na novém projektu ověřit běžnou dostupnost a blokování neoprávněného přístupu.
4. Nastavit výhradně **serverové** role / tajemství ve správném projektu. Ve frontendovém preview jsou povoleny pouze URL nové Supabase a veřejný publishable key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). `SUPABASE_SERVICE_ROLE_KEY` nikdy nevkládat do browseru, repozitáře nebo logů.
5. Při schváleném importu katalogu zachovat `hradnik_places.id`, `hradnik_place_sources.place_id` a po importu **nastavit identity sekvence na maximální importovaná ID**. Postup je ověřen **pouze** na syntetických datech v `scripts/ci-catalog-restore-smoke.sh`. Nemíchat osobní stav uživatelů do katalogové zálohy.
6. Testovat oddělené preview: katalog, mapa, detaily/fotografie, registrace fiktivního účtu, přihlášení/odhlášení, `favorite/want/visited` a datum návštěvy, role, správu, frontu kvality, offline návrat. Zápis testovacích dat pouze na izolovanou DB.
7. Zapsat výsledky, udržet produkci beze změn, testovací prostředí bezpečně odstranit až po schválení a ověření, že nebylo propojeno s produkcí.

## Co zatím zůstává blokované
- Plná Supabase není totéž jako PostgreSQL service CI (chybí Edge runtime, Data API, real preview a kontrola deploy konfigurace).
- Přenos všech 3 004 skutečných památek nebyl otestován; CI ověřilo pouze syntetický katalog.
- Žádný schválený nezávislý Supabase projekt ani rozpočet dosud nejsou k dispozici.

**Stav:** HRA-P0-03 VERIFY 98 %; HRA-P2-10 BLOCKED 10 %. Jakékoli vytvoření nového projektu nebo nasazení Edge Functions do něj vyžaduje zvláštní schválení.
