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

**ID:** HRA-P1-10 + HRA-P1-11  
**Název:** Mobilní filtry Seznamu a stabilní kontrast selectu  
**Stav:** IN PROGRESS  
**Dokončeno:** 90 %

### Cíl
Typové filtry v Seznamu musí být na úzkém mobilu vždy dosažitelné záměrným horizontálním posunem, bez uříznutého posledního tlačítka. Select „Dochované + zříceniny“ musí mít deterministický tmavý vzhled a čitelný text ve všech stavech.

### Poznámka
HRA-P1-08 prošlo Build + visual regression a je technicky hotové; fyzické ověření detailu zůstává doporučené, ale neblokuje pokračování.
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
- **Stav:** VERIFY
- **Dokončeno:** 100 % technicky

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
- **Stav:** IN PROGRESS
- **Dokončeno:** 45 %

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
- **Stav:** IN PROGRESS
- **Dokončeno:** 90 %

**Viditelný problém:**
Řada typových filtrů na mobilu přetéká doprava a poslední tlačítko je uříznuté.

**Rozhodnout a sjednotit:**
- korektní horizontální scroll, nebo
- responsivní zalamování.

**Akceptace:**
Žádné ovládací tlačítko není neúmyslně napůl mimo viewport.

---

### HRA-P1-11 – Stabilizovat select „Dochované + zříceniny“
- **Stav:** IN PROGRESS
- **Dokončeno:** 90 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

**Viditelný problém:**
- příliš velké obrázkové plochy,
- při chybě vznikají velké prázdné obdélníky,
- grid nevyužívá efektivně šířku monitoru.

**Akceptace:**
Stabilní rozměry karet a obrázků, čitelný text, žádné obří prázdné bloky.

---

### HRA-P2-02 – Opravit „Nedávno zobrazené“ pod desktopovou mapou
- **Stav:** TODO
- **Dokončeno:** 0 %

**Viditelný problém:**
Karty jsou extrémně úzké a názvy se zkracují na několik znaků (`Jan...`, `Zno...`).

**Akceptace:**
Položka je identifikovatelná bez otevření detailu.

---

### HRA-P2-03 – Zkompaktnit mobilní hlavičku
- **Stav:** TODO
- **Dokončeno:** 0 %

**Viditelný problém:**
Horní oblast zabírá hodně vertikálního prostoru.

**Podmínka:**
Nejdřív opravit funkční problémy P0/P1, potom kompaktnost.

**Akceptace:**
Menší hlavička bez porušení iOS safe area a klikacích ploch.

---

### HRA-P2-04 – Sjednotit responzivní chování PC a mobilu
- **Stav:** TODO
- **Dokončeno:** 0 %

**Audit / screenshoty:**
Stejná data se na telefonu zobrazují správněji než na desktopu.

**Cíl:**
Breakpointy mají měnit layout, ne datovou strukturu / logiku komponenty.

---

### HRA-P2-05 – Prověřit stabilitu markerů a clusterů mapy
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

**Po dokončení nesmí zůstávat:**
- 404 na starý Supabase,
- více instancí auth klienta,
- vlastní Promise chyby,
- chyby při přepínání obrazovek,
- vlastní runtime exceptions.

---

### HRA-P2-09 – Doplnit regresní testy hlavních workflow
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

**Akceptace:**
1. čistý projekt,
2. aplikovat migrace,
3. importovat potřebná data,
4. nastavit environment,
5. spustit Hradník,
6. bez skrytých ručních kroků vše funguje.

---

## P3 – Technický úklid po stabilizaci

### HRA-P3-01 – Odstranit zbytečný technický dluh
- **Stav:** TODO
- **Dokončeno:** 0 %

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

## Ověřit filtry + první architektonický úklid

1. potvrdit Build Hradník a visual-regression na aktuálním HEAD,
2. pokud projdou, HRA-P1-10/P1-11 přesunout do VERIFY a fyzicky na iPhonu zkontrolovat poslední chip + select,
3. HRA-P1-08 stále krátce fyzicky ověřit v detailu Hrádku u Nechanic,
4. poté pokračovat HRA-P1-09: odstranit další duplicitní routing z `redesign.js`, ale zachovat `reference-runtime-retry.js` jako jediného vlastníka hlavní navigace.
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
