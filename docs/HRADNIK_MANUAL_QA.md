# Hradník – stručná kontrola PC a mobilu

**Aktualizováno:** 19. 10. 2026  
**Testovaná aplikace:** https://hradnik.vercel.app  
**Účel:** potvrdit ručně chování po migraci na samostatnou Supabase, bezpečnost přihlášení, ukládání návštěv a výsledný vzhled. Testovat **stejným účtem** na PC i na mobilu. Není třeba posílat hesla ani tokeny.

## A. PC + mobil – klíčová kontrola (oba přístroje)

1. **Spuštění / přihlášení:** aplikace se normálně načte a zobrazí památky. Přihlas se, obnov stránku a případně aplikaci zavři a znovu otevři. Účet musí zůstat přihlášený, bez hlášky o vypršení relace.
2. **Navigace a vzhled:** projdi **Mapa, Seznam, Oblíbené, Kategorie, O aplikaci**. Zkontroluj hlavičku, mapu, postranní/spodní menu, vyhledávání a detail. Žádné překrytí, uříznuté ovládání ani dvojité menu.
3. **Detaily:** otevři první památku, potom druhou a třetí bez zavření předchozího detailu (případně přes značky v mapě). Vždy je otevřené jen **jedno okno**; jeden křížek zavře poslední detail.
4. **Ukládání:** vyber **jednu testovací památku**, poznamenej její původní stav a zkus `Chceme navštívit`, `Oblíbené`, `Navštívili jsme` a nastavení **data návštěvy**. Zavři detail, znovu ho otevři a ověř uložené hodnoty. Vrať testovací památku do původního stavu.
5. **Rychlá změna:** u testovací památky stiskni `Chceme navštívit` a **hned** otevři jinou památku, následně ji zavři. První památka musí zůstat správně označená a druhý detail nesmí samovolně zmizet. Změnu zase případně vrať.

## B. Synchronizace a výpadek serveru

6. **PC → mobil:** na PC označ jednu památku jako oblíbenou. Na mobilu pod **stejným účtem** Hradník obnov a ověř, že ji vidíš v Oblíbených. Udělej i opačný směr a nakonec vrať původní stav.
7. **Offline katalog:** nech aplikaci nejdřív normálně načíst na PC/mobilu, potom krátce vypni internet a obnov stránku. U uloženého katalogu očekávej srozumitelné české upozornění a použitelný Seznam (u některých typů prohlížečů může offline obnova celé aplikace záviset na instalaci PWA). Po připojení internetu vše opět funguje.
8. **Ověření účtu:** při běžném přepínání obrazovek a obnovení po krátkém výpadku by tě Hradník neměl bezdůvodně odhlásit. **Nesimuluj ručně 401 ani nemaž cookies/tokeny** – tyto scénáře pokrývá automatický test.

## C. Jen pokud tyto části používáš

9. **Fotky a popisy:** otevři několik památek; obrázky a popisy se mají načíst bez prázdných nebo cizích panelů. Fotky mohou pocházet z externích historických zdrojů, takové výpadky prosím označ konkrétní památkou.
10. **Administrace / kontrola kvality:** otevři správu a kontrolu kvality, ověř načtení seznamů, přístupová práva a navigaci. **Neměň ani nemaž reálné záznamy kvůli testu**, pokud to není nutné.

## Vyhodnocení a uzavření

Stačí zpráva např.: **PC: 1–5 OK; mobil: 1–5 OK; sync: 6 OK; offline: 7 OK; fotky/admin: 9–10 OK**. U případné chyby napiš číslo bodu, zařízení, co se stalo, a přilož jeden screenshot.

- **HRA-P2-14:** lze uzavřít po bodech 3–5.
- **HRA-P0-01, P0-02, P0-04, P0-06:** technické testy + body 1, 6, 8 a podle používaných funkcí bod 10; pro úplné uzavření migrace je vhodná i kontrola skutečných požadavků v konzoli/Network.
- **HRA-P0-05:** bod 7 a kontrola chybových hlášek.
- **HRA-P0-03 / HRA-P2-10:** **nelze uzavřít** tímto uživatelským testem, dokud nebude ověřen čistý DB restore na oddělené testovací Supabase. Stará Supabase se nemaže.
