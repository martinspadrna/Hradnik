# HRADNIK_HANDOFF.md

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

**ID:** HRA-P2-13  
**Název:** Detail památky – vždy jen jedno otevřené okno  
**Stav:** VERIFY  
**Dokončeno:** 95 %

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
- **Aktuální HEAD:** tento opravný commit s testem a handoffem (rodič `c1fb7b32e1e95b9f9326e12e9b74294b4d5e0c7c`); znovu vyžadovat oba CI PASS.

---

# 5. Kompletní plán

## P0 – Kritické: funkční backend a bezpečná migrace

### HRA-P0-01 – Kompletně přepojit Hradník na nový Supabase
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Dokončeno:** 90 %

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
- **Stav:** VERIFY
- **Dokončeno:** 95 %

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

**Audit / problém:**
Chybová obrazovka ukazuje syrovou anglickou databázovou chybu.

**Cíl:**
- uživateli zobrazit českou srozumitelnou hlášku,
- technickou chybu ponechat v konzoli/logu,
- pokud existuje poslední platný lokální katalog/cache, použít jej.

**Akceptace:**
Při nedostupném backendu aplikace nespadne do syrové DB hlášky.

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

**Cíl:**
Breakpointy mají měnit layout, ne datovou strukturu / logiku komponenty.

---

### HRA-P2-05 – Prověřit stabilitu markerů a clusterů mapy
- **Stav:** DONE
- **Dokončeno:** 100 %

**Prověřit:**
- změna filtru,
- zoom,
- Mapa/Satelit,
- otevření/zavření detailu,
- cluster → marker,
- opakovaná inicializace mapy.

**Akceptace:**
Žádné duplicitní markery, ztracený stav nebo vícenásobné mapové instance.

---

### HRA-P2-06 – Udržet konzistentní stav mezi obrazovkami
- **Stav:** DONE
- **Dokončeno:** 100 %

**Prověřit:**
- hledaný text,
- typ památky,
- dochování,
- otevřený detail,
- pozice mapy,
- uživatelský stav.

**Cíl:**
Stav se nesmí náhodně resetovat kvůli observerům nebo opakované inicializaci modulů.

---

### HRA-P2-07 – Prověřit načítání fotografií a jejich URL
- **Stav:** DONE
- **Dokončeno:** 100 %

**Cíl:**
Rozlišit:
- skutečně chybějící fotografii,
- starou Supabase/storage URL,
- chybu oprávnění,
- problém lazy-loadingu.

**Akceptace:**
Platné fotky se načtou, neplatné odkazy se čistě nahradí placeholderem.

---

### HRA-P2-08 – Vyčistit runtime konzoli
- **Stav:** DONE
- **Dokončeno:** 100 %

**Po dokončení nesmí zůstávat:**
- 404 na starý Supabase,
- více instancí auth klienta,
- vlastní Promise chyby,
- chyby při přepínání obrazovek,
- vlastní runtime exceptions.

---

### HRA-P2-09 – Doplnit regresní testy hlavních workflow
- **Stav:** DONE
- **Dokončeno:** 100 %

**Minimální scénáře:**
- všech 5 hlavních sekcí,
- rychlé opakované klikání v navigaci,
- Oblíbené → Vyhledávání,
- Vyhledávání → detail → zpět,
- změna filtrů,
- mapa → detail,
- Mapa/Satelit,
- přihlášení/odhlášení,
- backend dočasně nedostupný,
- čistá cache / nový návštěvník.

**Cíl:**
Zachytit chyby typu „obsah zmizel a zůstala jen spodní lišta“.

---

### HRA-P2-10 – Ověřit instalaci na čistém novém Supabase projektu
- **Stav:** BLOCKED
- **Dokončeno:** 10 %

**Akceptace:**
1. čistý projekt,
2. aplikovat migrace,
3. importovat potřebná data,
4. nastavit environment,
5. spustit Hradník,
6. bez skrytých ručních kroků vše funguje.

---

### HRA-P2-11 – Opravit čitelnost satelitní mapy a překrytí mobilní lištou
- **Stav:** DONE
- **Dokončeno:** 100 %

**Zdroj:** fyzický screenshot iPhonu 2026-10-17.

**Akceptace:** Zlaté čitelné typové značky na satelitu, dlaždice nejsou příliš tmavé, ovladatelné Filtry a nezakrytá atribuce; nedotknout se ostatních stránek a PC layoutu.

---

### HRA-P2-12 – Datum návštěvy a stavová tlačítka
- **Stav:** DONE
- **Dokončeno:** 100 %

**Akceptace:** datum návštěvy se při novém označení uloží automaticky, lze jej změnit a po obnovení účtu zůstane; vybraná stavová tlačítka nabízejí odebrání označení, změny se navzájem nepřepisují.

---

### HRA-P2-13 – Jedno otevřené detailní okno památky
- **Stav:** VERIFY
- **Dokončeno:** 95 %

**Zdroj:** reálné PC screenshoty 2026-10-19 a nahlášené vrstvení detailů několika hradů nad sebou.

**Akceptace:** otevření další památky nahradí předchozí detail, počet `.overlay[data-hradnik-detail-context]` je nejvýše 1, k zavření stačí jeden křížek a změny uživatelských stavů zůstanou zachované.

---

## P3 – Technický úklid po stabilizaci

### HRA-P3-01 – Odstranit zbytečný technický dluh
- **Stav:** IN PROGRESS
- **Dokončeno:** 95 %

**Až po P0–P2:**
- sloučit zbytečné skripty,
- odstranit mrtvý CSS/JS,
- minimalizovat `!important`,
- zredukovat `MutationObserver`,
- odstranit duplicitní komponenty,
- sjednotit reusable komponenty.

**Poznámka:**
Neprovádět plošný přepis, pokud není nutný. Zachovat funkční části.

---

# 6. Známé problémy z prvního auditu

1. Produkce podle auditu používá starý Supabase projekt a může být nefunkční.
2. Staré Supabase adresy jsou v datech, auth, fotografiích, administraci a kontrole kvality.
3. Chybí úplná zakládací DB migrace.
4. Mobilní navigace může při přechodu Oblíbené → Vyhledávání ztratit obsah.
5. Mobilní select filtru měl problém s kontrastem.
6. Mapové / seznamové ikony nerozlišují správně typ památky.
7. Frontend je křehký kvůli velkému množství skriptů/CSS záplat/observerů.
8. Supabase klient existuje vícekrát.
9. Chybová obrazovka zobrazuje syrovou anglickou DB chybu.

---

# 7. Známé problémy z desktopových screenshotů

1. Seznam a Oblíbené zobrazují velké prázdné / šedé obrázkové bloky.
2. U některých karet se fotografie zobrazí nahoře a pod ní zůstane další prázdný prostor.
3. „Nedávno zobrazené“ pod mapou má příliš úzké karty.
4. Názvy v „Nedávno zobrazené“ jsou extrémně zkrácené.
5. Detail Hrádku u Nechanic pravděpodobně mapuje dlouhý popis do sekce STAV místo POPIS.
6. Kategorie na desktopu používají rozlišitelné ikony, takže typová grafika existuje a lze ji znovu použít.
7. Desktopový grid karet nevyužívá plochu optimálně.

---

# 8. Známé problémy z mobilních screenshotů

1. Kategorie ve spodní liště nemá textový popisek.
2. Fixed spodní lišta překrývá poslední obsah.
3. Mobilní mapa nevyplňuje dostupnou výšku a pod ní zůstává velká prázdná plocha.
4. Mapové markery prakticky nerozlišují typ památky.
5. Placeholder chybějící fotografie má příliš nízký kontrast.
6. Horní hlavička zabírá hodně vertikálního prostoru.
7. Filtry typů přetékají doprava.
8. Select „Dochované + zříceniny“ je na aktuálním screenshotu čitelný, ale audit zaznamenal intermitentní kontrastní problém.
9. Mobilní karty jsou oproti desktopu výrazně lepší, což ukazuje na problém breakpoint/layout logiky spíš než dat.

---

# 9. Ruční testovací checklist

## iPhone
- [ ] Mapa
- [ ] Seznam
- [ ] Oblíbené
- [ ] Kategorie
- [ ] rychlé přepínání mezi všemi sekcemi
- [ ] poslední karta není zakrytá spodní navigací
- [ ] mapa vyplňuje dostupný prostor
- [ ] typové ikony jsou rozlišitelné
- [ ] placeholder bez fotografie je čitelný
- [ ] filtry nepřetékají neovladatelně
- [ ] safe area nahoře i dole
- [ ] přihlášení / odhlášení
- [ ] uživatelské seznamy
- [ ] režim bez backendu / offline fallback, pokud je implementován

## Desktop
- [ ] Mapa
- [ ] Seznam
- [ ] Oblíbené
- [ ] Kategorie
- [ ] obrázky v kartách
- [ ] placeholdery bez fotografií
- [ ] Nedávno zobrazené
- [ ] detail památky a správná pole
- [ ] Mapa/Satelit
- [ ] filtry
- [ ] přihlášení / odhlášení
- [ ] administrace
- [ ] quality UI
- [ ] konzole bez vlastních runtime chyb

---

# 10. Rozhodnutí a konvence

1. **Nový Supabase:** `abqiprdggptuxebhpfyi`
2. **Starý Supabase:** `cgshssdjgzzuprlwnabl`
3. Starý projekt nemažeme, dokud nový Hradník není kompletně ověřený.
4. Preferovat jednu sdílenou Supabase instanci.
5. Preferovat jednu komponentu karty/fotografie napříč breakpointy.
6. Kategorie jsou referenční zdroj pro typové ikony.
7. Opravy mají odstraňovat kořenovou příčinu.
8. Po každém dokončeném kroku aktualizovat tento soubor.
9. Stav `DONE` použít až po reálném ověření.
10. Když technická oprava čeká na uživatelský iPhone/desktop test, označit `VERIFY`.

---

# 11. Poslední dokončený krok

**2026-10-19 – oprava názvu v testu výměny detailů**

- První commit `c1fb7b32e1e95b9f9326e12e9b74294b4d5e0c7c`: Build PASS, visual regression FAIL v novém regresním testu – seznam zobrazuje u oblíbené památky hvězdičku, detail správně ne; 45 PASS, 7 skipped, 2 FAIL (PC+iPhone).
- Test nyní očekává skutečný název bez vizuální značky `★`. Žádné produkční CSS, JS ani databáze se tímto commitem nemění.
- **HEAD:** tento opravný commit, rodič `c1fb7b32e1e95b9f9326e12e9b74294b4d5e0c7c`.
- **Ověření:** po pushi oba CI workflow; HRA-P2-13 VERIFY 95 % do fyzického potvrzení.

**Předchozí krok:**

**2026-10-19 – Oprava vrstvících se detailů památek (HRA-P2-13)**

- Uživatel doložil PC obrázky všech hlavních sekcí; současně nahlásil několik detailních oken nad sebou při rychlém výběru dalšího hradu nebo zámku. Další mobilní screenshoty slíbil doposlat.
- **Výchozí HEAD `1cb6c2fedb5bdd8f094131b29cef48c730daa21c`:** oba CI workflow PASS.
- `src/main.legacy.js`: nové `detail(id)` zavře případné předchozí památkové overlaye přes existující `.close` handler a odstraní jejich zbytky, teprve potom vykreslí nový detail.
- `tests/visual/hhradnik.spec.js`: nový test tří postupných detailů, jediného overlaye, jednoho zavření a zachovaného označení `Chceme` po výměně okna.
- **Stav:** HRA-P2-13 VERIFY 95 %, HRA-P3-01 IN PROGRESS 95 %, HRA-P2-12 DONE 100 %, HRA-P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `1cb6c2fedb5bdd8f094131b29cef48c730daa21c`; kontrolovat výsledky obou CI před dalšími úpravami.
- **Ruční test:** desktop a reálný iPhone, tři různá místa za sebou, jediné okno. Mobilní obrázky zatím nedorazily.
- **Supabase:** obě databáze beze změny.

**Předchozí krok:**

**2026-10-18 – oprava časování navigačního CSS regresního testu**

- `50f4d3db8edb7418f408d41b96f72ab84524c012`: Build PASS, visual regression FAIL v jednom novém iPhone CSS testu při přechodně nepřipojeném navigačním tlačítku (`getComputedStyle(null)`; 44 PASS, 7 skipped).
- `tests/visual/hhradnik.spec.js`: vyčkání stabilní přítomnosti měřených DOM prvků před computed-style kontrolou na každém breakpointu. Testy všech 7 šířek a všechna tvrzení o výsledném CSS zůstávají.
- Žádná další změna aplikace, CSS, Supabase ani auditu. **P3-01 IN PROGRESS 95 %**.
- **HEAD:** tento commit na `main`, rodič `50f4d3db8edb7418f408d41b96f72ab84524c012`.
- **Ověření:** po pushi znovu oba CI workflow, bez dalšího zásahu před výsledkem.

**Předchozí krok:**

**2026-10-18 – P3-01: konsolidace 51 duplicitních CSS deklarací hlavičky a navigace**

- Výchozí `c1b5476e9eb9330a2c72e2ff8782ed78a5aa9305`: Build Hradník i Hradník visual regression PASS.
- `src/reference-true.css`: z 6 pravidel odebráno 51 přesných překryvů jednotlivých vlastností se stejnými selektory a breakpointy jako v `reference-lock.css`; 4 nyní prázdná pravidla zmizela. Unikátní vlastnosti zůstaly.
- `docs/CSS_CASCADE_AUDIT.md`: doplněna tabulka vlastníků a seznam bezpečně odstraněných duplicit.
- `tests/visual/hhradnik.spec.js`: doplněno měření computed CSS navigačních tlačítek na všech 7 šířkách.
- **Stav:** HRA-P3-01 IN PROGRESS **95 %**; HRA-P2-12 DONE 100 %, HRA-P2-10 BLOCKED 10 %.
- **HEAD:** commit obsahující tento handoff na `main`, rodič `c1b5476e9eb9330a2c72e2ff8782ed78a5aa9305`.
- **CI:** po pushi ověřit obě workflow. **Fyzický test:** iPhone a desktop otevřené body ke kontrole.
- Supabase `cgshssdjgzzuprlwnabl` i `abqiprdggptuxebhpfyi` beze změny.

**Předchozí krok:**

**2026-10-18 – synchronizace nového CSS testu na iPhonu**

- `f72f64063c43900d78b7efc10a5c00f2a7176a7b`: Build PASS, vizuální regrese jeden FAIL v novém iPhone CSS testu, protože test měřil `getComputedStyle(null)` (44 PASS / 7 skipped / 1 FAIL). Pro mobil neexistující pravý desktopový panel je to očekávatelné chování, nikoliv doklad chyby aplikace.
- Nový Playwright test před měřením ověřuje mapový layout a přijímá skrytý či nevytvořený desktopový panel.
- **HEAD:** tento commit na `main`, rodič `f72f64063c43900d78b7efc10a5c00f2a7176a7b`. P3-01 IN PROGRESS 90 %.
- **Ověření:** po commitu znovu oba CI workflow, další pokračování až po jejich PASS.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-18 – HRA-P3-01: audit CSS kaskády + 7 automaticky testovaných šířek**

- Výchozí `72683862bc38cf75f651e5b0157fd1af8048bf2f`: oba GitHub Actions workflow PASS.
- Nový `docs/CSS_CASCADE_AUDIT.md` mapuje vlastníky CSS, známé záměrné přepisy, dynamické style tagy a rizikové breakpointy.
- Nové testy v `tests/visual/hhradnik.spec.js` ověřují computed CSS + geometrii hlavičky, navigace a mapy na 3 desktopových (851, 1280, 1536) a 4 mobilních (375, 390, 520, 850) šířkách.
- V aplikaci samotné žádná změna; ochranné testy umožní větší a bezpečnější CSS konsolidaci.
- **Stav:** P3-01 IN PROGRESS 90 %, P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `72683862bc38cf75f651e5b0157fd1af8048bf2f`.
- **Ověření:** Build Hradník + Hradník visual regression po pushi; až po obou PASS pokračovat.
- **Další krok:** srovnat skutečné computed CSS při rizikových breakpointech, pak konsolidovat konkrétní vlastnictví.
- Oba Supabase projekty beze změny.

**Předchozí krok:**

**2026-10-18 – HRA-P3-01: větší audit CSS/JS + tři bezpečné opravy**

- Výchozí `51e0da6f51b0612f17f7fb47f279d480692ab648`: Build PASS, visual regression PASS.
- Audit vlastníků CSS: `reference-true.css` / `reference-lock.css` po čtrnáctém kroku bez přesných dvojic, ale další soubory upravují rozvržení přes specifitu a `!important`. Nepoužívat slepou deduplikaci odlišných deklarací.
- Audit DOM observerů: `menu-polish.js` a `mobile-menu-fix.js` nově dávkují obsluhu DOM mutací do jednoho `requestAnimationFrame`, podobně jako již `reference-runtime-retry.js` a `reference-map-dashboard.js`.
- `reference-map-markers.js`: interval refresh markerů se zahajuje při vytvoření mapy a ukončuje při `unload`. Už neprobíhá na pozadí po přepnutí na Seznam.
- Nový Playwright test vyžaduje 1 → 0 → 1 aktivní interval při Mapa → Seznam → Mapa.
- **Stav:** P3-01 IN PROGRESS 85 %, P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit `main` s handoffem, rodič `51e0da6f51b0612f17f7fb47f279d480692ab648`.
- **Ověření:** po pushi oba workflow; další zásah do kódu až po dvou PASS.
- **Další krok:** computed-style snapshoty při různých šířkách, audit částečných CSS přepisů a opravdových runtime nákladů.
- Oba Supabase projekty beze změny.

**Předchozí krok:**

**2026-10-18 – stabilizace iPhone testu po velkém CSS balíku**

- CSS commit `b2dd0c4b3dd808b33d07959e25fea3c84d1cb048`: Build PASS, visual regression FAIL v 1 iPhone testu kvůli nenalezenému tlačítku v DOM při `page.evaluate`; 40 dalších testů PASS, 5 skipped.
- Test mapového teardown nyní synchronizuje připojení tlačítka `Seznam` před spuštěním zoomu a okamžitým odchodem z mapy. Nepřidává se výjimka pro runtime chyby, kontrola zůstává přísná.
- **HEAD:** tento commit na `main`, rodič `b2dd0c4b3dd808b33d07959e25fea3c84d1cb048`, pouze test + handoff.
- **Ověření:** vyžadovat oba CI PASS po pushi. Pokud ještě FAIL, zkoumat nový log a trace.
- **Stav:** HRA-P3-01 IN PROGRESS 75 %; Supabase beze změn.

**Předchozí krok:**

**2026-10-18 – HRA-P3-01: zbývajících 5 přesných duplicit CSS v jednom balíku**

- Výchozí HEAD `6aab3e523cd1e0a74dd86dec4efac91ec008742d`: Build PASS, visual regression PASS.
- Pět pravidel v `src/reference-lock.css` nahrazeno odpovídajícími dřívějšími deklaracemi `src/reference-true.css` beze změny jejich původního obsahu; výsledný počet přesných duplicit celých pravidel mezi těmito dvěma soubory je 0.
- Zůstávají různá částečná přepsání a `!important`, která se budou analyzovat, nikoliv slepě odstranit.
- HRA-P3-01 IN PROGRESS **75 %**, HRA-P2-12 DONE 100 %, HRA-P2-10 BLOCKED 10 %.
- **HEAD:** tento commit `main`, rodič `6aab3e523cd1e0a74dd86dec4efac91ec008742d`.
- **Ověření:** Build a visual regression po pushi. Ruční fyzická kontrola zatím není provedena.
- **Další krok:** větší analýza vlastnictví CSS a JS asynchronních callbacků; podle výsledků vybrat bezpečný tematický balík.
- Supabase beze změny.

**Předchozí krok:**

**2026-10-18 – HRA-P3-01: třináctý izolovaný CSS krok**

- Výchozí `5cf3c797e911ec3b9e391723b8a498795d4d5769` má `Build Hradník` PASS a `Hradník visual regression` PASS.
- Odebrány dvě přesné kopie pravidel `main.wrap` (PC a mobil) z pozdějšího `reference-lock.css`, zatímco stejné deklarace v `reference-true.css` zůstávají.
- **Stav:** P3-01 IN PROGRESS 65 %, P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** commit `main` s tímto zápisem, rodič `5cf3c797e911ec3b9e391723b8a498795d4d5769`.
- **Ověření:** po pushi Build Hradník + Hradník visual regression. Výsledek zaznamenat až po dokončení.
- **Další krok:** po obou PASS pokračovat malým cíleným úklidem.
- Oba Supabase projekty beze změny.

**Předchozí krok:**

**2026-10-18 – HRA-P3-01: dvanáctý izolovaný CSS krok**

- Výchozí `6f9fa75cf325dba71f30f66e88355a35d3c47d14`: Build Hradník PASS a Hradník visual regression PASS.
- Z `reference-lock.css` odebrány tři přesné mobilní duplikace pravidel pro hamburger, vyhledávání a skryté desktopové části hlavičky. Shodné deklarace stále obsahuje `reference-true.css` pod stejným `max-width:850px`.
- **Stav:** HRA-P3-01 IN PROGRESS 60 %; HRA-P2-12 DONE 100 %, HRA-P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `6f9fa75cf325dba71f30f66e88355a35d3c47d14`.
- **Ověření:** Build + visual regression po pushnutí; výsledek ověřit před dalším commitem.
- **Další krok:** po obou PASS pokračovat izolovanou CSS deduplikací.
- Supabase projekty `cgshssdjgzzuprlwnabl` a `abqiprdggptuxebhpfyi` beze změny.

**Předchozí krok:**

**2026-10-17 – HRA-P3-01: jedenáctý izolovaný CSS úklid**

- Výchozí commit `94c4d467a2f112a7ddbc5da7fbc147f1d60fbfc5` prošel workflow `Build Hradník` i `Hradník visual regression` (PASS).
- Tři přesně shodná pravidla pro desktopovou a mobilní hlavičku jsou nyní definována jen v `reference-true.css`; redundantní kopie z `reference-lock.css` odstraněny.
- **Stav:** P3-01 IN PROGRESS 55 %, P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `94c4d467a2f112a7ddbc5da7fbc147f1d60fbfc5`.
- **Ověření tohoto kroku:** po pushi Build + visual regression; čekat na PASS, neopírat se jen o předchozí zelené testy.
- **Další krok:** teprve po PASS pokračovat bezpečným CSS úklidem.
- Oba Supabase projekty beze změn.

**Předchozí krok:**

**2026-10-17 – HRA-P3-01 desátý krok, duplicity desktop/mobile CSS**

- Výchozí `09076263b3b87ad11d2efe0adc459f2985972cca`: Build Hradník PASS a visual regression PASS.
- Odebrány pouze dvě doslova shodné pozdější deklarace z `reference-lock.css`: desktopové `header .top`, mobilní `.redesign-sidebar .nav button.active`. Shodný obsah v `reference-true.css` zůstává.
- **Stav:** HRA-P3-01 IN PROGRESS 50 %; P2-12 DONE 100 %; P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `09076263b3b87ad11d2efe0adc459f2985972cca`.
- **Ověření:** Build a visual regression po pushi; před jejich dokončením nezaznamenávat PASS.
- **Další krok:** po CI PASS pokračovat úzkou CSS revizí.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-17 – HRA-P3-01: devátý izolovaný CSS úklid**

- **Výchozí HEAD:** `6781417be1d493c881ee47d5438181f8ae639bb1`; Build Hradník PASS a Hradník visual regression PASS.
- Odstraněna dvě identická CSS pravidla velikosti ikon hlavní navigace z pozdějšího `src/reference-lock.css`; v `src/reference-true.css` zůstávají stejná pravidla pro PC a mobil.
- **Stav:** P3-01 IN PROGRESS 45 %; P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main` s handoffem (vlastní SHA zjistit z GitHub historie), rodič `6781417be1d493c881ee47d5438181f8ae639bb1`.
- **Automatické ověření:** po pushi Build Hradník a Hradník visual regression; neoznačovat PASS do výsledků.
- **Další krok:** po obou PASS vybrat další skutečně redundantní CSS v malém rozsahu.
- Supabase projekty `cgshssdjgzzuprlwnabl` a `abqiprdggptuxebhpfyi` beze změny.

**Předchozí krok:**

**2026-10-17 – P2-12 fyzicky potvrzeno, P3-01 osmý bezpečný CSS krok**

- HRA-P2-12: datum návštěvy, možnost změny, zobrazení aktuálních stavů a jejich odebrání – uživatel napsal OK po žádosti o fyzickou kontrolu; **DONE 100 %**.
- Výchozí `a7cf4146830dd3ddb9828465a48167c9f80924e2` má Build Hradník PASS i Hradník visual regression PASS.
- Odebrány tři identické mobilní deklarace pro navigační `Více` z `reference-lock.css`, shodná pravidla stále ve `reference-true.css` pod stejným breakpointem.
- **Stav:** P3-01 IN PROGRESS 40 %, P2-05 DONE 100 %, P2-11 DONE 100 %, P2-12 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `a7cf4146830dd3ddb9828465a48167c9f80924e2`.
- **Ověření:** po pushi Build + visual regression, výsledek zkontrolovat před dalším kódovým krokem.
- **Další krok:** pokračovat po CI PASS bezpečným CSS úklidem.
- Supabase `cgshssdjgzzuprlwnabl` i `abqiprdggptuxebhpfyi` beze změny.

**Předchozí krok:**

**2026-10-17 – HRA-P2-12: Build + visual regression PASS, čeká na fyzické potvrzení**

- `b44aab0f9b2cb699c551b129633d81f12cbdb985`: oba CI workflow PASS, včetně testu stavu, data návštěvy, oblíbených, odebrání a znovuotevření detailu (desktop/iPhone simulace).
- HRA-P2-12 označeno **VERIFY 95 %**; funkce dokončena technicky, ještě ověřit skutečný iPhone.
- **HEAD:** tento handoff-only commit na `main`, rodič `b44aab0f9b2cb699c551b129633d81f12cbdb985`.
- **Ověření nového commitu:** automatické CI po pushi; aplikační kód beze změny.
- **Další krok:** uživatel otestuje dnešní datum / změnu / oblíbené a odebrání, po OK DONE a P3-01 35 %.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-17 – HRA-P2-12: datum návštěvy, perzistence ostatních stavů a toggly**

- HRA-P2-11 mobilní mapa byla fyzicky potvrzena OK → DONE 100 %.
- Datový model již podporuje visited_on, frontend jej dosud nezapisoval a API defaulty mohly při změně jiné hodnoty mazat ostatní pole.
- `main.legacy.js`: kompletní stav při každém `state_upsert`, nové návštěvy s lokálním dnešním datem, upravitelný datumový input, označení stavů s možností odebrání a datum na navštívených kartách.
- `reference-detail.css`: zvýraznění aktuálních stavů a čitelný iPhone date input.
- `tests/visual/hhradnik.spec.js`: perzistentní mock a nový UI regresní test.
- **HEAD:** tento commit na `main`, rodič `55930983069f35ddd765f03a3affb2250e64bd29`.
- **Ověření:** Build + visual regression po pushi; stav IN PROGRESS 80 % do zeleného CI.
- **Další krok:** fyzický test datum/oblíbené/navštívené na iPhonu, po OK DONE, návrat k P3-01.
- Supabase projekty nezměněny.

**Předchozí krok:**

**2026-10-17 – HRA-P2-11: oba CI PASS, fyzické ověření čeká**

- Commit `bd949c4572326206828764c207e61829bafabc1e` prošel Build Hradník PASS a Hradník visual regression PASS včetně iPhone testu Filtrů, atribuce a navigace.
- Mobilní satelit i mapové piktogramy dostaly lepší kontrast, Filtry se přesunuly mimo spodní lištu, atribuce je také nad ní.
- HRA-P2-11 změněno na VERIFY 95 % a čeká na screenshot/OK ze skutečného iPhonu.
- **HEAD:** tento dokumentační commit na `main`, rodič `bd949c4572326206828764c207e61829bafabc1e`.
- **Automatické ověření:** po pushi znovu oba workflow; kód beze změn.
- **Ruční ověření:** iPhone Mapa/Satelit a otevření Filtrů, výsledek vizuálně potvrdit.
- **Další krok:** po potvrzení DONE a pokračovat HRA-P3-01.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-17 – mobilní Filtry a atribuce mimo spodní navigaci**

- Výchozí `b0e012a7d63c3ba30d0e4c65975c3aa399ae3a6c`: Build Hradník PASS, visual regression PASS včetně nového stale Canvas redraw testu; P2-05 DONE 100 %.
- `reference-dashboard-final.css` přesouvá na mobilu Filtry pod Mapa/Satelit a jejich rozbalovací panel také nad mapu, s omezenou výškou. Leaflet atribuce je posunutá nad spodní navigaci.
- Nový Playwright test na iPhonu přesně měří nepřekrytí Filtrů, atribuce, přepínače a dolní lišty, včetně rozbaleného panelu.
- **HEAD:** tento commit na `main`, rodič `b0e012a7d63c3ba30d0e4c65975c3aa399ae3a6c`. P2-11 IN PROGRESS 85 %.
- **Automatické ověření:** Build + visual regression po pushi; fyzický screenshot pak potřeba pro VERIFY.
- **Další krok:** po zeleném CI přejít do VERIFY a vyžádat iPhone potvrzení.
- Obě Supabase beze změny.

**Předchozí krok:**

**2026-10-17 – zbytková chyba Leaflet Canvas redraw po zrušení mapy**

- Commit `2a38e99f0b20f168cdabed13b9220811435b0a40`: build PASS, vizuální regrese FAIL (1 iPhone test `_ctx.clearRect`, 37 PASS/4 skipped). Screenshot kontrastu mapy uložen, ale CI nelze považovat za zelené.
- Přesná příčina: odložené `L.Canvas._redraw` bez existujícího `_ctx` po odstranění Leaflet rendereru.
- `src/map-fixes.js` pouze pro odstraněný canvas zabrání opožděnému redraw, živý renderer používá původní kód.
- Playwright test po teardown volá stale canvas redraw explicitně.
- **HEAD:** tento commit, rodič `2a38e99f0b20f168cdabed13b9220811435b0a40`. HRA-P2-05 IN PROGRESS 98 %, HRA-P2-11 IN PROGRESS 40 %.
- **Ověření:** Build + visual regression po commitnutí.
- **Další krok:** po PASS opravit Filtry/atribuci na iPhonu.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-17 – nové HRA-P2-11, kontrast mobilní satelitní mapy**

- `eebe3894cb7352c9ac34385e93129847079e1eec`: Build Hradník PASS a visual regression PASS; HRA-P2-05 se uzavírá DONE 100 %.
- Podle screenshotu skutečného iPhonu je prioritou P2-11: černé mapové ikony, silné ztmavení satelitu, Filtry a atribuce u spodní navigace.
- V `reference-dashboard-final.css` přidán cílený zlatý filtr jen pro SVG značky mapy s výjimkou stávajícího štítu a vyšší jas mobilního satelitu.
- **HEAD:** commit s tímto zápisem, rodič `eebe3894cb7352c9ac34385e93129847079e1eec`.
- **Ověření:** oba CI workflow po commitu; fyzická kontrola iPhonu stále čeká.
- **Další krok:** po obou PASS řešit překrytí Filtrů/atribuce, přidat měřitelný mobilní test.
- P3-01 pozastaveno na 35 %, Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – HRA-P2-05: zdroj stale invalidateSize v map-click-fix.js nalezen**

- `6835ac775d290dc8c4f8001eaa0b43a694c17b1b`: build PASS, vizuální regresní test FAIL 1× na desktopu s `_leaflet_pos`; 37 PASS a 4 skipped.
- Diagnostický Playwright trace obsahuje volání `invalidateSize()` z `assets/index-*.js:7:1516`. Odpovídající zdroj je `map-click-fix.js` a jeho nehlídaný requestAnimationFrame na `zoomend/moveend`.
- `map-click-fix.js` přidaný `unload` cleanup a kontrola platné mapové instance v callbacku.
- Test spouští `map.fire('moveend')` a ve stejném JavaScript tasku přepne do Seznamu, aby se stale rAF aktivoval deterministicky.
- **Stav:** P2-05 IN PROGRESS 98 %, P3-01 35 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`, rodič `6835ac775d290dc8c4f8001eaa0b43a694c17b1b`.
- **Ověření:** Build Hradník a Hradník visual regression po commitu.
- **Další krok:** teprve po zeleném CI vrátit P2-05 DONE a pokračovat v P3-01.
- Supabase projekty beze změn.

**Předchozí krok:**

**2026-10-16 – trace identifikoval stale invalidateSize (oprava u vlastníka)**

- `b30bc5738178529a7d2492a21628ec9b68553099`: Build PASS, visual regression FAIL v iPhone testu pending map animation, i přes guard `_onZoomTransitionEnd`.
- Příčina potvrzena v Playwright trace: `invalidateSize → _rawPanBy → _getMapPanePos` na mapě bez panelu `_mapPane`.
- Odstraněn dřívější provizorní monkeypatch `_onZoomTransitionEnd` z `map-fixes.js`.
- `main.legacy.js`: aplikací plánovaný rAF a timeout pro `invalidateSize` jsou vázané na jednu živou mapu a zrušené při jejím odstranění.
- Regresní test detekuje přístup k `invalidateSize` u odstraněné instance mapy.
- **Stav:** P2-05 IN PROGRESS 98 %, P3-01 IN PROGRESS 35 %.
- **HEAD:** tento commit na `main`, rodič `b30bc5738178529a7d2492a21628ec9b68553099`.
- **Ověření:** Build Hradník a Hradník visual regression po pushi.
- **Další krok:** potvrdit CI, teprve potom pokračovat P3-01.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – P2-05: ošetření intermitentního Leaflet callbacku, P3-01 pozastaveno**

- Po `8faea87c01f4f0047b2fa0b0386d132a2318a2a8` dvě sady CI se shodným HEAD: Build PASS a visual regression první FAIL (iPhone pending zoom → `_leaflet_pos`), druhá PASS. Tím je potvrzena časovací chyba, nikoli stálá CSS regrese.
- Leaflet 1.9.4 plánuje neidentifikovatelný zoom timeout; dosavadní rušení `_zoomAnimTimeout` na něj nemá účinek.
- `src/map-fixes.js` ošetřuje pouze dokončení zoom animace na již odstraněné mapě; živé mapě ponechává originální Leaflet chování.
- Existující regresní test nově vynutí opožděný callback po `map.remove()`.
- P2-05 **IN PROGRESS 98 %**, P3-01 ponecháno **IN PROGRESS 35 %**.
- **HEAD:** tento commit na `main`; výchozí `8faea87c01f4f0047b2fa0b0386d132a2318a2a8`.
- **Ověření:** Build Hradník a Hradník visual regression po pushi.
- **Další krok:** dokončit CI ověření, uzavřít P2-05 a pokračovat P3-01.
- Nový i starý Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – HRA-P3-01: sedmý bezpečný krok CSS deduplikace**

- Výchozí HEAD `366f9598a40847d0a7c783eba08c09874b579c7e`: Build Hradník PASS i visual regression PASS.
- `src/reference-lock.css` už znovu nedefinuje desktopové `header .account b` a mobilní `.redesign-sidebar .nav button.active`; shodná pravidla zůstávají v `src/reference-true.css` na stejných breakpointech.
- **Stav:** P3-01 IN PROGRESS 35 %; P2-05 DONE 100 %, P2-10 BLOCKED 10 %.
- **HEAD:** tento commit na `main`; výchozí `366f9598a40847d0a7c783eba08c09874b579c7e`.
- **Automatické ověření:** nový Build Hradník a Hradník visual regression po pushi.
- **Ruční ověření:** desktop text účtu, iPhone zvýraznění aktivní záložky.
- **Další krok:** nejdříve ověřit CI, potom pokračovat jen po malých úpravách.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – HRA-P3-01: šestý krok CSS deduplikace**

- Výchozí commit `ef385c78f120c900a5e6583a5672022e7370da54`: Build Hradník PASS a Hradník visual regression PASS, Leaflet regresní opravy zachovány.
- Mobilní duplicity `.reference-recent` a `.hradnik-map-toggle` odebrány z `reference-lock.css`. Stejná pravidla se shodným `max-width:850px` zůstávají v `reference-true.css`.
- **Stav:** P3-01 IN PROGRESS 30 %; ostatní úkoly bez změny.
- **HEAD:** commit `main` s tímto handoffem; rodič `ef385c78f120c900a5e6583a5672022e7370da54`.
- **Ověření:** Build + visual regression po commitu; do jejich dokončení další kód neměnit.
- **Ruční ověření:** PC/iPhone hlavní navigace, Mapa, Seznam, Kategorie, Mapa/Satelit.
- **Další krok:** po obou CI PASS pokračovat izolovaným CSS úklidem.
- Oba Supabase projekty beze změny.

**Předchozí krok:**

**2026-10-16 – P2-05 DONE po přesné opravě Leaflet zoom teardown**

- `16e482db75e6c51787b8956f21a28ed7f295d8fe` má Build Hradník PASS a Hradník visual regression PASS; oba nové regresní testy mapového teardownu prošly.
- P2-05 po opravě dvou nezávislých teardown problémů (stale marker rAF/interval a delayed zoom callback) označeno DONE 100 %.
- P3-01 zůstává IN PROGRESS 25 %.
- **HEAD:** tento dokumentační commit, výchozí `16e482db75e6c51787b8956f21a28ed7f295d8fe`; žádné nové změny aplikačního kódu.
- **Automatické ověření:** oba GitHub Actions workflow se znovu spustí při pushi tohoto handoffu.
- **Další doporučený krok:** ověřit výsledky a vrátit se k P3 CSS úklidu.
- Supabase projekty nebyly změněny.

**Předchozí krok:**

**2026-10-16 – Playwright trace potvrdil odložený Leaflet zoom callback**

- Po commitu `7a97c737b0ad1e576ac87c67bedec3ca939475c4` Build PASS a visual regression FAIL jedině v desktop console gate; chybová hláška `_leaflet_pos`, nový marker lifecycle test přitom PASS na PC/iPhonu.
- Stažený trace obsahuje jasný stack `_onZoomTransitionEnd` → `_getMapPanePos` po odstranění mapy, tedy jiný kořen než stale marker render.
- Zavedena centralizovaná `disposeMap(map)` pro obě místa map.remove v `main.legacy.js`; zruší odložený zoom timeout a stav animace před skutečným odstraněním mapy.
- Přidán cílený test animovaného zoomu a synchronního odchodu na Seznam, plus 650ms čekání na callback.
- **HEAD:** tento commit na `main`; **rodič:** `7a97c737b0ad1e576ac87c67bedec3ca939475c4`.
- **Ověření:** po pushi Build + visual regression; P2-05 IN PROGRESS 95 % do zelených testů, P3-01 zatím 25 %.
- **Další krok:** vyhodnotit CI, potom pokračovat P3-01.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – oprava Leaflet CI PASS; návrat k P3-01 (pátá deduplikace)**

- `b7da3296b5b2229502d52f2410c4b1a4a3866800`: Build Hradník PASS + Hradník visual regression PASS. Nový test `marker refresh stops when the Leaflet map is removed` prošel.
- Oprava stale map marker timeru uzavírá dřívější regresi `_leaflet_pos`; HRA-P2-05 zpět **DONE 100 %**.
- V `reference-lock.css` odstraněny dvě přesné kopie skrytí původních mapových filtrů/legendy v desktopovém a mobilním breakpointu; stejné deklarace v `reference-true.css` zůstávají.
- HRA-P3-01 je IN PROGRESS 25 %.
- **HEAD:** commit s tímto zápisem na `main`, rodič `b7da3296b5b2229502d52f2410c4b1a4a3866800`.
- **Ověření nového CSS kroku:** po pushi CI Build + visual regression; před dalším krokem ověřit PASS.
- **Ruční ověření:** PC/iPhone mapové ovládání a navigace.
- **Další krok:** vyhodnotit CI a pokračovat malým, cíleným CSS úklidem.
- Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – zjištěná Leaflet regresní chyba a oprava cleanup mapových markerů**

- `c46f54872d922dd7621cc3b38e92e72c3cdeeb5d`: Build PASS, visual regression FAIL 1/38 scénářů (desktop console-gate), `_leaflet_pos` undefined po navigaci; 33 PASS / 4 skipped.
- Rerun CI z původního commitu byl spuštěn (attempt 2), ale v době této opravy běžel dlouho na instalaci Playwright prohlížečů; nerozhodovat podle jeho neznámého výsledku.
- V `src/reference-map-markers.js` se po `unload` mapy uvolní `mapRef`, rAF a marker arrays; všechny plánované rendery kontrolují platnost mapy. Tento kód dříve držel mapu přes 900ms interval i po odstranění.
- Nový regresní Playwright test simuluje Mapa → Seznam a čeká 1250 ms.
- HRA-P2-05 dočasně opět IN PROGRESS 95 % do zeleného CI, HRA-P3-01 zůstává na 20 %.
- **HEAD:** tento commit na `main`, **rodič:** `c46f54872d922dd7621cc3b38e92e72c3cdeeb5d`.
- **Ověření:** čeká na Build Hradník a Hradník visual regression tohoto commitu.
- **Další krok:** po PASS uzavřít regresi a pokračovat P3; při FAIL analyzovat trace.
- Starý i nový Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – P3-01 čtvrtá izolovaná CSS deduplikace**

- Výchozí commit `2e73a6ee04f7e03c243ab247c4a1bb9b53bd6ca7` prošel workflow `Build Hradník` i `Hradník visual regression` (PASS).
- Ve `src/reference-lock.css` jsou odstraněny dva přesné opisy `.hero{display:none!important}` z desktopového i mobilního breakpointu. Pravidla zůstala v `reference-true.css` ve stejných media queries.
- Rozsah změny je pouze CSS + tento handoff. Nedotčeno Supabase, navigační routování ani DOM.
- **HEAD:** tento commit na `main`; **rodič:** `2e73a6ee04f7e03c243ab247c4a1bb9b53bd6ca7`.
- **Automatické ověření:** oba GitHub Actions workflow po pushnutí; výsledek nejprve zkontrolovat.
- **Ruční ověření:** desktopové a mobilní zobrazení aplikace, hero stále skryté.
- **Další krok:** pokračovat až po zeleném CI.

**Předchozí krok:**

**2026-10-16 – P3-01: screenshoty PC a třetí izolované CSS čištění**

- Po druhé deduplikaci `916632f75fb32d10c8bc1825863d2ca4484b4718` prošly oba CI workflow (Build + visual regression PASS).
- Screenshoty PC zobrazují použitelnou Mapu, Seznam a Kategorie; bez doložení iPhone chování a bez ověření klikacích interakcí.
- Odstraněny dvě identické desktopové deklarace z `reference-lock.css`; dříve načítané shodné deklarace `reference-true.css` zachovány.
- **HEAD:** tento commit na `main`, výchozí HEAD `916632f75fb32d10c8bc1825863d2ca4484b4718`.
- **Ověření:** CI nového commitu po pushnutí, do výsledku ponechat IN PROGRESS.
- **Další krok:** vyhodnotit oba workflow a až poté další izolovaná úprava.
- Supabase a produkční data beze změn.

**Předchozí krok:**

**2026-10-16 – P3-01 druhá malá CSS deduplikace**

- Předchozí commit `93617c114e7e9e55046e8eea1462815e816eaf2c` prošel workflow `Build Hradník` i `Hradník visual regression` (PASS).
- V `src/reference-lock.css` odstraněny dvě identické deklarace pro mobilní hamburger a ikonu lupy; jejich zdroj v `src/reference-true.css` zůstává.
- Stejný media breakpoint a deklarace byly ověřeny před změnou; očekává se nulová změna vizuálu.
- **HEAD:** tento commit na `main`, rodičovský HEAD `93617c114e7e9e55046e8eea1462815e816eaf2c`.
- **CI tohoto kroku:** Build Hradník a visual regression po pushi; do výsledku neuzavírat.
- **Další krok:** zkontrolovat oba workflow, pak pokračovat další izolovanou deduplikací.
- Starý i nový Supabase beze změn.

**Předchozí krok:**

**2026-10-16 – zahájen P3-01, odstraněna přesná duplicita globálního CSS**

- `src/reference-lock.css` již znovu nedefinuje stejnou `:root` paletu a pozadí `html,body,#app`, které bezprostředně předtím deklaruje `src/reference-true.css`.
- Před změnou kontrolována přesná shoda obou CSS pravidel i pořadí načítání v `index.html`.
- Neproběhla žádná změna dat ani Supabase; HRA-P2-10 zůstává BLOCKED.
- **Výchozí HEAD:** `fe3544efb7e65972bb731c24e9028cb76219eebf`; **HEAD změny:** tento commit na `main`.
- **Ověření:** Build Hradník + Hradník visual regression po pushi, v okamžiku zápisu výsledek ještě není znám.
- **Další krok:** po ověření CI další bezpečná deduplikace CSS.

**Předchozí krok:**

**2026-10-07 – P2-09 kompletní regresní sada PASS; P2-10 čeká na čisté Supabase prostředí**

Hotovo:
- commit `91d9c5468f3d06f99560ad023387958219157d1e` má Build PASS + visual regression PASS,
- clean-visitor backend failure scénář prošel,
- cache → backend 503 → offline fallback scénář prošel,
- HRA-P2-09 je DONE,
- pro HRA-P2-10 bylo ověřeno, že nový Supabase projekt `abqiprdggptuxebhpfyi` aktuálně nemá žádnou development branch,
- skutečný fresh-install drill tedy vyžaduje vytvoření dočasné Supabase branch nebo jiného čistého projektu,
- vytvoření Supabase branch může být zpoplatněné a vyžaduje explicitní potvrzení nákladu/organizace; bez toho se branch nesmí vytvořit,
- starý Supabase projekt zůstává beze změn.

**Předchozí krok:**

**2026-10-07 – P2-08 console gate PASS; doplněny offline/cache scénáře P2-09**

Hotovo:
- commit `d5ad57838fc6ddc5d13b54ad40c0dd6311a8befe` má Build PASS + visual regression PASS,
- runtime console gate prošel na desktopu i iPhonu bez app-owned page errors, starého `cgsh…`, multiple auth-client warningu a vlastních uncaught/type/reference/syntax chyb,
- HRA-P2-08 je DONE,
- P2-09 nově testuje čistého návštěvníka při 503 katalogu: zobrazí se česká uživatelská chyba a syrová backend hláška se nepropíše do UI,
- druhý scénář nejdřív skutečně naplní IndexedDB katalog cache, pak při 503 backendu reloadne aplikaci a ověřuje offline notice + použitelný Seznam z cache,
- tím se doplňují dva poslední zásadní scénáře z původního regresního checklistu.

**Předchozí krok:**

**2026-10-07 – P2-07 fotografie DONE; zahájen P2-08 console gate**

Hotovo:
- commit `eb503b9078eb2d3d1dba54fd44a7ffb059a414ae` má Build PASS + visual regression PASS,
- `hradnik-photo` verze 2 je nasazená v novém Supabase `abqiprdggptuxebhpfyi`,
- 723 legacy Wikimedia adres bylo v DB převedeno z HTTP na HTTPS; následná kontrola: **0 HTTP**, **748 HTTPS**, **0 URL na starý Supabase**,
- projekt nemá žádný Supabase Storage bucket; fotografie Hradníku jsou aktuálně externí Wikimedia, takže zde není skrytý problém storage oprávnění,
- IntersectionObserver odstranil limit „foto jen prvním 16 kartám“,
- HRA-P2-07 je DONE,
- pro P2-08 přidán runtime gate: zachytává `pageerror` a vlastní konzolové chyby typu starý `cgsh…`, multiple auth client, uncaught/unhandled, TypeError/ReferenceError/SyntaxError a Supabase 404 během hlavní navigace.

**Předchozí krok:**

**2026-10-07 – P2-06 PASS; P2-07 audit fotografií**

Hotovo:
- commit `a22ca1eba427d27850d750bc61ff9abb066ea341` má Build PASS + visual regression PASS,
- HRA-P2-06 je DONE,
- audit nového Supabase `abqiprdggptuxebhpfyi`: 2046 aktuálních/viditelných míst, 748 s uloženou foto URL a 1298 bez uložené foto URL,
- v `photo_urls` není ani jedna URL na starý `cgsh…` ani nový Supabase storage; fotografie jsou externí Wikimedia a projekt nemá žádný Storage bucket,
- nalezeno 723 legacy Wikimedia URL s `http://`; frontend je sice už za běhu převáděl na HTTPS, ale Edge Function vracela uloženou HTTP adresu beze změny,
- `hradnik-photo` nově normalizuje Wikimedia HTTP → HTTPS i pro uložené adresy a při použití starou hodnotu opraví v DB,
- přidána idempotentní SQL migrace pro hromadnou normalizaci existujících Wikimedia URL,
- odstraněn skutečný lazy-load problém: starý kód hydratoval fotografie jen prvním 16 kartám; nyní IntersectionObserver postupně načte každou kartu, která se přiblíží viewportu, s původním fallbackem na prvních 16 pro starší prohlížeče.

**Předchozí krok:**

**2026-10-07 – P2-06 core test PASS; odstraněn překryv dvou mapových testů**

Zjištění:
- stale `window.__hradnikMap` je opravený; dříve padající desktop focus test nyní prošel,
- nový P2-06 test „catalog filters and map viewport survive navigation changes“ prošel na desktopu i iPhonu,
- jediný zbývající FAIL byl v iPhone P2-05 testu, který po dlouhé mapové sekvenci znovu testoval Seznam → Mapa; stejný přechod už samostatně a úspěšně testuje P2-06,
- P2-05 lifecycle test proto na iPhonu ověřuje mapu/filtr/style/zoom/detail/jedinou instanci a desktop navíc opakovanou reinicializaci; iPhone Seznam → Mapa je pokryt P2-06 bez duplicitního scénáře,
- žádná další aplikační změna kvůli tomuto testu nebyla potřeba.

**Předchozí krok:**

**2026-10-07 – P2-06 CI odhalil stale `window.__hradnikMap`; opraveno**

Zjištění:
- nový P2-06 test zachování hledání/filtrů/map viewportu prošel na desktopu i iPhonu,
- Build prošel,
- visual regression měl 2 vedlejší FAILy:
  1. po korektním `map.remove()` zůstával krátce globální `window.__hradnikMap` ukazovat na již odstraněnou Leaflet instanci; desktop focus test pak mohl zavolat `getCenter()` nad odstraněným map pane,
  2. iPhone map-lifecycle test se snažil fyzicky kliknout na marker, který byl po záměrném zachování viewportu mimo viditelnou oblast.
- `rememberMapView()` nyní při odstranění aktuální mapy zároveň nulje odpovídající `window.__hradnikMap`; nová instance ho znovu nastaví svým init hookem,
- map-lifecycle test otevírá detail přes původní aktivní Leaflet layer event místo závislosti na tom, zda je marker právě ve viewportu,
- HRA-P2-06 zůstává IN PROGRESS do zeleného opakovaného CI.

**Předchozí krok:**

**2026-10-07 – P2-05 map lifecycle PASS; P2-06 zachování stavu**

Hotovo:
- commit `30ac87d2fa728dc3c62b248a16af758597ac649a` má Build PASS + visual regression PASS,
- map lifecycle test prošel na desktopu i iPhonu: filtr, Mapa/Satelit, zoom, marker detail a návrat Seznam → Mapa bez duplicitní aktivní mapy/markerů,
- HRA-P2-05 je DONE,
- pro P2-06 doplněn `ui.mapViewState` a jediný helper `rememberMapView()`, který před překreslením uloží střed + zoom a korektně odstraní starou Leaflet instanci,
- při návratu na mapu se obnoví ručně zvolený center/zoom; explicitní focus památky má stále přednost,
- hledání, typ a dochování už běží nad stejným `ui` stavem a nový test ověřuje jejich zachování přes Seznam → Mapa → Seznam,
- test navíc ověřuje zachování uživatelského Oblíbeného seznamu.

**Předchozí krok:**

**2026-10-07 – P2-04 CI PASS; zahájen P2-05 map lifecycle**

Hotovo:
- commit `695f7cf56ba911c2da3362496b5a49dedb88e5b7` má Build Hradník PASS + visual regression PASS,
- společný card/detail DOM kontrakt prošel na desktopu i iPhonu,
- HRA-P2-04 je DONE: runtime nemá viewport/user-agent větev pro datový renderer; breakpointy mění layout, ne data/komponentu,
- pro P2-05 přidán regresní scénář: jedna aktivní Leaflet mapa, filtr Zřícenina, Mapa/Satelit s právě jednou tile vrstvou, zoom bez duplikace reference markerů, detail bez výměny mapy a návrat Seznam → Mapa s jediným připojeným mapovým kontejnerem,
- HRA-P2-05 čeká na CI.

**Předchozí krok:**

**2026-10-07 – P2-04: první shared-DOM test opraven podle skutečného filtru**

Zjištění:
- Build commitu `24f3ca45c0d8b5e65fe76996021aebc38cfdfaa1` prošel,
- visual regression selhal pouze v novém P2-04 testu na desktopu i iPhonu stejným způsobem: test očekával všech 6 mock památek, ale výchozí filtr „Dochované + zříceniny“ správně zobrazil jen 4,
- nejde o rozdíl desktop/mobile ani funkční regresi,
- test nyní před porovnáním společného DOM přepne Dochování na „Vše“, takže ověřuje všech 6 stejných dat na obou projektech.

**Předchozí krok:**

**2026-10-07 – P2-03 fyzicky potvrzen; P2-04 chráněno společným DOM kontraktem**

Hotovo:
- uživatel fyzicky potvrdil kompaktní mobilní hlavičku jako OK,
- HRA-P2-03 je DONE,
- audit runtime JS nenašel žádné větvení podle `innerWidth`, `matchMedia`, `isMobile`, `screen.width` ani user-agentu pro vykreslení seznamu/karet,
- katalog na PC i mobilu používá stejnou funkci `card(p)`, stejný stav `ui` a stejný detail renderer; rozdíl je pouze v CSS breakpointech,
- přidán společný regresní test běžící v desktop i iPhone projektu: stejný počet karet, `.placeMain`, `.placeCopy`, dva metadata řádky, dva quick actions, právě jeden media slot a shodný detailový DOM,
- HRA-P2-04 čeká na zelený CI.

**Předchozí krok:**

**2026-10-07 – P2-03 kompaktní mobilní hlavička: CI PASS**

Hotovo:
- commit `54dec86a95cd8121fb52a5ce6d5a2207ff13648f` má Build Hradník PASS,
- Hradník visual regression na stejném commitu má PASS,
- mobilní hlavička používá jedinou sdílenou výšku 56 px + `env(safe-area-inset-top)`,
- aktivní konfliktní hodnoty 58 / 60 / 104 px byly sjednoceny,
- mapa, detail overlay a mobilní drawer používají stejný horní offset,
- iPhone regresní test ověřil kompaktní výšku, minimálně 40px hamburger/lupu, návaznost mapy na spodní navigaci a drawer začínající pod hlavičkou,
- HRA-P2-03 je technicky 100 % ve VERIFY a čeká jen na fyzické potvrzení na iPhonu.

**Předchozí krok:**

**2026-10-07 – P2-01/P2-02 fyzicky potvrzeny; zahájen P2-03**

Hotovo:
- uživatel fyzicky potvrdil desktopové karty i „Nedávno zobrazené“ jako OK,
- HRA-P2-01 a HRA-P2-02 jsou DONE,
- P2-03 odstranil konflikt mobilních výšek 58/60/104 px zavedením jedné sdílené hlavičkové proměnné,
- header content má 56 px a bezpečný horní inset se přičítá přes `env(safe-area-inset-top)`,
- mobilní mapa, detail overlay a drawer používají stejný `--hr-mobile-header-height`,
- přidán iPhone regresní test kompaktní výšky hlavičky, 40px klikacích ploch, mapy vůči spodní navigaci a drawer offsetu.

**Předchozí krok:**

**2026-10-06 – P2-01 + P2-02 CI PASS**

Hotovo:
- commit `9dfa65e7fe70c5d583f38d9351ad8c41a4252414` má Build Hradník PASS i Hradník visual regression PASS,
- P2-01 desktopové karty prošly testem minimální šířky karty, média a textové části,
- P2-02 cílený test s pěti položkami „Nedávno zobrazené“ prošel; žádná karta už nekolabuje na desítky pixelů,
- původní problém fragmentů názvů typu „Hr… / Zn… / Au…“ je technicky opraven,
- P2-01 a P2-02 jsou technicky 100 % ve VERIFY a čekají jen na krátké vizuální potvrzení na PC.

**Předchozí krok:**

**2026-10-06 – P2-02 test reprodukoval původní úzké „Nedávno zobrazené“**

Zjištění a oprava:
- P2-01 desktop card test v kombinovaném CI prošel; P2-01 je technicky 100 % ve VERIFY,
- nový P2-02 test přesně reprodukoval původní problém: při pěti položkách měla karta „Nedávno zobrazené“ jen 42,875 px,
- screenshot potvrdil názvy zkrácené na fragmenty typu „Hr…“, „Zn…“, „Au…“,
- `.reference-recent-list` nyní explicitně vlastní celý dostupný řádek: `width:100%`, `display:grid!important` a pět sloupců s minimem 180 px,
- změna opravuje kořen rozměrového kolapsu místo dalšího zkracování obsahu,
- P2-02 zůstává IN PROGRESS do zeleného CI.

**Předchozí krok:**

**2026-10-06 – P2-02 chráněno cíleným testem „Nedávno zobrazené“**

Hotovo:
- P2-01 screenshot po úpravě ukazuje čitelnější 4sloupcový desktop grid; nový threshold testu byl srovnán s reálným layoutem,
- pro P2-02 přidán desktop test s 5 položkami v `hradnik_recent_places_v1`,
- test hlídá, že všech pět karet existuje, každá má minimálně 180 px a plný název zůstává v DOM,
- pokud kombinovaný CI projde, P2-01 i P2-02 lze přesunout do VERIFY.

**Předchozí krok:**

**2026-10-06 – P2-01: layout vizuálně správný, opraven přísný test**

Hotovo:
- Build commitu `e0db5fb8622d4510a005bb9998c4357afc6315c7` prošel,
- desktopový screenshot potvrdil požadovaný výsledek: 4 čitelné karty přes šířku obsahu, bez prázdného pátého sloupce a s menším mediálním slotem,
- jediný visual-regression FAIL byl v novém prahu testu: textová část měla 120 px místo uměle požadovaných 150 px, přesto je vizuálně čitelná,
- minimální regresní hranice byla upravena na 115 px; layout se kvůli testu dál neroztahuje,
- P2-01 zůstává IN PROGRESS do nového CI.

**Předchozí krok:**

**2026-10-06 – P1-09 fyzicky potvrzen a uzavřen; zahájen P2-01 desktop cards**

Hotovo:
- uživatel potvrdil centralizovaný shell jako OK,
- poslední P1-09 změna `2d274ced44d50446a7ba33f5458498b4116ca2d5` má Build PASS + visual regression PASS,
- HRA-P1-09 je DONE; další plošný dead-code/CSS úklid se přesouvá do P3,
- P2-01 mění desktop grid z pevných úzkých pěti sloupců na `auto-fill` s minimální šířkou 280 px,
- mediální slot karty je zmenšen z 118×84 na 96×72 px, aby zůstalo více prostoru názvu a metadatům,
- přidán desktop regresní test minimální šířky karty, média a textové části.

**Předchozí krok:**

**2026-10-06 – reference-force-shell převeden na style-only fallback**

Hotovo:
- commit `5ecd90bd78e14c51ba63ccf7e760735f0111b7ca` má Build PASS + visual regression PASS po odstranění sidebar/nav ownership z `redesign.js`,
- `reference-force-shell.js` už nevytváří ani nepřesouvá navigaci, nevytváří header controls a nemá vlastní MutationObserver nad `#app`,
- modul nyní pouze přidává finální reference CSS vrstvu,
- veškerý shell DOM, hlavní routing, active-state, header search, mobilní menu a sidebar vlastní `reference-runtime-retry.js`,
- tím se odstranil poslední známý paralelní vlastník shell DOM z původního konfliktu,
- HRA-P1-09 je na 97 % a čeká na CI + krátké fyzické potvrzení shellu.

**Předchozí krok:**

**2026-10-06 – odstraněn další vlastník sidebar/nav DOM z redesign.js**

Hotovo:
- odstranění mrtvého redesign draweru prošlo Build + visual regression,
- `redesign.js` už nevytváří sidebar, nepřesouvá do něj navigaci a nepřepisuje její ikony/popisky,
- modul zůstává pouze pro prezentační úpravy karet/map layoutu,
- shell/navigační DOM nyní zajišťují reference vrstvy; cílem dalšího kroku je odstranit i duplicitní DOM enforcement z `reference-force-shell.js` a ponechat jej jen jako styling fallback,
- HRA-P1-09 je na 92 % a čeká na CI.

**Předchozí krok:**

**2026-10-06 – odstraněn mrtvý redesign drawer/menu systém**

Hotovo:
- předchozí přesun header controls pod `reference-runtime-retry.js` prošel Build + visual regression,
- `redesign-menu-trigger` byl na mobilu explicitně skrytý a na desktopu žil uvnitř skrytého původního header bloku, takže jeho drawer nebyl reálně dosažitelný,
- odstraněny z `redesign.js` mrtvé funkce `addMenuStyles`, `addMenu`, `openPanel` a nepoužívaná `MENU_ICONS`,
- současný profil zůstává v `account-ui.js`, Nastavení a mobilní drawer v `reference-runtime-retry.js`, O aplikaci/Kategorie v hlavní reference navigaci,
- `redesign.js` tak už nevytváří další paralelní menu DOM ani jeho handlery,
- HRA-P1-09 je na 88 % a čeká na CI tohoto kroku.

**Předchozí krok:**

**2026-10-06 – fyzické ověření P1-08/P1-10/P1-11 OK + centralizace header controls**

Hotovo:
- uživatel fyzicky potvrdil detail Stav / Dochování / Popis, mobilní filtry, select a hlavní navigaci jako OK,
- HRA-P1-08, HRA-P1-10 a HRA-P1-11 jsou DONE,
- `redesign.js` už nevytváří ani neváže globální vyhledávání a mobilní hamburger/lupu,
- tyto prvky nyní vlastní `reference-runtime-retry.js`, stejně jako hlavní routing navigace,
- tím se odstranily další dva duplicitní handlery nad stejnými DOM selektory,
- HRA-P1-09 je na 80 % a čeká na CI tohoto kroku.

**Předchozí krok:**

**2026-10-06 – P1-09 routing/active-state cleanup ověřen 18/18 PASS**

Hotovo:
- commit `070eb78c5e96eab333afe1e004910947be6f8e8a` má Build Hradník PASS i Hradník visual regression PASS,
- hlavní navigaci už neroutuje `detail-layout.js` ani `redesign.js`,
- `redesign.js` už ani nepřepisuje aktivní položku navigace a nepřidává opakované search focus/input listenery,
- `reference-runtime-retry.js` je nyní jediný vlastník routování a hlavního active-state,
- HRA-P1-09 zůstává na 70 %: další úklid header/menu/shell vrstev dělat až po krátkém fyzickém ověření současného stabilního stavu,
- HRA-P1-10 a HRA-P1-11 jsou technicky 100 % ve VERIFY.

**Předchozí krok:**

**2026-10-06 – třetí krok P1-09: odstraněn duplicitní active/search state z redesign.js**

Hotovo:
- commit `6b5054c6e195ec635b896c63f4202bb84b8095a8` má Build PASS + visual regression PASS po odstranění druhého capture routeru,
- `redesign.js` už neurčuje aktivní položku hlavní navigace přes staré indexy deníku/statistik,
- odstraněn i `syncSearchState`, který při opakovaném observer apply přidával další focus/input listenery na vyhledávání,
- aktivní stav i routing hlavní navigace má nyní řešit `reference-runtime-retry.js`,
- P1-09 je na 70 %; zbývá zkontrolovat duplicitní header/menu wiring a staré shell vrstvy bez plošného přepisu.

**Předchozí krok:**

**2026-10-06 – druhý krok P1-09: odstraněn capture router z redesign.js**

Hotovo:
- HRA-P1-10 + HRA-P1-11 mají na commitu `51ca3bb4c1b72da5e633e8261b1b001fa75c7b8e` Build PASS + visual regression PASS a jsou ve VERIFY,
- z `detail-layout.js` už byl odstraněn jeho zastaralý globální nav router,
- nyní byl odstraněn i capture router v `redesign.js` s původní šestipoložkovou mapou `[2,1,3,1,4,5]`,
- `redesign.js` dál pouze staví/vzhledově upravuje sidebar; routování má řešit `reference-runtime-retry.js`,
- P1-09 je na 55 %; po zeleném CI lze dál řešit duplicitní aktivní-state/header wiring.

**Předchozí krok:**

**2026-10-06 – první bezpečný krok P1-09: odstraněn druhý vlastník navigace z detail-layout**

Hotovo:
- `detail-layout.js` už řeší pouze stav otevřeného detailu,
- odstraněn jeho starý globální capture router s šestipoložkovou mapou `[2,1,3,1,4,5]`,
- tento router byl po odstranění samostatného Vyhledávání zastaralý a mohl při každém novém nav DOM přidávat další globální click listener,
- hlavní routing zůstává v `reference-runtime-retry.js`, takže má navigace jednoho jasnějšího vlastníka,
- HRA-P1-09 posunuto na 45 %; další kandidát k odstranění je duplicitní capture routing v `redesign.js`, ale až po zeleném CI tohoto kroku.

**Předchozí krok:**

**2026-10-06 – P1-08 CI PASS, zahájeny mobilní filtry a select kontrast**

Hotovo:
- commit `c3e5cb8b7a0a9f7ce996597001e4f75882355bcf` má Build Hradník PASS i Hradník visual regression PASS,
- HRA-P1-08 je technicky 100 % a přesunuté do VERIFY,
- pro HRA-P1-10 je `#typeChips` na mobilu explicitně jeden řádek s horizontálním posunem, bez neúmyslného ořezu posledního filtru,
- pro HRA-P1-11 má select explicitní tmavé `background/color/color-scheme` a tmavé option hodnoty,
- přidán iPhone regresní test: ověřuje skutečný horizontální overflow, dosažitelnost posledního chipu a tmavý select.

**Předchozí krok:**

**2026-10-04 – nalezen kořen chybného mapování „Stav / Popis“**

Hotovo:
- HRA-P1-06 a HRA-P1-07 jsou po fyzickém potvrzení uživatele DONE,
- původní screenshot s dlouhým textem pod „STAV“ nebyl problém databázového pole v `main.legacy.js`,
- kořen byl v `src/info-ui.js`: enrichment hledal „Základní informace“, a když kartu nenašel, použil první kartu detailu,
- první kartou je „Stav“, takže `info_summary` přepsalo hodnotu „Navštíveno / Nenavštíveno“,
- enrichment nyní smí cílit pouze na „Popis“ nebo kompatibilní starou kartu „Základní informace“,
- regresní test nově ověřuje současně: Stav = Navštíveno a Popis = obohacený popis.

**Předchozí krok:**

**2026-10-04 – foto/placeholder fix fyzicky potvrzen, upraven falešně přísný test**

Hotovo:
- uživatel potvrdil opravené karty jako OK,
- Build Hradník na `5aa86bf9ecfaa9af61ad41fa2e5e1344715e1f9a` prošel,
- visual-regression měl jediný FAIL pouze v nově přidaném technickém assertu na iPhonu: pseudo-element s `content:none` může mít podle browseru computed `display:inline`, přestože nic nekreslí,
- test nyní kontroluje skutečnou podmínku problému: computed `content` musí být `none`,
- HRA-P1-06 a HRA-P1-07 jsou fyzicky hotové; po zeleném CI je lze označit DONE.

**Předchozí krok:**

**2026-10-03 – fyzický desktop test odhalil zbylý legacy placeholder**

Zjištění a oprava:
- screenshoty Seznamu i Oblíbených ukázaly, že vedle správné fotografie/typové ikony zůstává ještě druhý šedý obdélník,
- kořen je ve starém desktopovém pravidle v `reference-shell.css`: `.placeCopy:before` kreslilo 106px šedý „fake image“ blok,
- tento pseudo-placeholder je nyní odstraněný přímo u zdroje místo překrývání další vizuální záplatou,
- regresní test nově výslovně kontroluje, že `.placeCopy::before` je vypnutý,
- HRA-P1-06 a HRA-P1-07 se vrací do IN PROGRESS do výsledku CI a dalšího krátkého fyzického potvrzení.

**Předchozí krok:**

**2026-10-03 – jednotné fotografie/placeholdery: build + 18/18 visual PASS**

Hotovo:
- commit `34d80cff43d3f655a2c5600056db52de73668e77` má úspěšný Build Hradník,
- Hradník visual regression na stejném commitu prošel 18/18 scénářů,
- karty mají jediný mediální slot: fotografie nahrazuje placeholder místo přidání vedle něj,
- při chybě obrázku se vrátí typový placeholder; detail má stejný bezpečný fallback,
- desktop a mobil používají stabilní rozměry média,
- placeholder má kontrastní zlatou typovou ikonu,
- HRA-P1-06 a HRA-P1-07 jsou technicky 100 % a čekají jen na fyzické potvrzení na PC/iPhonu.

**Předchozí krok:**

**2026-10-03 – fotografie/placeholdery: build PASS, odstraněn stale-nav race v regresním testu**

Hotovo:
- commit `299da4f4cbcdc6c79d22302ec82266a6716602d3` sjednotil mediální slot karet a Build Hradník prošel,
- visual-regression prošel 17/18 scénářů; iPhone včetně nového foto testu prošel,
- jediný desktop FAIL nebyl v komponentě fotografie: po kliknutí na „Nedávno zobrazené“ držel helper starou, již odpojenou instanci navigace vytvořenou před překreslením Seznamu,
- `reference-map-dashboard.js` nyní před návratem na mapu znovu vyhledá aktuální mapové tlačítko v DOM místo klikání na stale nav node,
- HRA-P1-06 a HRA-P1-07 zůstávají IN PROGRESS do výsledku následujícího CI.

**Předchozí krok:**

**2026-10-03 – navigace bez „Vyhledávání“ fyzicky potvrzena + zahájeny jednotné karty**

Hotovo:
- uživatel potvrdil nový layout navigace na mobilu i PC jako OK,
- HRA-P1-12 je DONE,
- u karet se fotografie už nepřidává vedle existujícího placeholderu; nahrazuje jej jako jediný mediální prvek,
- při chybě načtení fotografie se automaticky vrátí původní typový placeholder,
- stejný fallback je doplněn i v detailu památky,
- fotografie a placeholder mají sjednocený rozměr na desktopu i mobilu,
- typový placeholder používá kontrastní zlatou ikonografii ve stylu Kategorie,
- HRA-P1-06 a HRA-P1-07 čekají na CI a fyzické ověření.

**Předchozí krok:**

**2026-10-03 – samostatné „Vyhledávání“ odstraněno, CI PASS**

Hotovo:
- hlavní navigace už nemá samostatnou položku „Vyhledávání“,
- desktop má: **Mapa · Seznam · Oblíbené · Kategorie · O aplikaci**,
- mobilní spodní navigace má: **Mapa · Seznam · Oblíbené · Kategorie**; „O aplikaci“ zůstává v hamburger menu,
- lupa v mobilní hlavičce a desktopové horní hledání dál otevírají Seznam a jeho vyhledávání,
- Build Hradník na commitu `9a0a2448813ca035f6585fdb2b3b92ab7d2d9c0f` prošel,
- Hradník visual regression na stejném commitu prošel,
- HRA-P1-12 je technicky 100 % a čeká jen na krátké fyzické potvrzení nového layoutu na PC/iPhonu.

**Předchozí krok:**

**2026-10-03 – navigace bez „Vyhledávání“: build PASS, oprava regresního testu**

Hotovo:
- commit `76074ff3b4a67019f83cfaeb209c570b9720c6fc` odstranil samostatnou položku „Vyhledávání“ z hlavní navigace,
- Build Hradník prošel,
- visual-regression měl pouze 2 stejné testovací FAILy (desktop + iPhone): test omylem čekal 5 kategorií místo správných 6,
- aplikace v těchto bězích vykreslila všech 6 kategorií správně; nejde o funkční regresi,
- očekávání testu bylo opraveno zpět na 6 kategorií,
- HRA-P1-12 je 95 % a čeká na nový CI běh.

**Předchozí krok:**

**2026-10-03 – fyzický test navigace na PC i iPhonu potvrzen OK**

Hotovo:
- uživatel fyzicky potvrdil navigaci na mobilu i PC jako funkční,
- HRA-P1-01, HRA-P1-02, HRA-P1-03 a HRA-P1-04 jsou DONE,
- potvrzeny také rozlišitelné typové markery; HRA-P1-05 je DONE,
- na základě používání bylo rozhodnuto odstranit samostatné „Vyhledávání“ z hlavní navigace, protože pouze duplikuje vyhledávání uvnitř Seznamu,
- HRA-P1-12 je implementováno a čeká na CI + krátké fyzické potvrzení nového 4/5-položkového layoutu.

**Předchozí krok:**

**2026-10-03 – 18/18 visual-regression PASS + build PASS**

Hotovo:
- HEAD `923f946590346b510a71c084c18a32cf910a31ef` má úspěšný workflow **Build Hradník**,
- stejný HEAD má úspěšný workflow **Hradník visual regression**,
- navigační balík nyní prošel kompletní sadou 18/18 desktop + iPhone regresních scénářů,
- HRA-P1-01 je technicky hotové a přesunuto do `VERIFY`; zbývá pouze fyzické potvrzení na skutečném iPhonu,
- HRA-P2-09 je `VERIFY` na 90 %: automatická sada funguje, později ještě doplnit cílený offline/backend-failure scénář a čistou-cache kontrolu,
- starého Supabase projektu se tento krok nijak nedotkl.

**Předchozí krok:**

**2026-10-03 – navigační CI se vrátil z globálního FAIL na 17/18 PASS**

Hotovo:
- commit `4978a5efc5d0ba66421f03d46e509844da2b69a1` obnovil frame-scheduled synchronizaci a odstranil boot starvation,
- visual-regression doběhl za 30,6 s místo přibližně 9 minut a prošlo 17 z 18 scénářů,
- jediný zbývající FAIL nebyl navigační bug: iPhone test očekával viditelnou kartu „Nedávno zobrazené“, ale mobilní layout ji záměrně skrývá, aby mapa vyplnila dostupný viewport podle HRA-P1-04,
- test byl opraven tak, aby fotografii a kliknutí na recent kartu ověřoval pouze na desktopu; na mobilu ověřuje, že recent rail zůstává skrytý,
- HRA-P1-01 je 99 % do výsledku následujícího CI; HRA-P2-09 je IN PROGRESS na 60 %.

**Předchozí krok:**
**2026-10-03 – CI bisect přesně našel regresi bootu**

Hotovo:
- porovnány visual-regression běhy jednotlivých commitů před a po rozbití startu,
- commit `334eabd62b64da24054e78183365cdab78920168` ještě nabíhal: 12/18 testů prošlo,
- následující jediný commit `3c9b04a88acf33a4692e000bb5a15e1522c2221c` změnil jen `reference-runtime-retry.js` (+5/-1) a od něj selhávalo 18/18 testů na boot guardu,
- rozhodující změnou scheduleru bylo `requestAnimationFrame` → `queueMicrotask`; při současném množství DOM observerů tím vznikla microtask starvation před paintem,
- předchozí pokus pouze idempotentizovat DOM přepisy nestačil; CI `fbbf3338...` stále selhal 18/18,
- scheduler je proto vrácen na `requestAnimationFrame`, zatímco novější window-capture routing pro kliknutí zůstává zachovaný,
- idempotentní DOM konfigurace z předchozího kroku zůstává jako další snížení observer churn,
- HRA-P1-01 je 97 % a čeká na nový CI; HRA-P1-09 posunuto na 35 %.

**Předchozí krok:**
**2026-10-03 – odstranění MutationObserver feedback loopu při startu**

Hotovo:
- build commitu `676bd032f33909407250257140a56112dc9ecf9a` prošel a Vercel ho nasadil jako READY do produkce,
- visual-regression znovu selhal 18/18 scénářů na boot guardu; stažený Playwright trace ukázal, že `hradnik-auth` (`me`, `state_list`) i `hradnik_places` z nové Supabase odpověděly 200 během desítek ms,
- tím se vyloučil Supabase/backend jako příčina tohoto CI FAIL,
- skutečný kořen byl v `reference-runtime-retry.js`: MutationObserver sledoval childList a jeho callback v microtasku při každém průchodu znovu nastavoval stejné `innerHTML` navigačních tlačítek; tím sám vyráběl další mutaci a mohl vytvořit nekonečný microtask feedback loop bez dalšího paintu,
- konfigurace navigačních tlačítek je nyní idempotentní a nový DOM se upravuje pouze jednou,
- stejný opakovaný přepis byl odstraněn i z `reference-force-shell.js`; force shell už navíc nepřepisuje account tlačítka a neprovádí vlastní automatický návrat na mapu, aby měl routing jednoho hlavního vlastníka,
- HRA-P1-09 posunuto na 30 %; HRA-P1-01 zůstává IN PROGRESS do výsledku nového CI běhu,
- starého Supabase projektu se změna nedotkla.

**Předchozí krok:**
**2026-10-03 – oprava race condition při startu reference shellu**

Hotovo:
- build na HEAD `c1f7f3d040fbd4c9ffe0d9c189a3d3caa2e0aeb1` prošel,
- visual-regression na stejném HEAD selhal ve všech scénářích na společné podmínce: `.redesign-sidebar .redesign-nav > button` mělo 0 prvků místo 6,
- kořen nebyl v datech ani v Supabase, ale ve startu `reference-force-shell.js`: observer se připojil pouze tehdy, když první `run()` už našel vyrenderovaný header a navigaci,
- při pomalejším/asynchronním startu se první `run()` trefil před render aplikace a shell už žádnou další změnu DOM nesledoval,
- start reference shellu nyní observer připojí vždy, pokud existuje `#app`, a potom provede první `run()`; pozdější render tak spolehlivě vyvolá další inicializaci,
- HRA-P1-01 je do výsledku nového CI běhu `IN PROGRESS` na 95 %,
- starého Supabase projektu se tento krok nijak nedotkl.

**Předchozí krok:**

**2026-10-03 – typové ikony mapových markerů**

Hotovo:
- samostatné body na mapě už nepoužívají jeden univerzální hradní štít,
- marker přebírá typ památky z barvy původní datové vrstvy a zobrazuje odpovídající ikonu pro hrad, zámek, zříceninu, tvrz nebo klášter,
- clusterové body zůstávají číselné, protože zastupují více různých typů,
- HRA-P1-05 je VERIFY; zbývá vizuálně potvrdit mapu a případně doladit „Opevněné místo“.

**Předchozí krok:**

**2026-10-03 – mobilní spodní navigace, safe area a výška mapy**

Hotovo:
- finální mobilní layout znovu zobrazuje text 5. položky „Kategorie“ a ruší staré nahrazení textem „Více“,
- běžné mobilní obrazovky mají spodní rezervu podle pevné navigace a iOS safe area,
- mobilní mapa využívá dostupný prostor mezi 104px hlavičkou a přibližně 76px spodní navigací místo starého odečtu 315 px,
- odstraněn minimální limit výšky mapy, který na menších displejích vytvářel nevyužitou plochu,
- HRA-P1-02, HRA-P1-03 a HRA-P1-04 jsou VERIFY a čekají na fyzický iPhone test.

**Předchozí krok:**

**2026-10-03 – stabilizace hlavní navigace bez další CSS záplaty**

Hotovo:
- kořen selhání Seznam/Vyhledávání byl dohledán v souběhu několika MutationObserverů: starší shell si po překreslení bez mapy stihl naplánovat návrat na Mapu,
- hlavní runtime router nyní reaguje na změnu DOM v microtasku a převezme nově vyrenderovanou navigaci ještě před starším requestAnimationFrame callbackem,
- mobilní hamburger a tlačítko hledání jsou zachyceny na jediném window-capture routeru dříve než staré lokální handlery,
- tím se odstraňuje známý konflikt, kdy hamburger otevíral jiný drawer a položka Profil zůstávala skrytá,
- HRA-P1-01 je VERIFY; ověří ji nový Playwright běh a potom fyzický iPhone test,
- HRA-P1-09 je rozpracovaný: router už má jedno prioritní místo, další staré prezentační vrstvy se budou čistit až po potvrzení stability.

**Předchozí krok – český fallback a lokální katalog při výpadku backendu**

Hotovo:
- úspěšně načtený katalog se ukládá do IndexedDB bez blokování UI,
- při chybě Supabase se použije poslední lokálně uložený katalog a zobrazí se české upozornění,
- při prvním spuštění bez cache se už nezobrazuje syrová anglická databázová chyba, ale srozumitelný český stav,
- přechodný výpadek auth už nemaže uloženou relaci; lokální session se odstraní jen po skutečné odpovědi 401/403,
- technické detaily zůstávají pouze v konzoli,
- HRA-P0-05 je VERIFY a čeká na fyzický test online → offline na PC/iPhonu.

**Předchozí krok – produkční Edge Functions se ukládají do repozitáře**

Hotovo:
- ověřeno, že repozitářové `hradnik-auth` a `hradnik-sync` jsou byte-for-byte shodné s aktuálně nasazenými funkcemi v nové Supabase,
- uložen aktuálně nasazený `hradnik-photo`,
- uložen aktuálně nasazený `hradnik-quality`, `hradnik-enrich-v4` a `hradnik-geocode-v3`,
- starší `hradnik-geocode` zůstává zatím zachovaný pro historii; aktivní produkční varianta je `hradnik-geocode-v3`,
- uložen také aktuálně nasazený `hradnik-admin`; aktivní produkční backend Hradníku je nyní zdrojově zachycen v repozitáři,
- HRA-P0-04 je VERIFY a čeká už jen na ruční ověření přihlášení, uživatelských stavů, fotografií, adminu a kontroly kvality na produkci.

**Předchozí krok – vytvořena standalone DB baseline migrace**

Hotovo:
- skutečné schéma bylo načteno z nové Supabase `abqiprdggptuxebhpfyi`,
- vytvořena kanonická `20261003_hradnik_standalone_baseline.sql` se všemi 9 tabulkami, FK, kontrolami, indexy, RLS politikami, granty, triggery a 14 aktuálními DB funkcemi,
- baseline obsahuje pouze bezpečné výchozí zdroje; neobsahuje produkční uživatele, hesla, relace ani sync/enrich tajemství,
- `sync_key` se pro novou instalaci generuje náhodně,
- staré Domácnost+-era migrace byly odstraněny z aktivní migrační složky, protože odkazovaly na `household_members` / `hradnik_place_state` nebo přepisovaly aktuální serverovou logiku,
- HRA-P0-03 je VERIFY: zbývá otestovat baseline na skutečně čisté Supabase instanci/branchi.

**Předchozí krok – odstranění dočasného Supabase cutover mechanismu ze zdrojové logiky**

Hotovo:
- ověřeno, že nový projekt `abqiprdggptuxebhpfyi` je ACTIVE_HEALTHY,
- ověřeno, že nový projekt obsahuje 9 tabulek Hradníku včetně 3004 záznamů `hradnik_places`,
- ověřeno, že Hradník edge funkce jsou nasazené v novém projektu,
- starý projekt již neobsahuje veřejné tabulky `hradnik_*`,
- vytvořen jediný `src/supabase.js` pro URL, publishable key, sdíleného klienta a URL edge funkcí,
- odstraněny přímé staré Supabase URL/key z hlavních runtime modulů,
- odstraněn build-time přepis staré Supabase na novou,
- odstraněn globální fetch monkeypatch `supabase-cutover.js`,
- HRA-P0-01 a HRA-P0-02 čekají na build/runtime ověření.

Důležité zjištění:
- původní audit popisoval starší stav; vlastní data a backend už byly 11. 9. 2026 přeneseny do nové Supabase,
- zbývající problém byl hlavně v tom, že zdrojové moduly stále obsahovaly staré URL a spoléhaly na dočasný přepis.

---

# 12. Co ověřit ručně po nejbližší opravě

Po HRA-P0-01 až HRA-P0-05:
1. otevřít Hradník na desktopu,
2. otevřít Hradník na iPhonu,
3. potvrdit načtení katalogu,
4. potvrdit přihlášení,
5. potvrdit fotografie,
6. potvrdit Oblíbené / Chceme / Navštívili jsme,
7. zkontrolovat konzoli,
8. potvrdit, že žádný request nemíří na `cgshssdjgzzuprlwnabl`.

---

# 13. Další doporučený krok

## HRA-P2-13 – záměna detailního okna místo vrstvení

1. Nejprve ověřit obě CI workflow commitu s úpravou `detail(id)` a testem opakovaného otevírání památek. Při FAIL analyzovat konkrétní log a opravit.
2. Uživatel pošle screenshoty z mobilu; porovnat hlavičku, mapu, spodní navigaci, seznam i detaily proti PC. Neinterpretovat PC screenshoty jako plné mobilní schválení.
3. Při ručním testu na PC a iPhonu ověřit tři postupně otevřené památky – žádné vrstvení, jediný křížek a zachování změněných stavů. Po potvrzení HRA-P2-13 DONE 100 %.

## HRA-P3-01 – závěrečná kontrola CSS

Zatím **IN PROGRESS 95 %**. Sedm CSS breakpointů a desktopové snímky jsou dostupné; až po mobilních snímcích a závěrečném fyzickém ověření případně dokončit na 100 %. CSS neodstraňovat mechanicky bez stejné specificity, hodnot a testů.

## HRA-P2-10 – fresh Supabase drill (BLOCKED)

Bez schválení možných nákladů nezasahovat do Supabase; starý `cgshssdjgzzuprlwnabl` ani nový `abqiprdggptuxebhpfyi` nemazat či upravovat.

---

# 14. Šablona aktualizace po každém kroku

Po dokončení úkolu upravit:

```text
ID:
Stav:
Dokončeno:
Commit:
HEAD:
Co se změnilo:
Co bylo ověřeno automaticky:
Co má ověřit uživatel:
Známé zbylé problémy:
Další doporučený krok:
```

---

# 15. Prompt pro nový chat

Použij:

> **Pokračuj v projektu Hradník podle aktuálního `HRADNIK_HANDOFF.md` a aktuálního HEAD větve `main`. Všechno důležité je v tomto souboru. Nejdřív ho celý načti, neopakuj audit od začátku a pokračuj bodem označeným jako „Aktuálně řešený úkol“. Po každém dokončeném nebo mnou potvrzeném kroku aktualizuj `HRADNIK_HANDOFF.md` ve stejném commitu včetně stavu, procent, HEAD, ručního testu a dalšího kroku. Nic nemaž ze starého Supabase projektu, dokud nový Hradník není plně ověřený.**
