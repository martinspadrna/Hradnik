# HRADNIK_HANDOFF.md

> Jediný průběžně aktualizovaný předávací a řídicí soubor projektu Hradník.
> Každý nový chat / Work běh má nejdřív načíst tento soubor a pokračovat podle sekce **Aktuálně řešený úkol**.

---

## 1. Základní stav projektu

- **Projekt:** Hradník
- **Datum založení handoffu:** 2026-10-03
- **Branch:** `main`
- **HEAD:** aktuální commit větve `main` (tento soubor je součástí stejného commitu jako změny)
- **Produkce:** frontend funguje přes dočasný cutover mechanismus; zdrojový kód se právě čistí tak, aby používal nový Supabase přímo
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

**ID:** HRA-P0-01 + HRA-P0-02  
**Název:** Přímé napojení na nový Supabase + jediný sdílený klient  
**Stav:** VERIFY  
**Dokončeno:** 90 %

### Cíl
Odstranit runtime závislost Hradníku na `cgshssdjgzzuprlwnabl` a kompletně používat `abqiprdggptuxebhpfyi`.

### Poznámka
Nezačínat mazáním starého projektu. Nejprve zjistit všechny vazby, připravit novou DB/migrace a ověřit aplikaci.

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

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
- **Stav:** VERIFY
- **Dokončeno:** 90 %

**Viditelný problém:**
Pod mapou zůstává velká prázdná černá plocha až ke spodní navigaci.

**Akceptace:**
Mapa vyplní dostupný prostor mezi hlavičkou a spodní navigací.

---

### HRA-P1-05 – Sjednotit typové ikony památek
- **Stav:** VERIFY
- **Dokončeno:** 85 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

**Viditelný problém:**
Např. Hrádek u Nechanic / Lednice mají téměř černou ikonku na tmavém pozadí.

**Akceptace:**
Placeholder je jasně čitelný a používá správnou typovou ikonu ve vizuálním stylu Hradníku.

---

### HRA-P1-08 – Prověřit mapování polí v detailu památky
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- **Dokončeno:** 20 %

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
- **Stav:** TODO
- **Dokončeno:** 0 %

**Viditelný problém:**
Řada typových filtrů na mobilu přetéká doprava a poslední tlačítko je uříznuté.

**Rozhodnout a sjednotit:**
- korektní horizontální scroll, nebo
- responsivní zalamování.

**Akceptace:**
Žádné ovládací tlačítko není neúmyslně napůl mimo viewport.

---

### HRA-P1-11 – Stabilizovat select „Dochované + zříceniny“
- **Stav:** TODO
- **Dokončeno:** 0 %

**Audit / problém:**
V prvním auditu světlé písmo na téměř bílém pozadí. Na aktuálním screenshotu vypadá správně.

**Závěr:**
Pravděpodobně intermitentní konflikt CSS/stavu.

**Akceptace:**
Select má deterministický kontrast ve všech podporovaných stavech a na mobile/desktopu.

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
- **Stav:** TODO
- **Dokončeno:** 0 %

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
- [ ] Vyhledávání
- [ ] Kategorie
- [ ] rychlé přepínání mezi všemi sekcemi
- [ ] Oblíbené → Vyhledávání
- [ ] Vyhledávání → detail → zpět
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
- [ ] Vyhledávání
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

## Ověřit P0 na zařízení, potom P1-01

1. zachovat aktuální zdrojové verze všech produkčních Hradník Edge Functions v repozitáři,
2. porovnat `hradnik-auth`, `hradnik-admin`, `hradnik-photo`, `hradnik-quality`, `hradnik-sync`, `hradnik-enrich-v4` a `hradnik-geocode-v3` se serverem,
3. otestovat standalone baseline na čisté Supabase instanci/branchi před označením HRA-P0-03 jako DONE,
4. fyzicky ověřit produkci na PC/iPhonu; HRA-P0-01 a HRA-P0-02 zůstávají VERIFY do tohoto testu,
5. visual-regression FAIL je starší než aktuální cutover a bude řešen v P1 navigaci/UI.

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
