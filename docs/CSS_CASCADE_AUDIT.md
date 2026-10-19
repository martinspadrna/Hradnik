# Hradník – mapa vlastníků CSS a kontrakt rozložení

**Datum:** 18. 10. 2026  
**Výchozí commit:** `72683862bc38cf75f651e5b0157fd1af8048bf2f`  
**Úkol:** HRA-P3-01 – bezpečná konsolidace CSS

## Co audit zjistil

Hradník načítá řadu historických vrstev CSS. V `index.html` se na konci pořadí načítá `reference-true.css` → `reference-lock.css` → `reference-layout-hardlock.css` → `reference-dashboard-final.css` → `search-detail-polish.css`. Vedle statických souborů vkládají `reference-force-shell.js` a `reference-runtime-retry.js` další styly do `document.head` za běhu. Výsledný vzhled proto nelze stanovit jen čtením jedné deklarace.

Po 14. kroku mezi `reference-true.css` a `reference-lock.css` nezůstávají přesné dvojice *celých* pravidel se stejným breakpointem. To **neznamená**, že zde nejsou částečné přepisy jednotlivých vlastností.

## Matice odpovědnosti a známých překryvů

| Oblast | Soubory / runtime | Riziko a postup |
| --- | --- | --- |
| Základní barvy a typografie | `reference-true.css`, `reference-dashboard-final.css`, `reference-force-shell.js` | Varianty `--ref-gold` / `--rf-gold` mají různou hodnotu nebo účel. Neslučovat bez kontroly kontrastu a všech ikon. |
| Desktopová hlavička a levá navigace | `reference-true.css`, `reference-lock.css`, `reference-layout-hardlock.css`, `reference-force-shell.js`, `reference-runtime-retry.js` | Opakují se selektory hlavičky a `.redesign-sidebar`; silnější a pozdější styly zajišťují pevnou hlavičku a postranní lištu. Testovat skutečné rozměry při 851, 1280 a 1536 px. |
| Mobilní hlavička a spodní navigace | `reference-true.css`, `reference-lock.css`, `reference-layout-hardlock.css`, `reference-force-shell.js`, `reference-runtime-retry.js`, `mobile-nav-final.css` | Historická pravidla uvádějí odlišné výšky hlavičky a počet sloupců navigace. Finální vzhled závisí na kaskádě a dynamické navigaci. Testovat 375, 390, 520 a 850 px a skrytí nepoužívaných tlačítek. |
| Mapa / pravý panel na PC | `reference-true.css`, `reference-lock.css`, `reference-dashboard-final.css`, `reference-map-final.css` | Poslední vrstva používá specifičtější `.reference-map-dashboard .map-layout`; desktop vyžaduje dvousloupcové rozložení, viditelný panel a minimální výšku mapy. |
| Mapa / panel / spodní lišta na mobilu | `reference-dashboard-final.css`, `reference-layout-hardlock.css`, `reference-runtime-retry.js` | Mapový detail zůstává na mobilu schovaný; mapa musí být mezi hlavičkou a navigací. Testovat také tlačítko Filtry a atribuci mimo navigaci. |
| Karty seznamu a detailů | `reference-detail.css`, `reference-my-diary.css`, `search-detail-polish.css` | `search-detail-polish.css` jako poslední vrstva úmyslně přepisuje šířky fotografie a ikony. Zachovat jeho prioritu. |
| Menu, listenery a mapové intervaly | `menu-polish.js`, `mobile-menu-fix.js`, `reference-map-markers.js` | Krok 15 dávkuje mutation callbacky a váže markerový interval na životní cyklus mapy; existuje regresní test Mapa → Seznam → Mapa. |

## Nově zavedený test výsledné kaskády

`tests/visual/hhradnik.spec.js` ověřuje **skutečně vypočtené styly a souřadnice prvků**, nikoliv počet CSS deklarací.

- **Desktop:** šířky 851 / 1280 / 1536 px; pevná hlavička, levá lišta přibližně 194 px, volný prostor pro obsah, dvousloupcová mapa, viditelný pravý panel.
- **Mobil (emulace iPhonu):** šířky 375 / 390 / 520 / 850 px; kompaktní hlavička, pevná spodní lišta, bloková mapa bez pravého desktopového panelu a bez překrytí hlavičkou či navigací.
- Test při změně šířky stránku znovu načítá, aby zahrnul také runtime styly vytvářené po startu aplikace.
- Test doplňuje již existující scénáře přístupnosti Filtrů, atribuce mapy, navigace, karet a datumů návštěv.

## Krok 17 – konsolidace odpovědnosti desktopové a mobilní navigace (18. 10. 2026)

**Vlastník výsledných pravidel:** `src/reference-lock.css`. Ze staršího `src/reference-true.css` byly odstraněny jen deklarace, které měly **stejný selector, stejný breakpoint, přesně stejnou vlastnost a hodnotu včetně `!important`** jako pozdější `reference-lock.css`. Pozdější pravidla se neměnila.

| Selektor | Breakpoint | Odstraněné opakované deklarace | Jedinečné zachované ve starší vrstvě |
| --- | --- | ---: | --- |
| `header` | ≥ 851 px | 6 | `left`, `right`, `top` |
| `header .account button` | ≥ 851 px | 5 | `padding`, `color`, `font-size` |
| `.redesign-sidebar` | ≥ 851 px | 10 | žádné – celé shodné podmnožinové pravidlo vynecháno |
| `.redesign-sidebar .nav` | ≥ 851 px | 6 | žádné – celé shodné podmnožinové pravidlo vynecháno |
| `.redesign-sidebar .nav button` | ≥ 851 px | 13 | žádné – celé shodné podmnožinové pravidlo vynecháno |
| `.redesign-sidebar .nav button` | ≤ 850 px | 11 | žádné – celé shodné podmnožinové pravidlo vynecháno |
| **Celkem** | | **51** | |

Kaskáda zůstává stejná, protože `reference-lock.css` se načítá **po** `reference-true.css`, při stejné specificitě i důležitosti výsledné hodnoty. Rozdílné přepisy nebo selektory s vyšší specificitou zůstaly beze změny. Nezasahovalo se do `reference-layout-hardlock.css`, `reference-dashboard-final.css` ani dynamických stylů.

**Testy:** doplněna kontrola vypočteného `display`, výšky navigačních tlačítek a mobilního `flex-direction` pro 7 hraničních šířek; zachovány i geometrické kontroly hlavičky, sidebaru a mapy. Playwright ověřuje konečný styl v prohlížeči, nikoli počet zdrojových CSS deklarací.

**Ruční kontrola po automatickém PASS:** PC 851/1280/1536 – levá navigace, účetní tlačítko a zarovnání; iPhone – spodní navigace, aktivní položka, mapa a přepínání Seznam/Oblíbené.

## Krok 18 – přesné dílčí duplicity mapy a rozložení (19. 10. 2026)

Po ověření commitu `ab0b8941318ea5598636fd882af0e0de54469445` (Build Hradník i visual regression **PASS**, Vercel produkce **READY**) bylo vybráno dalších **27 přesně shodných deklarací**. Neměnila se žádná rozdílná hodnota, selector, priorita `!important` ani pořadí souborů.

| Původní vrstva | Selektor / breakpoint | Odstraněno | Pozdější vlastník stejné hodnoty |
| --- | --- | ---: | --- |
| `reference-true.css` | `header`, desktop | 3 | `reference-layout-hardlock.css` (`left/right/top`) |
| `reference-true.css` | `#content>section`, desktop | 2 | `reference-lock.css` (`max-width/margin`) |
| `reference-true.css` | `.map-layout`, desktop | 4 | `reference-lock.css` (`display/columns/gap/margin`) |
| `reference-true.css` | `.map-layout .map-focus-card`, desktop | 8 | `reference-lock.css` (stejné rozměry, rámečky a výplň) |
| `reference-true.css` | `.map-layout`, mobil | 2 | `reference-lock.css` (`display/margin`) |
| `reference-true.css` | `.map-layout #map`, mobil | 2 | `reference-lock.css` (`border/border-radius`) |
| `reference-lock.css` | `.redesign-sidebar`, desktop | 6 | `reference-layout-hardlock.css` (`display/position/left/top/bottom/width`) |
| **Celkem** | | **27** | |

V `reference-true.css` zůstává unikátní `min-height` desktopové mapy, její vlastní mobilní výška a styly prvků, které v pozdějších souborech nemají stejný kontrakt. V `reference-lock.css` zůstává jedinečné `box-sizing`, `padding`, `background`, `border-right`, `z-index` a `box-shadow` levé lišty. Odlišný pozdější `z-index:950` v hardlocku zůstává beze změny.

**Ověření:** commit `b21663a35c38e8a9b7ff3eb2de3b1a365cf7f240`: `Build Hradník` **PASS** (GitHub Actions run `39242283665`), `Hradník visual regression` **PASS** (run `39242283769`, desktop+iPhone včetně sedmi breakpointů), Vercel produkce **READY**. Reálná kontrola iPhonu i desktopu je stále nutná a HRA-P3-01 zatím není DONE.

## Další bezpečný postup

1. Nejdříve ověřit oba CI workflow na commitu s těmito kontrakty.
2. Když se objeví odchylka, určit konkrétní computed hodnotu, viewport, zdrojový selector a pořadí kaskády. Nevymazávat automaticky odlišné deklarace.
3. Teprve následně konsolidovat vybranou součást (například jedinou mapovou komponentu nebo mobilní navigaci) v odděleném balíku s testem před/po.
4. Nemanipulovat s žádnou Supabase databází; HRA-P2-10 zůstává BLOCKED do schválení možných nákladů.

Tento dokument je **audit**, ne příkaz k automatickému sloučení CSS. Za autoritativní ověření vzhledu se považuje běh aplikace v prohlížeči a kontrola na skutečném zařízení.
