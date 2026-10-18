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

## Další bezpečný postup

1. Nejdříve ověřit oba CI workflow na commitu s těmito kontrakty.
2. Když se objeví odchylka, určit konkrétní computed hodnotu, viewport, zdrojový selector a pořadí kaskády. Nevymazávat automaticky odlišné deklarace.
3. Teprve následně konsolidovat vybranou součást (například jedinou mapovou komponentu nebo mobilní navigaci) v odděleném balíku s testem před/po.
4. Nemanipulovat s žádnou Supabase databází; HRA-P2-10 zůstává BLOCKED do schválení možných nákladů.

Tento dokument je **audit**, ne příkaz k automatickému sloučení CSS. Za autoritativní ověření vzhledu se považuje běh aplikace v prohlížeči a kontrola na skutečném zařízení.
