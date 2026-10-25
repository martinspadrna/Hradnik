# HRADNIK_HANDOFF.md

## 25. 10. 2026 – P2-10: bezpečný restore test se 3 004 syntetickými památkami

- **Převzetí `8364880`:** GitHub Actions restore target safety **PASS** (run `39998524862`, všech 23 scénářů), Build Hradník **PASS** (`39998524728`), visual regression **PASS** (`39998524786`), Vercel status success.
- **Nová CI dávka:** `scripts/ci-catalog-restore-smoke.sh` vytváří celkem 3 004 fiktivních míst a 3 004 zdrojových vazeb. `scripts/ci-catalog-restore-check.sql` po katalogovém restore do nezávislé dočasné PostgreSQL DB ověřuje počty, syntetická ID, slugs, externí ID, 1:1 vazby, soukromá data, granty a sekvence. Doplněn runbook.
- **Akceptace:** `Hradník clean PostgreSQL schema smoke` musí projít na novém commitu; build, visual a Vercel taktéž ověřit. **Před CI netvrdit PASS této dávky.**
- **Bez dopadu:** žádný frontend/backend runtime ani databázové migrace se nemění; žádná živá Supabase, produkční data nebo nový placený projekt. Zůstává HRA-P0-03 **VERIFY 98 %** a HRA-P2-10 **BLOCKED 10 %**. Plné obnovení do samostatné Supabase vyžaduje nové výslovné schválení.
- **Rollback:** `836488086e301696d14a9c1a4796b70edf3626ec`.

---

## 23. 10. 2026 – P2-10: PASS předchozího CI a zpřísnění URL guardu

- **Ověřené workflow výchozího MAIN `1935067e`:** restore target safety **PASS** (run `39993237696`), Build Hradník **PASS** (`39993237795`), visual regression **PASS** (`39993237692`). Vercel commit status **success**.
- **Další krok v této dávce:** `scripts/verify-restore-target.mjs` odmítá nově porty, login údaje, cesty, parametry a fragmenty u obou cílových URL. `scripts/test-restore-target.mjs` rozšiřuje matici na **23 offline scénářů** a kontroluje přesný počet. V `docs/HRADNIK_P2_10_RESTORE_RUNBOOK_2026-10-23.md` je popsána hranice offline ověření.
- **Akceptace:** po commitu musí PASS `Hradník restore target safety`, `Build Hradník` a `Hradník visual regression`; ověřit Vercel status. Před dokončením CI netvrdit PASS nové úpravy.
- **Bez změny:** pouze offline guard, testy a dokumentace; bez runtime změn, bez SQL, bez nové Supabase, bez zásahu do production/legacy DB, bez exportu skutečných dat. `HRA-P0-03 VERIFY 98 %` a `HRA-P2-10 BLOCKED 10 %`; restore mimo existující projekty vyžaduje zvláštní schválení.
- **Rollback:** `1935067eac00e04becdfa587c92b4f63ec009f5b`.

---

## 23. 10. 2026 – P2-10: kontrola izolace cíle obnovy a přehledný restore runbook

- **Výchozí HEAD:** `1083fdaca0c2ce3f3c7713e0efe627d14469beb6`; Build Hradník **PASS** (`39821344414`), visual regression **PASS** (`39821344327`), produkční Vercel **READY**. Předešlá kompletní dvojitá migrace a syntetický katalogový import také PASS.
- **Nový bezpečný krok:** `docs/HRADNIK_P2_10_RESTORE_RUNBOOK_2026-10-23.md` přináší postup pro budoucí izolovanou Supabase od schválení prostředí po test auth, správu památek, stav návštěv, kontrolu kvality a bezpečné ukončení. `scripts/verify-restore-target.mjs` je **offline-only guard**, který odmítne obě existující Supabase (`abqiprdggptuxebhpfyi`, `cgshssdjgzzuprlwnabl`), nesprávný formát URL, chybějící výslovné `HRADNIK_RESTORE_APPROVED=yes` a produkční Vercel hostname. `scripts/test-restore-target.mjs` kontroluje 12 případů.
- **CI:** nový `.github/workflows/restore-target-safety.yml` spouští tyto bezpečné offline testy při každé související změně. Nespouští `supabase login`, SQL, síťová volání ani tvorbu projektu. GitHub CI PASS musí být ověřen až po dokončení workflow.
- **Stav:** **HRA-P0-03 VERIFY 98 %; HRA-P2-10 BLOCKED 10 %**. Full-stack Supabase restore vyžaduje samostatné schválení nové izolované instance a případných nákladů. Nikdy neprovádět restore na produkci či starém projektu.
- **Rollback:** před této pouze dokumentační/offline dávkou `1083fdaca0c2ce3f3c7713e0efe627d14469beb6`. Runtime aplikace, verze 0.1.2 a všechny databáze beze změny.

---

## 22. 10. 2026 – P2-10: úspěšná simulace ID-preserving obnovy katalogu (CI PASS)

- **Testovaný HEAD:** `7fb883d9711bd7c3cdb487d7ee6ac154050c6696` na `main`. Workflow `Hradník clean PostgreSQL schema smoke` run **`39820835966` PASS**, včetně nového kroku `Restore synthetic catalogue into independent clean PostgreSQL database`. `Build Hradník` run **`39820835968` PASS**, Vercel produkce pro shodnou SHA **READY**. `Hradník visual regression` run `39820835982` při prvním zápisu ještě probíhal; jeho konečný výsledek zkontrolovat.
- **Skutečný integrační průchod:** v disposable GitHub Actions PostgreSQL 16 vytvořen testovací katalog 3 fiktivních památek + 3 zdrojových vazeb a falešný účet se zkušební návštěvou. `pg_dump -Fc --data-only` zahrnul **výlučně** `hradnik_places` a `hradnik_place_sources`; v **druhé, nové izolované databázi** byly nejprve provedeny obě SQL migrace a pak `pg_restore`. Kontrola ověřila, že zůstala původní ID `910001` a `910002`, FK vazby, zdrojový počet a foto URL, ale soukromý účet ani návštěva **nebyly** přeneseny.
- **Oprava postupu po importu:** v cílové DB se **sekvence identity `hradnik_places.id` a `hradnik_place_sources.id` nastavují na `MAX(id)`**; test úspěšně založil další památku a novou vazbu s ID vyšším než importované hodnoty. Je to nutný krok pro skutečnou budoucí katalogovou obnovu se zachováním historických ID.
- **Bezpečnost:** scénář je omezen podmínkami `GITHUB_ACTIONS=true`, `PGHOST=127.0.0.1`, `PGDATABASE=hradnik_ci`; obě databáze i archiv existovaly pouze v CI. **Žádná** ostrá ani stará Supabase, export reálných uživatelských dat, změna aplikace ani placený nový Supabase projekt.
- **Rozsah a stav:** HRA-P0-03 **VERIFY 98 %**, HRA-P2-10 **BLOCKED 10 %** (samotný PostgreSQL katalogový drill není plnohodnotná Supabase obnova včetně Edge Functions, Data API a všech 3 004 památek). Poslední mezikrok plně ověřen; pro dokončení P2-10 bude potřeba samostatně schválený testovací Supabase projekt/branch.
- **Rollback před P2-10 drill:** `4a624aba5d322db40c32182266615206f25f25a4`; při této další aktualizaci pouze dokumentace.

---

## 22. 10. 2026 – P2-10 bezpečná příprava zkoušky přenosu katalogu

- **Výchozí ověřený MAIN:** `4a624aba5d322db40c32182266615206f25f25a4`, Build Hradník **PASS** (`39818460994`), Visual regression **PASS** (`39818460858`), Vercel production READY. Předchozí `scripts/clean-data-flow-smoke.sql` **PASS** (`39817922883`), včetně uživatelských stavů a oprávnění.
- **Připravený nový integrační krok:** `scripts/ci-catalog-restore-smoke.sh` + `scripts/ci-catalog-restore-check.sql` v `Hradník clean PostgreSQL schema smoke`. Jen ve standardním dočasném GitHub Actions PostgreSQL 16 z původní testovací DB (3 **fiktivní** památky, 3 vazby a 1 falešný účet) vyrobí katalogový `pg_dump` **výhradně** tabulek `hradnik_places` a `hradnik_place_sources`. Založí **druhou nezávislou prázdnou dočasnou databázi**, aplikuje obě SQL migrace, obnoví archiv a ověří zachování ID, vazeb, fotografických URL, oprávnění a vyloučení osobních dat.
- **Kritický detail obnovy:** při zachování historických ID je třeba **posunout identity sekvence na MAX(importovaná ID)**. Test používá explicitní vysoká ID a ověřuje, že další nově založená památka a její vazba získají vyšší ID. Bez toho se může při budoucích zápisech obnovit konflikt ID.
- **Bezpečnostní omezení:** skript odmítne spuštění mimo GitHub Actions s `PGHOST=127.0.0.1`, `PGDATABASE=hradnik_ci`, `PGPORT=5432`, `PGUSER=postgres`. Archiv je výhradně lokální dočasný CI soubor a je smazán; žádné produkční přihlašování, kopírování reálných uživatelských dat, změny DB nebo placená Supabase.
- **Akceptace:** PASS nového kroku v GitHub Actions + `Build Hradník` PASS + vizuální regrese PASS. Výsledek neoznačovat za PASS před novým CI. **P0-03 VERIFY 98 % a P2-10 BLOCKED 10 %** zůstávají beze změny – plnou Supabase instalaci včetně Edge Functions a katalogu 3004 památek tento test nenahrazuje.
- **Rollback:** `4a624aba5d322db40c32182266615206f25f25a4` (pouze pomocné CI soubory a dokumentace; runtime 0.1.2 beze změny).

---

## 22. 10. 2026 – P2-10 dílčí test skutečných datových toků PASS

- **Commit:** `4f581d09ed6fb37c9443398eed1cca4b8c1b3a34` na `main`, stále verze aplikace `0.1.2`; Vercel produkce **READY**. GitHub Actions `Hradník clean PostgreSQL schema smoke` **PASS** (run `39817922883`), `Build Hradník` **PASS** (run `39817922938`). Vizuální regrese `39817922860` při zápisu ještě běžela: její závěr zkontrolovat zvlášť.
- **Integrační kontrola:** po dvojí úspěšné SQL migraci na nové ephemeral PostgreSQL 16 vytvoří fiktivní památku přes `hradnik_ingest_source_records`, provede idempotentní opakování, sloučí vazbu z dalšího zdroje, zkontroluje `quality_status`, `source_count`, uživatelský stav `visited` s datem, FK k relaci, smazání účtu s cascade a oprávnění `anon` proti `service_role`. Výsledek jobu: `PASS: isolated ingest RPC, deduplication, source links, auth/session FK, visited state, RLS and rollback.`
- **Data:** pouze fiktivní účet a památka v **BEGIN/ROLLBACK**; žádný uživatelský token, produkční Supabase, stará databáze ani nová placená instance. Zbytek izolovaného kontejneru se po jobu odstranil.
- **P0-03 VERIFY 98 %** a **P2-10 BLOCKED 10 %** ponechány: jde o skutečný PostgreSQL SQL/backend test, **nikoli** kompletní obnovení Supabase Auth/Data API/Edge Functions s frontendem a importem katalogu. To vyžaduje explicitně schválené oddělené prostředí.
- **Další bezpečný krok:** zkontrolovat vizuální CI, sepsat integrační plán pro skutečný Supabase restore bez production tokenů/dat; nedělat žádný nový produkční rollout změn backendu. **Rollback** před testem `3187556223eac7fe5f2ebee378cbb93259db64fe`.

---

## 22. 10. 2026 – P2-10 navazující kontrola datových toků (dočasná PostgreSQL CI DB)

- **Výchozí ověřený MAIN:** `3187556223eac7fe5f2ebee378cbb93259db64fe`: `Build Hradník` PASS (`39809173340`), `Hradník visual regression` PASS (`39809173339`), předchozí čistý PostgreSQL restore 2× PASS (`39808766154`); produkce READY.
- **Nový krok:** `scripts/clean-data-flow-smoke.sql` se po dvojí aplikaci migrací spouští **pouze** nad ephemeral PostgreSQL 16 v GitHub Actions. Pomocí fiktivních dat prochází `hradnik_ingest_source_records` insert → opakovaný update → spojení z druhého zdroje → počty vazeb / quality trigger, dále založení testovacího uživatele/relace, stav `visited`, datum návštěvy a smazání účtu s FK cascade. Ověřuje oddělení `anon` a `service_role`. Všechny testovací řádky jsou v SQL transakci s `ROLLBACK` a celý kontejner se po CI automaticky zahodí.
- **Ochrana:** žádný produkční účet, token, data ani klíče; tento SQL soubor nikdy nespouštět proti žádné skutečné Supabase. Není vytvořena žádná placená služba a neprovádí se žádná změna runtime nebo produkční databáze.
- **Akceptace této dávky:** `Hradník clean PostgreSQL schema smoke` PASS včetně nového integračního kroku a současně `Build Hradník` / `Hradník visual regression` PASS. Dokud neprojdou, nezvyšovat procenta a opravit případné chyby testu nebo skutečné SQL migrace až po posouzení dopadu na produkci.
- **P0-03:** `VERIFY 98 %`; **P2-10:** `BLOCKED 10 %`. Pro jejich plné uzavření stále chybí oddělená opravdová Supabase s Edge Functions a E2E aplikací.
- **Rollback před dávkou:** `3187556223eac7fe5f2ebee378cbb93259db64fe`.

---

## 22. 10. 2026 – výsledné převzetí P0-03 PostgreSQL smoke (CI PASS)

- **Aktuální ověřený HEAD:** `799a2e2f426a068e841f4d6f2657f9f1fc4fc238` na `main`. **`Hradník clean PostgreSQL schema smoke` – PASS**, GitHub Actions run `39808766154`. Obě skutečné SQL migrace byly aplikovány na novou krátkodobou PostgreSQL 16, ověřeny (`PASS: clean PostgreSQL baseline, HTTPS follow-up, RLS and role smoke`), **pak obě úspěšně aplikovány podruhé** a znovu ověřeny. Fotomigrace poprvé upravila 1 fiktivní URL, podruhé 0 (idempotence). Po dokončení CI byla služba odstraněna.
- **Úroveň kontroly:** 9 tabulek, 106 sloupců, 14 SQL funkcí, 5 triggerů, 39 indexů včetně PK/UNIQUE, 3 politiky a RLS, 5 FK, 9 zdrojů, interní kontrolní klíče, role `anon`/`authenticated` a zákaz SELECT pro interní tabulky. Žádné přihlášení ani produkční data nebyla použita.
- **`Build Hradník`** z prvního commitu `605d892` **PASS** (`39808221589`); vizuální regrese stejného commitu **PASS** (`39808221463`). Nové pracovní commity na `main` musí samostatně projít standardním CI a Vercel READY; status závěrečného dokumentačního commitu kontrolovat podle aktuálního SHA.
- **HRA-P0-03:** **VERIFY 98 %** – SQL baseline je strukturově shodný a reálně aplikovatelný dvakrát v PostgreSQL, nikoli však ještě ověřený v úplně nové Supabase instalaci.
- **HRA-P2-10:** **BLOCKED 10 %**, protože nová izolovaná **Supabase** s Edge Functions, frontend preview a naplněním katalogu zatím **nevznikla**. Pouhý PostgreSQL service v GitHub Actions není plnohodnotná Supabase. Pro skutečný Supabase restore je nutné oddělené prostředí, kontrola nákladů a výslovné schválení; produkční ani stará DB se nemění.
- **Další postup:** nepřepisovat již ověřené SQL, připravit příp. izolovaný end-to-end integrační postup bez produkčních osobních dat; pro vytvoření Supabase projektu si vyžádat schválení konkrétního prostředí. Rollback před přidáním DB smoke `c7bdc5387e70bd260fcbfbd04bc7e71a9dd28500`.

---

## 22. 10. 2026 – clean PostgreSQL smoke PASS + opakované aplikování

- **První běh:** GitHub Actions **`39808221750` PASS** na `605d8923615388e38cf0e42e007cf68707dd7efb`. Obě SQL migrace skutečně provedeny nad novým, prázdným ephemeral PostgreSQL 16. CI fixture s HTTP Wikimedia URL byla správně aktualizována na HTTPS (`UPDATE 1`), smoke ověřil všech 9 tabulek, 106 sloupců, 14 funkcí, 5 triggerů, 39 indexů, 3 RLS politiky, FK, seed a přístupová práva. `Build Hradník` **PASS** (`39808221589`). Živý Supabase ani stará DB nebyly použity. `Hradník visual regression` na této SHA ještě ověřit.
- **Navazující zpevnění:** nově spustit v tomtéž CI jobu obě migrace **podruhé**, znovu ověřit stejné invarianty a tím prověřit idempotenci vůči již existující testovací databázi. Výsledek druhého běhu nelze považovat za PASS do dokončení CI.
- **P0-03:** po prvním skutečném čistém PostgreSQL smoke **VERIFY 98 %**; i po opakovaném PASS nebude zcela hotovo bez skutečné čisté Supabase včetně jejího produktu a funkcí.
- **P2-10:** nadále **BLOCKED 10 %**, protože samostatná čistá Supabase a kompletní aplikace nebyly vyzkoušeny. V žádném případě nepřepojovat Vercel ani neimportovat produkční osobní data.
- **Rollback:** `c7bdc5387e70bd260fcbfbd04bc7e71a9dd28500` odstraní pouze nové smoke ověřování; žádná změna ostré aplikace ani DB.

---

## 22. 10. 2026 – P2-10: skutečný SQL smoke v izolované dočasné PostgreSQL CI databázi

- **Výchozí HEAD:** `c7bdc5387e70bd260fcbfbd04bc7e71a9dd28500`. Po předchozím P0-03 auditu je SQL statický prebuild guard PASS a Vercel produkce READY. Vizuální workflow `39804145042` bylo při poslední kontrole stále in progress, znovu ověřit stav.
- **Nový bezpečný krok:** GitHub Actions `.github/workflows/clean-schema-smoke.yml` spustí jen v izolované ephemeral **PostgreSQL 16** službě `hradnik_ci`. V této krátkodobé DB připraví nezbytné Supabase-like role `anon`, `authenticated`, `service_role` a schéma `extensions`. Zkusí **skutečně provést obě migrace** v pořadí, vloží jednu výhradně testovací památku s HTTP Wikimedia URL a ověří HTTPS normalizaci, strukturu, 9 RLS, 5 FK, 14 SQL funkcí, 5 triggerů, 39 indexů, 9 zdrojů, vygenerované kontrolní klíče a omezená SELECT oprávnění. Výsledek `scripts/clean-schema-smoke.sql`.
- **Význam/omezení:** tento test ověří čisté PostgreSQL schéma bez produktové Supabase a **bez placené nové Supabase instance**. **Není** to finální instalace Hradníku v Supabase: Edge Functions, frontend, první plnění 3004 položek a uživatelská data se zde nenasazují. Jakákoli chyba CI musí být odstraněna před označením podkroku za hotový.
- **Ochrana:** žádné URL, klíče, migrace nebo SQL nejsou odesílány do produkční nebo staré DB; PostgreSQL service container existuje jen v rámci GitHub Action a po dokončení zanikne. Nejvýše změna dokumentace a nové CI soubory v repozitáři; neměnit aplikační runtime.
- **HRA-P0-03:** od GitHub Actions `39808221750` PASS **VERIFY 98 %**. Základní PostgreSQL instalace obou migrací ověřena na čisté dočasné databázi, s následným souhrnným SQL testem; zbývá opakovaná aplikace a plná Supabase.
- **HRA-P2-10:** zůstává `BLOCKED 10 %` pro skutečné obnovení kompletní aplikace na samostatné Supabase; samotný ephemeral PostgreSQL test není plnohodnotný Supabase restore.
- **Rollback:** `c7bdc5387e70bd260fcbfbd04bc7e71a9dd28500` pro přidanou CI kontrolu; žádná riziková DB operace.

---

## 22. 10. 2026 – HRA-P0-03: porovnání migrační baseline a produkčního schématu

- **Výchozí HEAD:** `0a052e34423c82af8fe699c3db71a6165fd26107` (`main`, verze `0.1.2`; Build i visual regression úspěšné). **Rozsah této dávky:** pouze read-only dotazy na katalogy PostgreSQL, offline statický guard, postup pro izolovaný restore a aktualizace handoffu. **Nezasahovat do žádné živé ani staré Supabase.**
- **Porovnání produkční nové Supabase `abqiprdggptuxebhpfyi` s `20261003_hradnik_standalone_baseline.sql`:** 9/9 tabulek, **106/106 sloupců**, 14/14 SQL funkcí, 5/5 triggerů, 3/3 veřejných SELECT RLS politik, 5/5 FK a všech **27** pojmenovaných indexů odpovídá. Dalších **12** indexů produkce jsou implicitní PK/UNIQUE (celkem 39), nikoliv chybějící ruční migrace. Všech 9 tabulek má aktivní RLS; SELECT na 6 interních tabulkách není povolen pro anon/authenticated.
- **Data a závislosti:** ostrý katalog má **3 004** památek a **9** zdrojů. Baseline se připraví s 9 zdroji a prázdným katalogem. Samostatný import/synchronizace katalogu, Edge Function nasazení, serverové klíče a případný bezpečný přenos soukromých uživatelských dat nejsou součástí samotného SQL. Projekt Hradníku nemá zjištěný specializovaný Storage bucket; fotky se ukládají pomocí URL. Další `20261007_hradnik_photo_urls_https.sql` upravuje starší Wikimedia odkazy.
- **Přidané soubory:** `docs/HRADNIK_P0_03_SCHEMA_AUDIT_2026-10-22.md`, `scripts/verify-sql-baseline.mjs`. Nový `npm run test:schema` je součástí `prebuild`; blokuje regresi SQL objektů, **neprovádí žádné SQL ani síťová volání**.
- **Stav:** **HRA-P0-03 VERIFY 95 %**; HRA-P2-10 **BLOCKED 10 %**. K DONE chybí skutečný isolated fresh-DB restore a kompletní bootstrap – vytvoření dalšího projektu/branch a náklady vyžadují samostatné povolení. Nenačítat skutečná hesla ani tokeny.
- **Po commitu ověřit:** Build Hradník PASS (zejména nový `test:schema` v prebuild), visual regression PASS, Vercel produkce READY se shodným SHA; pokud některý failne, opravit a nepovažovat změnu za hotovou.
- **Další bezpečný krok:** dle výsledků CI doplnit seznam věcí blokujících clean restore, bez přepojení produkčních environment proměnných nebo úprav databáze. Rollback: `0a052e34423c82af8fe699c3db71a6165fd26107`.

---

## HRA-P0-04 – produkční uživatelská přejímka (22. 10. 2026)

- **Výsledek:** **DONE 100 %**. Po výslovné žádosti o ověření skutečného administrátorského účtu v produkci, otevření **Správa památek → Kontrola kvality** a načtení obou seznamů bez ukládání/schvalování uživatel odpověděl **„je to ok“**. Výsledek tím potvrzuje zamýšlený pozitivní průchod pod jeho účtem; potvrzení nerozlišuje samostatně PC vs fyzický iPhone.
- **Předchozí automatické testy:** Build a vizuální regrese commitu `3627c2c61f3cb991e8aebdeba8711d9c16f8fa04` úspěšné (GitHub Actions `39656206021` a `39656206049`), předtím 75 PASS / 7 skipped na PC + emulaci iPhonu. Živé anonymní požadavky na admin/quality byly odmítnuty 403, auth/session 401, migrační helper 410. Zdrojové kódy admin/quality funkcí odpovídají nasazeným.
- **Databáze:** žádné zásahy do schématu, rolí, relací, uživatelských dat či starého Supabase. Verze Hradníku zůstává `0.1.2`; při této aktualizaci se mění **pouze evidence a dokumentace**.
- **Aktuálně řešený úkol:** **HRA-P0-03 – VERIFY 90 %** (zakládací migrace) s navazujícím **HRA-P2-10 – BLOCKED 10 %** (zkouška na čisté oddělené Supabase). Nezakládat placený projekt ani neupravovat živou/staronovou databázi bez výslovného souhlasu; další bezpečný krok je jen offline audit baseline/porovnání s produkčním schématem a seznam rozdílů.
- **Rollback před dokumentačním commitem:** `3627c2c61f3cb991e8aebdeba8711d9c16f8fa04`.

---

## 21. 10. 2026 – P0-04: porovnání živého backendu a rolí (pouze čtení)

- **Výchozí MAIN:** `6316eb8e0ad87916b1dd6eeaafb56bb2edfbcb53` (v0.1.2, Build/visual PASS, 75 passed + 7 skipped). Během kontroly nebyly použity uživatelské přihlašovací údaje, tokeny ani zapisovací databázové operace.
- **Živý nový projekt Supabase:** `abqiprdggptuxebhpfyi`. Agregovaný dotaz ověřil existenci **1 účtu s rolí admin** a **2 neexpirovaných admin relací**. Bez čtení osobních profilů nebo relací/token hashů. Existenci účtu a relací nelze vydávat za pozitivní provozní test `hradnik-admin/list` se skutečným tokenem.
- **Nasazené funkce:** `hradnik-admin` v1 a `hradnik-quality` v1 jsou ACTIVE a **jejich skutečný `index.ts` je znak po znaku totožný** s repozitářem na MAIN. Obě implementace vyžadují bearer token, token hash, neexpirovanou relaci a `hradnik_users.role === 'admin'`; pozitivní scénáře role jsou pokryty Playwright mockem (75 PASS).
- **RLS:** všech **9** tabulek `public.hradnik_*` má `relrowsecurity=true`. Tři veřejné katalogové tabulky mají po jedné RLS politice; zbývajících šest interních tabulek má 0 politik a jsou odděleny serverovou rolí. Neodstraňovat RLS ani nepřidávat veřejné politiky jen kvůli informačnímu varování linteru.
- **Edge inventory:** nasazeno 8 funkcí včetně `hradnik-geocode-v3` a záměrně vypnutého migračního pomocníka (HTTP 410). V repozitáři je navíc starší zdroj `hradnik-geocode`, **který není nasazen**; naopak migrační pomocník je jen v live deploymentu. Rozdíly evidovat, starou geocode verzi ani dočasnou migraci bez příčiny nevypínat/nedoplňovat.
- **Stav P0-04: VERIFY 98 %.** Není důvod tvrdit DONE, dokud není read-only ověřen skutečný přihlášený administrátor na PC a mobilu, obě nabídky a načtení seznamů; uživateli nevyžadovat heslo ani token.
- **Zbývající P0-03 / P2-10:** beze změny, žádný čistý restore ani mazání staré Supabase. **Další krok:** bezpečný uživatelský průchod (otevřít Správa památek → Kontrola kvality, nic neschvalovat/neukládat) a poté P0-04 DONE, pokud bez chyby.

---

## P0-04 – admin a quality UI ověřeny na PC + iPhone (20. 10. 2026)

- **Hotový aplikační HEAD:** `9d70d9f2718e214cd81358a3bdd197572b271a71` na `main`. Vercel produkce **READY** pro shodnou SHA, `Build Hradník` **PASS** (run `39483500864`), `Hradník visual regression` **PASS** (run `39483500880`: **75 passed, 7 skipped, 0 failed**).
- **Ověřené nové průchody PC/iPhone:** běžný přihlášený uživatel nevidí admin vstup v hlavičce ani v mobilní nabídce; administrátor může otevřít správu památek, vyhledat místo, prohlížet editor **bez uložení**, otevřít a zavřít frontu kontroly kvality; při odmítnutí HTTP 403 se zobrazí česká chyba bez privátních záznamů.
- **Skutečně opravená závada:** desktopové admin tlačítko používalo špatnou třídu vůči referenčnímu shellu, proto bylo skryté; na mobilu je teď dostupné přes již existující hamburger menu. Role serveru se nemění. Mock v regresních testech všechny zapisovací požadavky odmítá.
- **HRA-P0-04: VERIFY 98 %.** Reálně nasazené veřejné API ochrany byly dříve ověřeny HTTP 401/403/410, ale **kladný přístup s legitimními skutečnými administrátorskými oprávněními dosud nebyl ověřen** (pouze simulován Playwright). Na 100 % převést až po bezpečné reálné read-only zkoušce admin/quality pod vlastním účtem. Nevyžadovat uživatelské heslo ani token.
- **Větev/verze/rollback:** `main`, verze aplikace stále `0.1.2` (cílený fix bez změny manifestu). Možnost návratu na `8630e3fcb3709aee40cca8a19f251b7868ce6481` před P0-04 fixem; žádné změny Supabase databáze, politik ani dat.
- **Další krok:** uživatelská real-device read-only kontrola přístupu do `Správa památek` a `Kontrola kvality` bez použití tlačítek Uložit/Schválit/Zamítnout. Ostatní otevřené položky P0-03 VERIFY 90 % a P2-10 BLOCKED 10 % zůstávají nedotčené.

---

## P0-04 – oprava testovacího postupu pro iPhone (20. 10. 2026)

- Běh `39482602542` na `714c7243`: desktop admin/quality testy **PASS**, mobilní testy **FAIL**, protože jejich selektor stále mířil na úmyslně skryté desktopové tlačítko. Oprava mobilního menu samotného již byla ve zdrojáku, ale během předchozího commitu se nedopatřením přepsaly změny testovacího pomocníka.
- **Pouze test:** společný helper `openAdminForViewport` otevírá desktopové tlačítko na PC, mobilní hamburger a položku `data-ref-mobile="admin"` na iPhonu. Kód aplikace, role, DB i API beze změn. Běžný uživatel musí dál mít admin menu skryté.
- Akceptace: Build a celá vizuální/regresní sada PASS na obou profilech, produkční Vercel READY. **P0-04 stále VERIFY**, žádný pozitivní přístup s živým admin tokenem nebyl zkoušen.
- **Rollback:** `8630e3fcb3709aee40cca8a19f251b7868ce6481` před admin změnami; historie testů zachována.

---

## P0-04 – zajištění administrace na mobilu (20. 10. 2026)

- **Stav před opravou:** commit `a571ec9e6b2c28fc8b8da6021015065a31fa4de3` – desktopové administrátorské scénáře prošly, ale mobilní pozitivní průchod FAIL, protože mobilní hlavička úmyslně nezobrazuje desktopové akce. CI `39481557119` navíc ojediněle selhal v nesouvisejícím měření šířek desktopových karet (hodnota `undefined`; neoznačovat za potvrzenou chybu layoutu bez reprodukce).
- **Kořenová oprava:** namísto odkrytí desktopových tlačítek na úzkém displeji přidat administrátorům položku **„⚙️ Správa památek“** do již existující mobilní nabídky (vedle profilu / nastavení). Zobrazovat jen po úspěšném `hradnik-admin/me` s rolí `admin`; stejné `openAdmin()`, po klepnutí se nabídka zavře. Bez nových CSS, bez změn backendu a oprávnění.
- **Regrese:** Playwright PC používá existující header action, iPhone otevře mobilní menu a položku pro administraci. Test neadministrátora nově ověřuje absenci položky i v mobilní nabídce. Mock trvale blokuje všechny zapisovací akce.
- **Akceptace:** nové CI Build a Visual Regression PASS na desktop+iPhone; teprve potom P0-04 zvýšit v evidenci. P0-04 nesmí být označen DONE pouze z mocku: skutečný legitimní admin endpoint se ještě musí bezpečně ověřit.
- **Rollback:** `8630e3fcb3709aee40cca8a19f251b7868ce6481` před testovacím balíkem, popř. `a571ec9e` (desktop only), bez změn Supabase.

---

## P0-04 – odhalena skrytá administrace (20. 10. 2026)

- **Reálná regresní závada:** nové tři Playwright scénáře odhalily, že při validní administrátorské roli se tlačítko `.hradnik-admin-btn` vloží do DOM, ale přesto zůstane **skryté** na PC i iPhone. Testovací běh `39480655343`: 71 PASS, 7 skipped, 4 FAIL = dva pozitivní admin/quality scénáře v obou profilech; běžný uživatel správně admin vstup nevidí.
- **Kořenová příčina:** společný shell `src/reference-runtime-retry.js` záměrně skrývá `header .account>button:not(.reference-header-action)`; tlačítko `src/admin.legacy.js` tuto třídu nemělo.
- **Minimální oprava:** při tvorbě admin tlačítka přidat stávající třídu `reference-header-action` (nepřidávat další CSS ani jiné viditelné ovládací prvky). Role check `user.role==='admin'` a serverová kontrola tokenu beze změn. Oprava vyžaduje kompletní CI PASS včetně nových simulovaných scénářů PC/iPhone a produkční READY.
- **HRA-P0-04:** **VERIFY 97 %**, dokud CI a případné následné mobilní ověření nejsou hotovy. Nové testy používají jen mock, takže skutečný pozitivní přístup administrátora do živého backendu stále není potvrzen. Rollback na `8630e3fcb3709aee40cca8a19f251b7868ce6481` (před novými testy).
- **Další krok:** po úspěšném CI zapsat PASS a prakticky ověřit administraci a frontu kvality pod reálným administrátorským účtem, bez jakéhokoliv zápisu.

---

## 2026-10-20 – P0-04: automatické read-only testy admin/quality UI

- **Výchozí main:** `8630e3fcb3709aee40cca8a19f251b7868ce6481` (produkce READY, 69 testů PASS; live nepřihlášený smoke test `39477214791` PASS). Nová změna zasahuje **pouze Playwright fixture a testy**; žádná změna aplikace, Supabase, uživatelských dat nebo rolí.
- **Tři nové scénáře (PC + iPhone):** běžný přihlášený uživatel nemá administrační vstup; administrátor může otevřít a filtrovat seznam památek, otevřít editor **bez uložení**, zobrazit frontu kontroly kvality a zavřít ji; při HTTP 403 z quality se zobrazí české upozornění bez úniku záznamů.
- **Zabezpečení fixture:** `hradnik-admin` a `hradnik-quality` jsou přesměrovány jen na lokální testovací mock; `save`, `delete`, `restore`, `approve`, `reject` jsou mockem vždy odmítnuty HTTP 405. Testovací přístupové údaje nejsou reálné.
- **CI:** požaduje se `Build Hradník` a `Hradník visual regression` PASS, Vercel READY se stejným SHA; neoznačovat PASS před dokončením. Cíl P0-04 zatím **VERIFY 97 %**, dokončení vyžaduje reálný read-only test přihlášeného administrátora (bez sdílení hesla nebo tokenu v chatu).
- **Rollback:** zpět na `8630e3fcb3709aee40cca8a19f251b7868ce6481`; runtime JS beze změny.
- **Další krok:** po zeleném CI evidovat simulované UI scénáře, poté případně provést povolenou read-only kontrolu admin účtu na skutečném zařízení. P0-03 / P2-10 nesouvisí a zůstávají beze změn.

---

## Původní plán znovu otevřen po dokončení ikon – 20. 10. 2026

- **Výchozí produkční HEAD:** `52d648f536e165981282570279f8845db2bcc9c3` (v0.1.2). **Scope této dávky:** pouze read-only Supabase/repo audit, dva auth regresní testy, vynucený statický bezpečnostní preflight v `prebuild`, aktualizace plánu. Nezasahovat do produkční databáze ani backend funkcí. Rollback na výchozí HEAD.
- **Uživatelské potvrzení před ikonami:** šest ze šesti bodů PC, mobil, detaily, ukládání, synchronizace PC↔mobil a offline/fotografie bylo oznámeno jako OK. Na tomto základě uzavíráme **HRA-P2-14, HRA-P0-05 a HRA-P0-06 DONE 100 %**; netvrdit, že uživatel na zařízení ručně simuloval 401, 403 či HTTP 503 (to kryje automatizace).
- **HRA-P0-01 / P0-02:** **DONE 100 %**. Frontend bez staré Supabase URL, jediný browser klient, uživatelské PC/mobil/synchronizace OK. Build včetně statického guardu **PASS** (run `39475985510`), Playwright včetně URL checku a 503/network/401/403 **69 PASS, 7 skipped, 0 FAIL** (run `39475985430`), produkce READY pro `1be4747197cf96191af7fec8ee760c756bd94af6`.
- **Nová Supabase `abqiprdggptuxebhpfyi`:** read-only metadata ukazují 9 `hradnik_*` tabulek s RLS, 8 aktivních Edge Functions včetně neškodného `hradnik-migrate-temporary` (aktuálně vrací jen HTTP 410). Advisor INFO = 6 tabulek s RLS bez policies, WARN = `pg_net` extension in public; automaticky neměnit ani jedno.
- **Auditní protokol:** `docs/HRADNIK_BACKEND_AUDIT_2026-10-20.md`. **HRA-P0-04 VERIFY 98 %:** živý anonymní přístup k admin a quality bezpečně odmítnut HTTP 403, k auth/session HTTP 401 a dočasný migration helper vrací HTTP 410; GitHub Actions `39477214791` PASS. Chybí pozitivní read-only funkční ověření legitimního admin účtu / UI. **HRA-P0-03 VERIFY 90 % a HRA-P2-10 BLOCKED 10 %**; bez samostatně odsouhlasené čisté DB instance žádný restore drill.
- **Ověření dokončeno 20. 10. 2026:** `Build Hradník` PASS (run `39475985510`), `Hradník visual regression` PASS (run `39475985430`, 69 PASS / 7 skipped, oba nové auth scénáře zvlášť na PC/iPhone), HTTP produkční ikon PASS (run `39475985108`). Produkční Vercel READY se shodnou SHA `1be4747`.
- **Další krok:** P0-01/02 DONE, negativní auth test P0-04 prošel. Pokračovat bezpečným read-only ověřením přihlášeného admin účtu v administraci / kvalitě bez zápisů a zkouškou rolí; **nevyžadovat hesla/tokeny v chatu**. RLS advisor jen revidovat, bez nevyžádaných zásahů.

---

## Produkční release 2026-10-20 – Hradník 0.1.2 (iOS Edge PWA ikona)

- **Uživatelský souhlas:** 20. 10. 2026 „dej to na main“ po ověření testovací větve `test/ios-edge-icon-20261020`.
- **Main výchozí / rollback SHA:** `a55184811666fb98311cb9fe145a93bed37efe13` (verze `0.1.1`). Původní commit i Vercel deployment zachovat pro návrat. Backend, databáze, synchronizace a aplikační UI jsou beze změny.
- **Zdroj:** odzkoušené soubory z testovací větve, produkční označení bez „TEST“. `public/ios-install.html` je **fyzický soubor commitnutý v main** s vloženým PNG v `data:image/png;base64`; `public/apple-touch-icon-ios-v012.png` je fyzický **neprůhledný 180×180 PNG** (stejný stávající zlatý štít). `src` Android/Windows a jejich průhledné ikony `icon-192-v011.png` a `icon-512-v011.png` se nemění.
- **Použití:** `https://hradnik.vercel.app/ios-install.html` otevřít v Microsoft Edge na iPhonu a Přidat na plochu. V instalovaném režimu stránka ihned přesměruje `/?source=pwa`. Nová standardní `apple-touch-icon` v indexu a třetí položka v public i Vite manifestu odkazují na existující `/apple-touch-icon-ios-v012.png`; `purpose:any`, beze změny ID PWA. Workbox aktualizuje soubory pomocí revizí a čištění starých cache.
- **Verze:** `package.json` `0.1.2`, `index.html` `application-version=0.1.2`. `scripts/generate-ios-edge-install.mjs` je reprodukovatelný generátor souborů, ale hotové PNG a HTML jsou **už commitnuté** – není třeba čekat na build.
- **Před převodem – TEST:** Vercel preview READY; vizuální testy `39467425761`: **65 PASS / 7 skipped / 0 FAIL** (včetně samostatného testu iPhone launch), skutečná HTTP 200 `39467425826` pro instalátor, 180/192/512 PNG, manifest a otevření aplikace. Žádné další UI změny.
- **Po nasazení na produkci:** ověřit Build Hradník, Hradník visual regression a novou workflow `Production iOS PWA HTTP verification` s reálným HTTP 200 **po vydání**; produkční SHA musí být přesná release SHA. Stav fyzické ikony na iPhonu uživatel ještě může dodatečně potvrdit.
- **Bezpečná cesta zpět:** revert tohoto jediného release commitu nebo přepnutí na uložený Vercel deployment odpovídající výchozí SHA. Nevypínat produkční ochranné mechanismy, nepřenášet preview aliasy / preview výjimky / testovací GitHub workflows do main.

---


> Jediný průběžně aktualizovaný předávací a řídicí soubor projektu Hradník.
> Každý nový chat / Work běh má nejdřív načíst tento soubor a pokračovat podle sekce **Aktuálně řešený úkol**.

---

## 1. Základní stav projektu

- **Projekt:** Hradník
- **Datum založení handoffu:** 2026-10-03
- **Branch:** `main`
- **HEAD:** aktuální commit větve `main` (tento soubor je součástí stejného commitu jako změny)
- **Produkce:** zdrojový kód používá nový Supabase přímo; build na aktuálním P0/P1 stavu prochází, navigace a reference shell se ještě ověřují regresními testy
- **Nový Supabase projekt:** `abqiprdggptuxebhpfyi`
- **Nová Supabase URL:** `https://abqiprdggptuxebhpfyi.supabase.co`
- **Starý Supabase projekt:** `cgshssdjgzzuprlwnabl`
- **Stará Supabase:** NIC NEMAZAT, dokud nový Hradník nebude kompletně ověřený

### Hlavní cíl
Kompletně oddělit Hradník od staré Domácnost+ Supabase, stabilizovat frontend, opravit mobilní i desktopové chyby a odstranit kořenové příčiny místo přidávání dalších záplat.

---

## 2. Povinná pravidla práce

1. **Nic nemaž ze starého Supabase projektu**, dokud není nový Hradník plně ověřený.
2. Opravovat kořenové příčiny, ne přidávat další nahodilé CSS/JS záplaty.
3. Po každém skutečně dokončeném nebo ověřeném kroku aktualizovat tento soubor.
4. Ve stejném commitu vždy aktualizovat:
   - stav úkolu,
   - procento dokončení,
   - aktuální branch/HEAD,
   - poslední dokončený krok,
   - co má uživatel ručně ověřit,
   - další doporučený krok.
5. Nový chat nemá znovu analyzovat celý projekt od nuly. Má nejdřív přečíst tento soubor.
6. Produkci neměnit bez jasného důvodu a ověření.
7. Při migraci nejdřív budovat a ověřovat nový Supabase projekt, teprve potom případně odpojovat starý.
8. Pokud se objeví nový problém, přidat ho do tohoto souboru a přiřadit prioritu P0–P3.

---

## 3. Stavové hodnoty

- `TODO` – nezačato
- `IN PROGRESS` – právě řešeno
- `BLOCKED` – nelze pokračovat bez další podmínky / vstupu
- `VERIFY` – technicky hotovo, čeká na fyzické ověření
- `DONE` – hotovo a ověřeno

---

## 4. Aktuálně řešený úkol

**ID:** HRA-P0-03  
**Název:** Doložit reprodukovatelnou zakládací migraci bez zásahu do produkce  
**Stav:** VERIFY  
**Dokončeno:** 98 %

**Předchozí úkol HRA-P0-04:** DONE 100 % na základě potvrzení uživatele 22. 10. 2026. Historické poznámky níže zůstávají zachované jako auditní stopa.

### Navazující technické ověření (2026-10-19)

- **Výchozí commit:** `dcfbd585c61c4daaf12172770eb431eddb332683` má `Build Hradník` PASS (run `39273152862`), `Hradník visual regression` PASS (run `39273152795`) a Vercel READY.
- **Zjištění:** `src/account-ui.js` při jakékoli chybě odpovědi `session` odstraňoval `hradnik_session`; při dočasném 503/offline tak návštěvník mohl být odhlášen, i když měl platnou relaci.
- **Oprava:** zachytit HTTP status, token odstranit pouze při výslovném 401/403. Dočasné chyby pouze zalogovat a token ponechat; přihlášený profil se po obnovení spojení načte bez nového loginu.
- **Regrese:** test 503 → obnovení relace po reloadu, test 401 → smazání tokenu, test skutečných request hostnames katalogu a uživatelských stavů. Oba profily desktop/iPhone. Nový commit ještě musí projít CI, nepovažovat jej za PASS před dokončením.
- **Ruční ověření:** viz `docs/HRADNIK_MANUAL_QA.md`. Nemanipulovat se Supabase databází ani s existujícími relacemi serverově.
- **P2-14:** technicky ověřený PASS (53 Playwright PASS, 7 skipped), čeká na fyzické potvrzení změn stavů. P0-01 až P0-05 zůstávají VERIFY, P2-10 BLOCKED.

### Zpětná vazba z PC a oprava vrstvících se detailů (2026-10-19)

- **Výchozí HEAD:** `1cb6c2fedb5bdd8f094131b29cef48c730daa21c`; `Build Hradník` **PASS** a `Hradník visual regression` **PASS** (včetně 7 CSS breakpointů).
- Uživatel doložil **5 reálných PC screenshotů** Mapa / Seznam / Oblíbené / Kategorie / O aplikaci; vzhled navigace a základních panelů působí konzistentně. **Čeká se na další screenshoty z mobilu**; nejde ještě o konečné fyzické schválení iPhonu.
- Uživatel ohlásil, že při otevření více různých památek zůstávají překrytá stará detailní okna a musí je postupně zavírat.
- **Příčina:** `src/main.legacy.js` vytvářel pro každé `detail(id)` nové `.overlay` a bez kontroly je přidával do `document.body`.
- **Oprava:** před otevřením dalšího detailu zavřít všechna dřívější okna `.overlay[data-hradnik-detail-context]` přes jejich stávající zavírací handler a odebrat je z DOM. Zachováno případné překreslení po změně oblíbených / navštívených / plánovaných památek, datum návštěvy ani ukládání účtu se nemění. Ostatních overlayů se to netýká.
- **Regresní test:** `tests/visual/hhradnik.spec.js` ověřuje tři postupné výběry jiných památek bez ručního zavření předchozích detailů, vždy maximálně **1** aktivní overlay, jediné závěrečné zavření a zachování změněného stavu první památky po znovuotevření; oba profily desktop/iPhone.
- **HEAD:** tento commit na `main` spolu s handoffem, rodič `1cb6c2fedb5bdd8f094131b29cef48c730daa21c`. Aktuální SHA lze zjistit na GitHubu.
- **Automatické ověření:** po pushi `Build Hradník` a `Hradník visual regression`; nehlásit PASS před skutečným výsledkem, případný FAIL vyřešit v rámci tohoto úkolu.
- **Ruční ověření:** PC + iPhone: otevřít první hrad, druhý a třetí; objeví se **vždy pouze poslední detail** a stačí jediný křížek. Ověřit i stav Chceme/Navštívili jsme/Oblíbené, když je před výměnou změněný.
- **Další krok:** počkat na mobilní screenshoty a potvrzení chování okna; poté HRA-P2-13 DONE 100 % a dokončit HRA-P3-01 (zatím **IN PROGRESS 95 %**) podle CSS auditu.
- **HRA-P2-10:** BLOCKED 10 %; starý ani nový Supabase projekt nepozměňovat.

- **CI po prvním commitu `c1fb7b32e1e95b9f9326e12e9b74294b4d5e0c7c`:** Build Hradník PASS, visual regression FAIL výhradně v novém testu střídání detailů: v seznamu měla oblíbená památka `Hrad Test ★`, ale správný název modalu je `Hrad Test`. Celkem 45 testů PASS, 7 skipped, 2 FAIL (desktop+iPhone stejného testu).
- **Oprava testu:** z očekávaného názvu karty se odstraní pouze prezentační hvězdička `★`; nadpis detailu musí dál přesně odpovídat názvu památky. Kontroly maximálně jednoho overlay, zavření a perzistence jsou nezměněné.
- **Aktuální HEAD opravy detailů:** `ab0b8941318ea5598636fd882af0e0de54469445` – oba CI workflow ověřeny **PASS** (Build run `39226337951`, Visual run `39226337994`), Vercel produkce **READY** pro stejnou SHA.
- **Navazující krok P3 CSS:** `b21663a35c38e8a9b7ff3eb2de3b1a365cf7f240` odstranil 27 shodných deklarací. Build Hradník **PASS** (run `39242283665`), visual regression **PASS** (run `39242283769`), Vercel produkce **READY** pro tento commit. HRA-P3-01 **IN PROGRESS 97 %** do ručního testu; detail HRA-P2-13 **VERIFY 95 %**.
- **2026-10-19 – navazující P3 krok 19:** z výchozího commitu `a7aa7b889415db43c130b8e4dd2190a736b8d7d1` odstraněno **22** přesných duplicit ve starší `reference-true.css`, pozdější deklarace beze změn. Commit `93cfa28905a7969b38519e60c4698fe024ed8db0` ověřen: Build **PASS** (run `39263869370`), visual regression **PASS** (run `39263868976`) a produkční Vercel **READY**. Kontrola pěti hlavních CSS vrstev nezjistila žádné další přesné shody stejného selektoru, breakpointu, vlastnosti a hodnoty. P3 **IN PROGRESS 98 %** čeká pouze na reálné ověření vzhledu a závěrečné schválení; Supabase beze změn.

---

# 5. Kompletní plán

## P0 – Kritické: funkční backend a bezpečná migrace

### HRA-P0-01 – Kompletně přepojit Hradník na nový Supabase
- **Stav:** DONE
- **Dokončeno:** 100 %
- **Potvrzeno:** jeden hostname pro runtime požadavky, šest uživatelských manuálních kontrol OK, statický CI guard doplněn. Build i visual regression PASS 20. 10. 2026.

**Audit / problém:**
Frontend stále používá starý Supabase projekt `cgshssdjgzzuprlwnabl`, zatímco aktuální samostatný projekt Hradníku je `abqiprdggptuxebhpfyi`. Staré API podle auditu vrací 404 a aplikace může místo obsahu zobrazit technickou chybu.

**Známé soubory s vazbou na starý Supabase:**
- `src/main.js`
- `src/enhancements.js`
- `src/info-ui.js`
- `account-ui.js`
- `admin.js`
- `quality-ui.js`

**Akceptace:**
- staré Supabase URL není v runtime kódu,
- katalog funguje proti novému projektu,
- aplikace načítá data z nového projektu,
- konzole neobsahuje 404 na starý projekt,
- žádná část aplikace se skrytě nepřipojuje ke starému projektu.

**Ruční ověření:**
- desktop,
- iPhone,
- anonymní režim / čistá cache.

---

### HRA-P0-02 – Centralizovat konfiguraci a Supabase klienta
- **Stav:** DONE
- **Dokončeno:** 100 %
- **Potvrzeno:** jeden browser `createClient` v `src/supabase.js`, sdílený `globalThis` slot, uživatelská stabilita přihlášení. DONE až po novém CI guard.

**Audit / problém:**
Supabase klient je vytvořený několikrát. Produkční konzole hlásí více instancí stejného auth klienta, což může způsobovat problémy s relací.

**Cíl:**
- jedna centrální konfigurace Supabase,
- jedna sdílená instance klienta,
- žádné natvrdo vložené URL/key v jednotlivých UI modulech.

**Akceptace:**
- jediný vlastník Supabase klienta,
- žádné varování o více auth instancích,
- auth relace je stabilní při přechodech mezi stránkami.

---

### HRA-P0-03 – Doplnit úplnou zakládací migraci databáze
- **Stav:** VERIFY
- **Dokončeno:** 98 %
- **Nedestruktivní audit 22. 10. 2026:** všech 9 tabulek, 106 sloupců, 14 SQL funkcí, 5 triggerů, 3 veřejné RLS politiky, 5 FK, 27 pojmenovaných indexů sedí proti živému schématu. Automatický offline schema guard přidán do `prebuild`. **Clean restore neproveden**; podrobnosti `docs/HRADNIK_P0_03_SCHEMA_AUDIT_2026-10-22.md`.

**Audit / problém:**
Současné migrace předpokládají, že tabulky už existují. Nový prázdný Supabase projekt nelze spolehlivě postavit pouze z repozitáře.

**Cíl:**
Repozitář musí být schopný založit Hradník od nuly.

**Migrace musí pokrýt zejména:**
- tabulky Hradníku,
- vazby / foreign keys,
- indexy,
- RLS,
- RPC / funkce,
- triggery,
- výchozí záznamy,
- případné storage bucket/policy požadavky,
- veškeré DB části potřebné pro auth a uživatelské funkce.

**Známé tabulky, které patří Hradníku:**
- `hradnik_sources`
- `hradnik_places`
- `hradnik_place_sources`
- `hradnik_sync_runs`
- `hradnik_sync_control`
- `hradnik_users`
- `hradnik_sessions`
- další `hradnik_*` části zjistit auditem starého projektu

**Akceptace:**
Čistý nový Supabase projekt lze postavit pouze z repozitáře bez ručních neveřejných SQL kroků.

---

### HRA-P0-04 – Prověřit a přepojit všechny služby navázané na Supabase
- **Stav:** DONE
- **Dokončeno:** 100 %
- **Ruční přejímka:** 22. 10. 2026 uživatel potvrdil „je to ok“ po požadavku otevřít obě produkční administrátorské obrazovky v režimu pouze prohlížení. Není tvrzeno samostatné fyzické ověření každého typu zařízení.
- **Ověřeno:** live negativní přístup bez tokenu: admin/list 403, quality/list 403, auth/session 401, migrační pomocník GET 410. CI `39477214791` PASS. To ověřuje pouze zamítnutí nepřihlášeného přístupu, ne pozitivní scénář se skutečným administrátorem.

**Zkontrolovat minimálně:**
- katalog,
- přihlášení,
- relace,
- účty,
- administrace,
- fotografie,
- storage,
- kontrola kvality,
- oblíbené,
- „chceme navštívit“,
- „navštívili jsme“,
- uživatelské seznamy a další uživatelský stav.

**Akceptace:**
Žádná funkce Hradníku nepotřebuje starý Supabase projekt.

---

### HRA-P0-05 – Bezpečný český fallback při chybě backendu
- **Stav:** DONE
- **Dokončeno:** 100 %
- **Potvrzení:** uživatel 6/6 kontrol včetně offline/fotek OK; Playwright české hlášení při čisté cache a IndexedDB katalog po HTTP 503 testuje na PC i iPhone.

**Audit / problém:**
Chybová obrazovka ukazuje syrovou anglickou databázovou chybu.

**Cíl:**
- uživateli zobrazit českou srozumitelnou hlášku,
- technickou chybu ponechat v konzoli/logu,
- pokud existuje poslední platný lokální katalog/cache, použít jej.

**Akceptace:**
Při nedostupném backendu aplikace nespadne do syrové DB hlášky.

---

### HRA-P0-06 – Zachování přihlášení při dočasném výpadku
- **Stav:** DONE
- **Dokončeno:** 100 %
- **Potvrzení:** běžné relace PC/mobil a obnovení uživatel potvrdil v 6/6 checklistech; Playwright kryje 503/401, přidané scénáře 403 a zamítnutého síťového requestu. Nejde o ruční simulaci výpadku.

**Závada:** Profilový modul při neúspěšném volání `session` bez rozlišení HTTP odpovědi odstraňoval token z `localStorage`, a to i při dočasné nedostupnosti backendu.

**Oprava:** Zůstat přihlášený při síťové chybě / 5xx; odhlásit pouze po 401/403. Po návratu serveru musí být možné znovu načíst profil bez opětovného přihlášení.

**Akceptace:** Automatické testy pro 503, 401 a URL nového backendu; uživatel na PC/iPhonu ověří, že přihlášení běžně přetrvá po restartu a fungují jeho seznamy. Žádné změny schématu databáze.

---

## P1 – Stabilita navigace a hlavních komponent

### HRA-P1-01 – Opravit mobilní navigaci jako jeden celek
- **Stav:** DONE
- **Dokončeno:** 100 %

**Audit / problém:**
Automatický test na iPhonu selhal při přechodu Oblíbené → Vyhledávání. Obsah zmizel a zůstala jen spodní navigace.

**Cíl:**
- právě jedna aktivní hlavní obrazovka,
- rychlé přepínání nesmí vytvořit prázdný stav,
- neopravovat pouze CSS, ale logiku routování / stavu.

**Akceptace:**
Opakované přechody:
Mapa → Seznam → Oblíbené → Vyhledávání → Kategorie → Mapa
fungují bez zmizení obsahu.

---

### HRA-P1-02 – Opravit spodní mobilní navigaci
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém ze screenshotů:**
- pátá položka „Kategorie“ nemá textový popisek,
- aktivní Kategorie má velký zlatý blok, ale bez textu,
- položky nemají zcela konzistentní rozměry/chování.

**Akceptace:**
Všech 5 položek má:
- ikonu,
- text,
- stejnou výšku/šířku,
- konzistentní aktivní stav.

---

### HRA-P1-03 – Safe area a nepřekrývat obsah spodní lištou
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Poslední obsah je na mobilu zakrytý fixed spodní navigací, např. poslední karta Kategorie.

**Cíl:**
Scrollovací obsah musí počítat s:
- skutečnou výškou spodní navigace,
- `env(safe-area-inset-bottom)` na iOS.

**Akceptace:**
Poslední karta/řádek lze vždy plně odscrollovat nad navigaci.

---

### HRA-P1-04 – Mobilní mapa má vyplnit dostupnou výšku
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Pod mapou zůstává velká prázdná černá plocha až ke spodní navigaci.

**Akceptace:**
Mapa vyplní dostupný prostor mezi hlavičkou a spodní navigací.

---

### HRA-P1-05 – Sjednotit typové ikony památek
- **Stav:** DONE
- **Dokončeno:** 100 %

**Audit / screenshoty:**
Mapa používá prakticky stejný hradní symbol pro různé typy památek, zatímco Kategorie už rozlišitelné ikony mají.

**Cíl:**
Stejný typový systém napříč:
- mapou,
- kartami,
- placeholderem bez fotky,
- kategoriemi,
- detailem.

**Akceptace:**
Hrad, zámek, zřícenina, tvrz, klášter a další podporované typy mají rozlišitelné ikony.

---

### HRA-P1-06 – Sjednotit komponentu fotografie / placeholderu
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém na desktopu:**
- velké šedé/prázdné bloky,
- u některých položek skutečná fotografie nahoře a pod ní další prázdný blok,
- mobil stejná data zobrazuje výrazně lépe.

**Cíl:**
Jedna responzivní komponenta:
- platná fotografie → správný náhled,
- chybějící fotografie → typový placeholder,
- žádné dvojité vrstvy a rezervované prázdné bloky.

---

### HRA-P1-07 – Opravit placeholdery bez fotografií
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Např. Hrádek u Nechanic / Lednice mají téměř černou ikonku na tmavém pozadí.

**Akceptace:**
Placeholder je jasně čitelný a používá správnou typovou ikonu ve vizuálním stylu Hradníku.

---

### HRA-P1-08 – Prověřit mapování polí v detailu památky
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
U „Zámek Hrádek u Nechanic“ je dlouhý text v sekci `STAV`, zatímco `POPIS` hlásí „Bez popisu“.

**Prověřit:**
- stav,
- popis,
- dochování,
- otevírací dobu,
- vstupné,
- oficiální informace,
- zdrojová pole.

**Akceptace:**
Každá UI sekce zobrazuje odpovídající datové pole.

---

### HRA-P1-09 – Zjednodušit frontendovou architekturu
- **Stav:** DONE
- **Dokončeno:** 100 %

**Audit / problém:**
- přes 20 skriptů na jedné stránce,
- velké množství CSS oprav,
- několik souběžných `MutationObserverů`,
- mnoho `!important`,
- náhodné blikání a rozdíly mezi mobilem a desktopem.

**Cíl:**
Určit jednoho vlastníka pro:
- navigaci,
- vykreslení karty,
- responsivní layout,
- hlavní stav aplikace.

Odstranit staré záplaty, které po opravě nejsou potřeba.

**Poznámka:**
Nejde o kompletní přepis aplikace. Jde o bezpečné odstranění kořenových konfliktů.

---

### HRA-P1-10 – Opravit responsivní filtry Seznamu/Vyhledávání
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Řada typových filtrů na mobilu přetéká doprava a poslední tlačítko je uříznuté.

**Rozhodnout a sjednotit:**
- korektní horizontální scroll, nebo
- responsivní zalamování.

**Akceptace:**
Žádné ovládací tlačítko není neúmyslně napůl mimo viewport.

---

### HRA-P1-11 – Stabilizovat select „Dochované + zříceniny“
- **Stav:** DONE
- **Dokončeno:** 100 %

**Audit / problém:**
V prvním auditu světlé písmo na téměř bílém pozadí. Na aktuálním screenshotu vypadá správně.

**Závěr:**
Pravděpodobně intermitentní konflikt CSS/stavu.

**Akceptace:**
Select má deterministický kontrast ve všech podporovaných stavech a na mobile/desktopu.

---


### HRA-P1-12 – Odstranit redundantní „Vyhledávání“ z hlavní navigace
- **Stav:** DONE
- **Dokončeno:** 100 %

**Rozhodnutí uživatele:**
Samostatná položka „Vyhledávání“ je zbytečná, protože pouze otevře hledání, které už je součástí obrazovky Seznam.

**Cíl:**
- desktop: Mapa · Seznam · Oblíbené · Kategorie · O aplikaci,
- mobilní spodní navigace: Mapa · Seznam · Oblíbené · Kategorie,
- „O aplikaci“ zůstává na mobilu dostupné z hamburger menu,
- horní vyhledávání / mobilní ikona lupy nadále otevře Seznam a zaměří jeho vyhledávací pole,
- žádná duplicitní samostatná stránka Vyhledávání.

**Akceptace:**
Build a visual-regression projdou a na PC/iPhonu nebude v hlavní navigaci položka „Vyhledávání“.

---

## P2 – Responsive, UX, konzole a testy

### HRA-P2-01 – Upravit desktopové karty
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
- příliš velké obrázkové plochy,
- při chybě vznikají velké prázdné obdélníky,
- grid nevyužívá efektivně šířku monitoru.

**Akceptace:**
Stabilní rozměry karet a obrázků, čitelný text, žádné obří prázdné bloky.

---

### HRA-P2-02 – Opravit „Nedávno zobrazené“ pod desktopovou mapou
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Karty jsou extrémně úzké a názvy se zkracují na několik znaků (`Jan...`, `Zno...`).

**Akceptace:**
Položka je identifikovatelná bez otevření detailu.

---

### HRA-P2-03 – Zkompaktnit mobilní hlavičku
- **Stav:** DONE
- **Dokončeno:** 100 %

**Viditelný problém:**
Horní oblast zabírá hodně vertikálního prostoru.

**Podmínka:**
Nejdřív opravit funkční problémy P0/P1, potom kompaktnost.

**Akceptace:**
Menší hlavička bez porušení iOS safe area a klikacích ploch.

---

### HRA-P2-04 – Sjednotit responzivní chování PC a mobilu
- **Stav:** DONE
- **Dokončeno:** 100 %

**Audit / screenshoty:**
Stejná data se na telefonu zobrazují správněji než na desktopu.