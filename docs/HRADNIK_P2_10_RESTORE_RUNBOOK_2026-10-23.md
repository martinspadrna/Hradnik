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


## Zpřísnění offline preflight (23. 10. 2026)
- Commit před úpravou: `1935067eac00e04becdfa587c92b4f63ec009f5b`. Všechny tři workflow na něm **PASS**: restore target safety `39993237696`, Build `39993237795`, visual regression `39993237692`; Vercel status success.
- Guard nyní kontroluje **celou kořenovou HTTPS URL** včetně zákazu vlastního portu, login údajů v adrese, cesty, query a fragmentu **u Supabase i Vercel preview**. Testy obsahují 23 případů (1 povolený + 22 odmítnutých).
- **Důležité omezení:** offline regex neprokazuje, že Supabase projekt je skutečně izolovaný ani že Vercel hostname směřuje na neprodukční deployment. Před případným skutečným restore je nutné nezávisle zkontrolovat identitu projektu, konkrétní preview deployment, environment variables a oddělení service-role tajemství; žádná automatická kontrola nenahrazuje výslovný souhlas.
- Kontrolní krok této úpravy: nové CI na commitu se zpřísněním musí projít. Do té doby je implementace **čekající na CI**, stav HRA-P0-03 VERIFY 98 % a HRA-P2-10 BLOCKED 10 % zůstává beze změny.

## 25. 10. 2026 – ověření katalogu v produkčním počtu, pouze syntetická data

- Poslední bezpečnostní úprava `836488086e301696d14a9c1a4796b70edf3626ec` má GitHub CI **PASS**: guard `39998524862`, build `39998524728` a visual regression `39998524786`.
- Katalogový restore smoke byl rozšířen na **3 004 zcela fiktivních památek** (původní testovací fixture + 2 individuální fixtures + 3 001 syntetických záznamů) a **3 004 vazeb na zdroje**. Při ověření se kontrolují všechna syntetická ID, slugs, vazby 1:1, přetrvání dat po obnovení, vyloučení soukromého účtu a posun identity sekvencí.
- Test zůstává omezen na dvě krátkodobé databáze PostgreSQL v GitHub Actions. **Neobsahuje a nestahuje reálný katalog, nevytváří Supabase projekt, netestuje Supabase Auth ani Edge runtime.** Shodný počet řádků není záruka shodného obsahu nebo času odezvy.
- **Akceptace tohoto kroku:** zelený workflow `Hradník clean PostgreSQL schema smoke` spuštěný po nové změně, dále `Build Hradník` a `Hradník visual regression` PASS. Do dokončení nového workflow je stav čekající na CI, HRA-P0-03 VERIFY 98 % a HRA-P2-10 BLOCKED 10 % se nemění.

## 25. 10. 2026 – seznam funkcí pro izolované ověření (bez deploy)

- Předchozí testy 3 004 fiktivních památek, Build a Visual regression pro commit `84dd1ac` všechny PASS.
- V propojeném Supabase účtu je pouze stávající produkční Hradník `abqiprdggptuxebhpfyi`; žádná vývojová databázová větev. **Z tohoto důvodu nebyl vytvořen ani testován skutečný Supabase restore.**
- Offline povolený seznam ve `supabase/restore-edge-allowlist.json` obsahuje **pouze**: `hradnik-auth`, `hradnik-admin`, `hradnik-quality`, `hradnik-photo`, `hradnik-sync`, `hradnik-enrich-v4`, `hradnik-geocode-v3`.
- **Nevybírat** `hradnik-geocode` (starší zdroj v repo) ani `hradnik-migrate-temporary` (historický migrační pomocník existující pouze v produkčním deploymentu). Žádný obecný příkaz `supabase functions deploy` bez názvu funkce: dle Supabase dokumentace může hromadně nasadit všechny nalezené funkce. Budoucí deployment pouze cíleně po jedné funkci a po kontrolách target ref, oddělených klíčů a výslovného schválení; `supabase functions deploy` se nyní **nespouští**.
- `node scripts/verify-restore-edge-allowlist.mjs` a `node scripts/test-restore-edge-allowlist.mjs` fungují výhradně offline a kontrolují inventuru a 9 negativních/pozitivních stavů; do dokončení GitHub CI nové změny zatím **neoznačovat za PASS**.
- Před reálným restore ověřit samostatnou testovací Supabase, její Edge functions, funkční API, oddělenou Vercel preview konfiguraci a zásady pro případné náklady. Ověření samotného seznamu **nenahrazuje end-to-end**.

Zdroj aktuálního postupu nasazování: https://supabase.com/docs/guides/functions/deploy

## 25. 10. 2026 – statická závislost Edge Functions na prostředí

- `supabase/restore-edge-env.json` eviduje **pouze názvy** potřebných proměnných. Sedm schválených funkcí používá `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY`; servisní roli nikdy nepředávat do `VITE_*` a browseru.
- `hradnik-enrich-v4` primárně používá hodnotu `hradnik_enrich_control.enrich_key`; `HRADNIK_ENRICH_KEY` je fallback. `hradnik-geocode-v3` primárně používá `hradnik_sync_control.sync_key`; `HRADNIK_GEOCODE_KEY` je fallback. Při čistém nasazení nepřenášet produkční tajné klíče: ověřit, že nové DB klíče byly vytvořeny a funguje jejich autorizace.
- `verify-restore-edge-env.mjs` je offline inventura zdrojů, nikoli ověření skutečného nastavení, dostupnosti nebo nasazení funkcí. CI spouští i `test-restore-edge-env.mjs` se sedmi případy. Skutečný isolated Supabase restore nadále vyžaduje výslovný souhlas.

## 25. 10. 2026 – JWT režim sedmi funkcí při čistém obnovení

- Read-only inventura aktivních Edge Functions v produkční Supabase `abqiprdggptuxebhpfyi` potvrdila `verify_jwt=false` pro sedm běžných funkcí. Výslovná shodná nastavení jsou nyní ve `supabase/config.toml` **pouze pro schválený seznam** `supabase/restore-edge-allowlist.json`. Nastavení odpovídá live konfiguraci, samo o sobě ale neprokazuje bezpečnost logiky.
- Při `verify_jwt=false` **nefunguje výchozí kontrola JWT Supabase**, proto před budoucím reálným nasazením ověřit přístupovou logiku každého HTTP endpointu (vlastní session/token, hlavičky s klíčem, veřejná read-only cesta), včetně odmítnutí požadavků bez oprávnění. Nebylo provedeno žádné nasazení funkcí ani změna produkčních oprávnění.
- `scripts/verify-restore-edge-jwt.mjs` a `scripts/test-restore-edge-jwt.mjs` se spouští výhradně offline. Kontrolují explicitních sedm schválených funkcí, přesné JWT hodnoty a osm scénářů; nezjišťují dostupnost funkcí ani správnost jejich autorizace.
- Supabase dokumentace k možnosti `[functions.<name>] verify_jwt = false`: https://supabase.com/docs/guides/functions/function-configuration
