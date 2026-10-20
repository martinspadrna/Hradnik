# Hradník – nedestruktivní audit návaznosti na Supabase (20. 10. 2026)

**Ověření souvisejícího commitu `1be4747` dokončeno:** Build Hradník `39475985510` PASS (včetně runtime-isolation guardu), Hradník visual regression `39475985430` PASS (69 testů, 7 přeskočeno), Vercel produkce READY, HTTP ikony a aplikace `39475985108` PASS. HRA-P0-01 a HRA-P0-02 nyní DONE 100 %. Zbytek migrace včetně serverových rolí a čisté DB instance zůstává nezávislý, nedokončený úkol.

## Rozsah
Pouze čtení zdrojových souborů repozitáře, metadat **nové** Supabase `abqiprdggptuxebhpfyi` a výsledků předchozích Playwright testů PC/iPhone. Žádné změny schématu, řádků, RLS, funkcí ani tokenů. **Starý projekt** `cgshssdjgzzuprlwnabl` nedotčen.

## Frontendové propojení – P0-01 / P0-02
- Všechny aktuální browser `src/*.js` zdroje byly prohledány: starý projektový ref se v nich nevyskytuje; skutečná konfigurace je centralizovaná v `src/supabase.js`.
- Jediný browser `createClient` je v `src/supabase.js`, se sdíleným slotem `globalThis[CLIENT_SLOT]`; browser kód nepoužívá `service_role` ani `sb_secret_` klíč.
- Klíčové moduly `main.legacy.js`, `enhancements.legacy.js`, `info-ui.js`, `account-ui.js`, `admin.legacy.js`, `quality-ui.legacy.js` importují společnou konfiguraci klienta / odvozené `edgeFunctionUrl`.
- Test `all Supabase requests use the dedicated Hradník project` kontroluje cílový hostname skutečných zachycených požadavků při otevření seznamu, detailu a označení oblíbené památky na PC i iPhone profilu.
- Nový opakovatelný read-only script `scripts/verify-runtime-isolation.mjs` se spouští přes `prebuild` a `npm run test:isolation`, aby build selhal při návratu staré Supabase, druhého browser klienta, privileged browser klíče nebo změně logiky ochrany relace.
- Záměrná mez: nastavení `VITE_SUPABASE_URL` může přebít výchozí URL. CI Playwright kontroluje skutečnou odvozenou URL v testovacím buildu, produkční PC↔mobil/sync bylo potvrzeno uživatelem. Environment konfiguraci a runtime hlavního backendu dále hlídat před případnou změnou.

## Skutečná nová databáze (metadata Supabase, bez SQL změn)
- **9 tabulek `public.hradnik_*`:** sources, places, place_sources, sync_runs, sync_control, users, sessions, user_place_state, enrich_control. **RLS je aktivní na všech 9** podle výsledku `list_tables`.
- **8 nasazených Edge Functions:** `hradnik-migrate-temporary`, `hradnik-auth`, `hradnik-admin`, `hradnik-photo`, `hradnik-quality`, `hradnik-sync`, `hradnik-enrich-v4`, `hradnik-geocode-v3`. Repozitář obsahuje zdrojové soubory většiny uvedených aplikovaných funkcí.
- `hradnik-migrate-temporary` má v živém projektu stav `ACTIVE`, ale jeho načtený aktuální kód pouze vrací HTTP **410** s chybou `Migration helper disabled`. Z uvedeného neplyne, že by migrace skutečně běžela; funkci bez dalšího schválení nemažeme.
- Supabase security advisors: `rls_enabled_no_policy` **INFO** u šesti interních tabulek (enrich_control, sessions, sync_control, sync_runs, user_place_state, users). Tabulky s RLS a bez policies nemusí být veřejně přístupné; služba používá své serverové role. Je nutné ověřovat oprávnění proti skutečnému přístupovému modelu, nikoli zakládat obecné přístupové policies.
- Security advisor `extension_in_public`: **WARN** u `pg_net`. Bez dalšího dopadového/bezpečnostního auditu nepřesouvat rozšíření automaticky. Dokumentace: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public ; https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .

## P0-05, P0-06 a P2-14
- Uživatel před prací na ikonách potvrdil **6/6** manuálních kontrol včetně přihlášení, mobilního i desktopového detailu/uložení, synchronizace a offline zobrazení/fotek.
- Automatické scénáře pokrývají offline fallback s uloženým katalogem, české hlášení chyby, bezpečné zachování tokenu při 503, vymazání až při 401 a správný pozdní zápis stavů při střídání detailů. Nová regrese doplní skutečné odmítnutí network requestu a 403.
- **Závěr:** tyto tři cílené úkoly lze označit DONE (nikoliv automaticky celou migraci).

## Co zbývá
- **HRA-P0-04 VERIFY 95 %:** kontrola správy a kvality s oprávněními a skutečnými nedeštruktivními daty; jen seznam aktivních funkcí nestačí pro test rolí/fotek.
- **HRA-P0-03 VERIFY 90 % a HRA-P2-10 BLOCKED 10 %:** založení čisté oddělené Supabase instance/branch a replay SQL migrací ještě neproběhlo. Neodvozovat plnou reprodukovatelnost databáze jen z existence SQL souborů. Vyžaduje samostatné odsouhlasení případného projektu/nákladů.
- Znovu zkontrolovat stav bezpečnostních upozornění před jakoukoli DB úpravou a nezasahovat do staré databáze.

**Rollback pro doplněné testy a guard:** předešlý ověřený main `52d648f536e165981282570279f8845db2bcc9c3` (v0.1.2), beze změn aplikačního runtime.
