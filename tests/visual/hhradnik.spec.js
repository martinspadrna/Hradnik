import { test, expect } from '@playwright/test'

const samplePlaces = [
  { id: 0, name: 'Karlštejn', kind: 'Hrad', character: 'dochovaný hrad', district: 'Beroun', region: 'Středočeský', municipality: 'Karlštejn', latitude: 49.939, longitude: 14.188, description: 'Gotický hrad Karla IV.', official_url: null, ticket_url: null, opening_hours: null, ticket_prices: null, photo_urls: [] },
  { id: 1, name: 'Hrad Test', kind: 'Hrad', character: 'dochovaný hrad', district: 'Trutnov', region: 'Královéhradecký', municipality: 'Hostinné', latitude: 50.54, longitude: 15.72, description: 'Dochovaný hrad', official_url: null, ticket_url: null, opening_hours: null, ticket_prices: null, photo_urls: [] },
  { id: 2, name: 'Zřícenina Test', kind: 'Zřícenina', character: 'zřícenina', district: 'Jičín', region: 'Královéhradecký', municipality: 'Testov', latitude: 50.44, longitude: 15.35, description: 'Zřícenina hradu', official_url: null, ticket_url: null, opening_hours: null, ticket_prices: null, photo_urls: [] },
  { id: 3, name: 'Zámek Test', kind: 'Zámek', character: 'zaniklý', district: 'Náchod', region: 'Královéhradecký', municipality: 'Testov', latitude: 50.41, longitude: 16.16, description: 'Zaniklý objekt', official_url: null, ticket_url: null, opening_hours: { po: '9:00–17:00' }, ticket_prices: { adult: 180 }, photo_urls: [] },
  { id: 4, name: 'Tvrz Test', kind: 'Tvrz', character: 'domnělá tvrz', district: 'Hradec Králové', region: 'Královéhradecký', municipality: 'Testov', latitude: 50.20, longitude: 15.83, description: 'Domnělé terénní pozůstatky', official_url: null, ticket_url: null, opening_hours: null, ticket_prices: null, photo_urls: [] },
  { id: 5, name: 'Klášter Test', kind: 'Klášter', character: 'dochovaný klášter', district: 'Liberec', region: 'Liberecký', municipality: 'Testov', latitude: 50.77, longitude: 15.05, description: 'Dochovaný klášter', official_url: null, ticket_url: null, opening_hours: null, ticket_prices: null, photo_urls: [] }
]

async function mockBackend(page, loggedIn = true, options = {}) {
  await page.addInitScript(loggedIn => {
    // Seed once per tab, not on every reload: otherwise tests could falsely
    // restore an auth token that the application incorrectly removed.
    if (sessionStorage.getItem('hradnik-visual-auth-seeded')) return
    sessionStorage.setItem('hradnik-visual-auth-seeded', '1')
    if (loggedIn) localStorage.setItem('hradnik_session', 'visual-regression-session')
    else localStorage.removeItem('hradnik_session')
  }, loggedIn)

  await page.route('**/rest/v1/hradnik_places*', route => {
    if (options.catalogFailure) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'temporary backend failure' }) })
    }
    if (route.request().url().includes('info_summary')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Hrad Test',
          info_summary: 'Ověřený popis Hrad Test',
          info_source: 'Hrady.cz',
          info_source_url: 'https://example.test/hrad-test',
          info_updated_at: '2026-10-03T00:00:00Z',
          info_confidence: 0.95,
          info_status: 'verified'
        })
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-5/6' },
      body: JSON.stringify(samplePlaces)
    })
  })

  await page.route('**/functions/v1/hradnik-photo', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ url: '/hradnik-app-icon.svg' })
  }))

  // The admin/quality flows are deliberately isolated from live account data.
  // All mutations are rejected, even if a test accidentally clicks a save button.
  await page.route('**/functions/v1/hradnik-admin', route => {
    const action = route.request().postDataJSON()?.action
    options.adminActions?.push(action)
    if (!loggedIn || !options.adminAccess) {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Přístup mají jen administrátoři.' }) })
    }
    if (action === 'me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'visual-admin', username: 'visual-admin', role: 'admin' } }) })
    if (action === 'list') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: samplePlaces }) })
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'Zápis není v testu povolen.' }) })
  })
  await page.route('**/functions/v1/hradnik-quality', route => {
    const action = route.request().postDataJSON()?.action
    options.qualityActions?.push(action)
    if (!loggedIn || !options.adminAccess || options.qualityDenied) {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Přístup mají jen administrátoři.' }) })
    }
    if (action === 'list') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [
      { ...samplePlaces[1], quality_score: 42, quality_reason: 'K ověření' },
      { ...samplePlaces[2], quality_score: 35, quality_reason: 'Chybí zdroj' }
    ] }) })
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'Zápis není v testu povolen.' }) })
  })

  const mockStates = new Map([[1, { place_id: 1, status: 'visited', favorite: true, rating: 5, visited_on: '2026-08-01', note: 'Testovací návštěva' }]])
  await page.route('**/functions/v1/hradnik-auth', async route => {
    let body = {}
    try { body = route.request().postDataJSON() || {} } catch {}
    if (!loggedIn) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) })
    if (body.action === 'session') {
      if (options.sessionNetworkFailure) return route.abort('failed')
      if (options.sessionErrorStatus) return route.fulfill({ status: options.sessionErrorStatus, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary session check failure' }) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'visual-test', username: 'visual-test' } }) })
    }
    if (body.action === 'me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'visual-test', username: 'visual-test' } }) })
    if (body.action === 'state_list') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: [...mockStates.values()] }) })
    if (body.action === 'state_upsert') {
      if (options.stateWriteDelayMs) await new Promise(resolve => setTimeout(resolve, options.stateWriteDelayMs))
      const state = { place_id: Number(body.place_id), status: body.status ?? 'none', favorite: !!body.favorite, rating: body.rating ?? 0, note: body.note ?? '', visited_on: body.visited_on ?? null }
      mockStates.set(state.place_id, state)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
}

async function openApp(page, loggedIn = true, options = {}) {
  await mockBackend(page, loggedIn, options)
  await page.goto('/')
  const nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await expect(nav).toHaveCount(5, { timeout: 15000 })
  await expect(page.locator('.redesign-sidebar')).toBeVisible()
  await expect(page.locator('header')).toBeVisible()
  return nav
}

async function waitDestination(page, index) {
  if (index === 0) await expect(page.locator('#map')).toBeVisible({ timeout: 10000 })
  if (index === 1) await expect(page.locator('#search')).toBeVisible()
  if (index === 2) await expect(page.locator('#mineList')).toBeVisible()
  if (index === 3) await expect(page.locator('.reference-category-page')).toBeVisible()
  if (index === 4) await expect(page.locator('.reference-about-page')).toBeVisible()
}

async function closeMapDetailIfOpen(page) {
  const close = page.locator('.overlay .close')
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await expect(page.locator('.overlay')).toHaveCount(0)
  }
}

test('captures all five reference destinations', async ({ page }, testInfo) => {
  const nav = await openApp(page)
  const labels = ['mapa','seznam','oblibene','kategorie','o-aplikaci']

  for (let i = 0; i < 4; i++) {
    await nav.nth(i).click()
    await waitDestination(page, i)
    await page.waitForTimeout(i === 0 ? 900 : 220)
    await page.screenshot({
      path: testInfo.outputPath(`hradnik-${testInfo.project.name}-${String(i + 1).padStart(2, '0')}-${labels[i]}.png`),
      fullPage: true
    })
  }

  if (testInfo.project.name === 'desktop') {
    await nav.nth(4).click()
  } else {
    await page.locator('.mobileHeaderMenu').click()
    await expect(page.locator('.reference-mobile-drawer')).toHaveClass(/open/)
    await page.locator('[data-ref-mobile="about"]').click()
  }
  await waitDestination(page, 4)
  await page.waitForTimeout(220)
  await page.screenshot({
    path: testInfo.outputPath(`hradnik-${testInfo.project.name}-05-${labels[4]}.png`),
    fullPage: true
  })
})

test('desktop/mobile shell matches the reference structure', async ({ page }) => {
  const nav = await openApp(page)
  await expect(nav.nth(0)).toContainText('Mapa')
  await expect(nav.nth(1)).toContainText('Seznam')
  await expect(nav.nth(2)).toContainText('Oblíbené')
  await expect(nav.nth(3)).toContainText('Kategorie')
  await expect(nav.nth(4)).toContainText('O aplikaci')

  if (test.info().project.name === 'desktop') {
    const sidebarBox = await page.locator('.redesign-sidebar').boundingBox()
    expect(sidebarBox?.width).toBeGreaterThan(180)
    expect(sidebarBox?.width).toBeLessThan(205)
    await expect(page.locator('.globalSearch')).toBeVisible()
    await expect(page.locator('.reference-favorites-button')).toBeVisible()
    await expect(page.locator('.reference-settings-button')).toBeVisible()
  } else {
    await expect(page.locator('.mobileHeaderMenu')).toBeVisible()
    await expect(page.locator('.mobileHeaderSearch')).toBeVisible()
    await expect(nav.nth(4)).toBeHidden()
  }
})

test('CSS cascade preserves desktop shell and map geometry at 851 1280 1536 px', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop')
  test.setTimeout(60_000)
  const nav = await openApp(page)
  for (const width of [851, 1280, 1536]) {
    await page.setViewportSize({ width, height: 1024 })
    await page.reload()
    await expect(nav).toHaveCount(5)
    await nav.nth(0).click()
    await expect(page.locator('#map')).toBeVisible()
    await expect(page.locator('.reference-map-dashboard .map-layout')).toBeVisible()

    let layout
    await expect.poll(async () => {
      layout = await page.evaluate(() => {
      const header = document.querySelector('header')
      const rail = document.querySelector('.redesign-sidebar')
      const main = document.querySelector('main.wrap')
      const map = document.querySelector('#map')
      const mapLayout = document.querySelector('.reference-map-dashboard .map-layout')
      const focus = document.querySelector('.reference-map-dashboard .map-focus-card')
      const navButton = document.querySelector('.redesign-sidebar .redesign-nav > button')
      if (!header || !rail || !map || !mapLayout || !navButton || !main || !focus) return null
      const rect = e => e.getBoundingClientRect()
      return {
        headerPosition: getComputedStyle(header).position,
        headerHeight: rect(header).height,
        railPosition: getComputedStyle(rail).position,
        railRect: { x: rect(rail).x, y: rect(rail).y, width: rect(rail).width },
        navButtonDisplay: getComputedStyle(navButton).display,
        navButtonHeight: rect(navButton).height,
        contentX: rect(main).x,
        mapLayoutDisplay: getComputedStyle(mapLayout).display,
        mapHeight: rect(map).height,
        focusDisplay: getComputedStyle(focus).display,
        focusWidth: rect(focus).width
      }
      })
      return layout !== null
    }, { timeout: 10_000, message: `Wait for stable shell at ${width}px` }).toBe(true)

    expect(layout.headerPosition, `header at ${width}px`).toBe('fixed')
    expect(layout.headerHeight, `header height at ${width}px`).toBeGreaterThanOrEqual(80)
    expect(layout.headerHeight).toBeLessThanOrEqual(92)
    expect(layout.railPosition, `side rail at ${width}px`).toBe('fixed')
    expect(layout.railRect.x).toBeGreaterThanOrEqual(-2)
    expect(layout.railRect.x).toBeLessThanOrEqual(2)
    expect(layout.railRect.width).toBeGreaterThanOrEqual(188)
    expect(layout.railRect.width).toBeLessThanOrEqual(202)
    expect(layout.navButtonDisplay, `desktop nav at ${width}px`).toBe('flex')
    expect(layout.navButtonHeight).toBeGreaterThan(42)
    expect(layout.navButtonHeight).toBeLessThan(75)
    expect(layout.contentX, `content clearance at ${width}px`).toBeGreaterThanOrEqual(185)
    expect(layout.mapLayoutDisplay).toBe('grid')
    expect(layout.mapHeight).toBeGreaterThanOrEqual(480)
    expect(layout.focusDisplay).not.toBe('none')
    expect(layout.focusWidth).toBeGreaterThanOrEqual(295)
    expect(layout.focusWidth).toBeLessThanOrEqual(320)
  }
})

test('CSS cascade preserves mobile shell and map clearance at 375 390 520 850 px', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone')
  test.setTimeout(60_000)
  const nav = await openApp(page)
  for (const width of [375, 390, 520, 850]) {
    await page.setViewportSize({ width, height: 844 })
    await page.reload()
    await expect(nav).toHaveCount(5)
    await expect(page.locator('.mobileHeaderMenu')).toBeVisible()
    await expect(page.locator('.mobileHeaderSearch')).toBeVisible()
    await nav.nth(0).click()
    await expect(page.locator('#map')).toBeVisible()
    await expect(page.locator('.reference-map-dashboard .map-layout')).toBeVisible()

    let layout
    await expect.poll(async () => {
      layout = await page.evaluate(() => {
      const header = document.querySelector('header')
      const rail = document.querySelector('.redesign-sidebar')
      const map = document.querySelector('#map')
      const mapLayout = document.querySelector('.reference-map-dashboard .map-layout')
      const focus = document.querySelector('.reference-map-dashboard .map-focus-card')
      const navButton = document.querySelector('.redesign-sidebar .redesign-nav > button')
      if (!header || !rail || !map || !mapLayout || !navButton) return null
      const rect = e => e.getBoundingClientRect()
      return {
        headerRect: { y: rect(header).y, bottom: rect(header).bottom, height: rect(header).height },
        railPosition: getComputedStyle(rail).position,
        railRect: { x: rect(rail).x, y: rect(rail).y, width: rect(rail).width },
        navButtonDisplay: getComputedStyle(navButton).display,
        navButtonHeight: rect(navButton).height,
        navButtonDirection: getComputedStyle(navButton).flexDirection,
        mapRect: { y: rect(map).y, bottom: rect(map).bottom, width: rect(map).width },
        mapLayoutDisplay: getComputedStyle(mapLayout).display,
        // On mobile, the desktop-only focus panel may be hidden or not mounted.
        focusDisplay: focus ? getComputedStyle(focus).display : 'none',
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      }
      })
      return layout !== null
    }, { timeout: 10_000, message: `Wait for stable shell at ${width}px` }).toBe(true)

    expect(layout.headerRect.height, `mobile header at ${width}px`).toBeGreaterThan(38)
    expect(layout.headerRect.height).toBeLessThanOrEqual(84)
    expect(layout.railPosition).toBe('fixed')
    expect(layout.railRect.x).toBeGreaterThanOrEqual(-2)
    expect(layout.railRect.x).toBeLessThanOrEqual(2)
    expect(Math.abs(layout.railRect.width - layout.viewportWidth)).toBeLessThanOrEqual(3)
    expect(layout.navButtonDisplay, `mobile nav at ${width}px`).toBe('flex')
    expect(layout.navButtonDirection, `mobile nav direction at ${width}px`).toBe('column')
    expect(layout.navButtonHeight).toBeGreaterThan(43)
    expect(layout.navButtonHeight).toBeLessThan(90)
    expect(layout.railRect.y, `bottom rail at ${width}px`).toBeGreaterThan(layout.viewportHeight - 135)
    expect(layout.mapLayoutDisplay).toBe('block')
    expect(layout.focusDisplay).toBe('none')
    expect(layout.mapRect.y, `map below header at ${width}px`).toBeGreaterThanOrEqual(layout.headerRect.bottom - 3)
    expect(layout.mapRect.bottom, `map above bottom rail at ${width}px`).toBeLessThanOrEqual(layout.railRect.y + 3)
    expect(layout.mapRect.width).toBeGreaterThan(width - 20)
  }
})

test('list search, categories and favorites route to useful screens', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(1).click()
  await expect(page.locator('#search')).toBeVisible()
  await page.locator('#search').fill('Hrad Test')
  await expect(page.locator('#list .place')).toHaveCount(1)

  await nav.nth(3).click()
  await expect(page.locator('.reference-category-card')).toHaveCount(6)
  await page.locator('.reference-category-card').filter({ hasText: 'Zřícenina' }).click()
  await expect(page.locator('#list')).toBeVisible()

  const currentNav = page.locator('.redesign-sidebar .redesign-nav > button')
  await currentNav.nth(2).click()
  await expect(page.locator('#mineList')).toBeVisible()
})

test('desktop catalog cards keep readable widths', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop')
  const nav = await openApp(page)
  await nav.nth(1).click()

  const card = page.locator('#list .place').first()
  await expect(card).toBeVisible()
  const cardBox = await card.boundingBox()
  const mediaBox = await card.locator('.placeIcon,.placePhoto').first().boundingBox()
  const copyBox = await card.locator('.placeCopy').boundingBox()

  expect(cardBox?.width).toBeGreaterThanOrEqual(280)
  expect(mediaBox?.width).toBeLessThanOrEqual(100)
  expect(copyBox?.width).toBeGreaterThanOrEqual(115)
})

test('desktop recent cards keep usable widths', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop')
  await page.addInitScript(items => {
    localStorage.setItem('hradnik_recent_places_v1', JSON.stringify(items))
  }, [
    { name: 'Hrádek u Nechanic', kind: 'Zámek', location: 'Hradec Králové' },
    { name: 'Znojmo – hradní areál', kind: 'Hrad', location: 'Znojmo' },
    { name: 'Augustiniánský klášter', kind: 'Klášter', location: 'Brno' },
    { name: 'Zřícenina hradu Trosky', kind: 'Zřícenina', location: 'Semily' },
    { name: 'Tvrz dlouhého názvu', kind: 'Tvrz', location: 'Česko' }
  ])

  const nav = await openApp(page)
  await nav.nth(0).click()

  const cards = page.locator('.reference-recent-card')
  await expect(cards).toHaveCount(5)
  const widths = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(180)
  await expect(cards.first().locator('.reference-recent-copy b')).toHaveText('Hrádek u Nechanic')
})

test('mobile catalog filters stay reachable and preservation select stays dark', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone')
  const nav = await openApp(page)
  await nav.nth(1).click()

  const chips = page.locator('#typeChips')
  await expect(chips).toBeVisible()
  const metrics = await chips.evaluate(el => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth,
    overflowX: getComputedStyle(el).overflowX,
    wrap: getComputedStyle(el).flexWrap
  }))
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  expect(metrics.overflowX).toBe('auto')
  expect(metrics.wrap).toBe('nowrap')

  const lastChip = chips.locator('button').last()
  await lastChip.scrollIntoViewIfNeeded()
  const box = await lastChip.boundingBox()
  const viewport = page.viewportSize()
  expect(box).toBeTruthy()
  expect(viewport).toBeTruthy()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

  const preservation = page.locator('#preservation')
  await expect(preservation).toBeVisible()
  const style = await preservation.evaluate(el => {
    const s = getComputedStyle(el)
    return { color: s.color, backgroundColor: s.backgroundColor, colorScheme: s.colorScheme }
  })
  expect(style.colorScheme).toContain('dark')
  expect(style.color).not.toBe(style.backgroundColor)
})


test('mobile header uses one compact safe-area height', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone')
  const nav = await openApp(page)
  const header = page.locator('header')
  const menu = page.locator('.mobileHeaderMenu')
  const search = page.locator('.mobileHeaderSearch')
  const headerBox = await header.boundingBox()
  const menuBox = await menu.boundingBox()
  const searchBox = await search.boundingBox()

  expect(headerBox).toBeTruthy()
  expect(menuBox).toBeTruthy()
  expect(searchBox).toBeTruthy()
  expect(headerBox.height).toBeLessThanOrEqual(72)
  expect(menuBox.height).toBeGreaterThanOrEqual(40)
  expect(searchBox.height).toBeGreaterThanOrEqual(40)

  await nav.nth(0).click()
  const mapBox = await page.locator('#map').boundingBox()
  const bottomNavBox = await page.locator('.redesign-sidebar').boundingBox()
  expect(mapBox).toBeTruthy()
  expect(bottomNavBox).toBeTruthy()
  const headerBottom = headerBox.y + headerBox.height
  const mapBottom = mapBox.y + mapBox.height
  expect(mapBox.y).toBeGreaterThanOrEqual(headerBottom - 2)
  expect(mapBottom).toBeLessThanOrEqual(bottomNavBox.y + 2)

  await menu.click()
  const drawerBox = await page.locator('.reference-mobile-drawer').boundingBox()
  expect(drawerBox).toBeTruthy()
  expect(Math.abs(drawerBox.y - headerBottom)).toBeLessThanOrEqual(2)
})

test('iphone map filters and attribution stay above bottom navigation', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone')
  const nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()

  const filter = page.locator('.reference-map-dashboard .reference-filter-button')
  const attribution = page.locator('.reference-map-dashboard .leaflet-control-attribution')
  const styleControl = page.locator('.hradnik-map-style')
  const bottomNav = page.locator('.redesign-sidebar')
  await expect(filter).toBeVisible()
  await expect(attribution).toBeVisible()
  await expect(styleControl).toBeVisible()
  const [f, a, s, n] = await Promise.all([
    filter.boundingBox(), attribution.boundingBox(),
    styleControl.boundingBox(), bottomNav.boundingBox()
  ])
  expect(f && a && s && n).toBeTruthy()
  expect(f.y).toBeGreaterThanOrEqual(s.y + s.height + 6)
  expect(f.y + f.height).toBeLessThanOrEqual(n.y - 6)
  expect(a.y + a.height).toBeLessThanOrEqual(n.y - 6)

  await filter.click()
  const panel = page.locator('.reference-map-dashboard > .mapFilters.reference-filter-open')
  await expect(panel).toBeVisible()
  const box = await panel.boundingBox()
  expect(box).toBeTruthy()
  expect(box.y + box.height).toBeLessThanOrEqual(n.y - 6)
})

test('catalog uses the same card DOM and data contract on desktop and iphone', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(1).click()

  await page.locator('#preservation').selectOption('all')
  const cards = page.locator('#list .place')
  await expect(cards).toHaveCount(samplePlaces.length)
  const first = cards.first()
  await expect(first.locator(':scope > .placeMain')).toHaveCount(1)
  await expect(first.locator('.placeCopy')).toHaveCount(1)
  await expect(first.locator('.placeCopy > b')).toContainText('Karlštejn')
  await expect(first.locator('.placeCopy > small')).toHaveCount(2)
  await expect(first.locator('.quick button')).toHaveCount(2)
  await expect(first.locator('.placeIcon,.placePhoto')).toHaveCount(1)

  await first.locator('.placeMain').click()
  const detail = page.locator('.overlay .sheet')
  await expect(detail).toBeVisible()
  await expect(detail.locator('h1')).toHaveText('Karlštejn')
  await expect(detail.locator('.detailGrid .card')).toHaveCount(3)
})

test('opening another monument replaces the existing detail rather than stacking sheets', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(1).click()
  await page.locator('#preservation').selectOption('all')
  await expect(page.locator('#list .placeMain')).toHaveCount(samplePlaces.length)

  const cards = page.locator('#list .place')
  const titles = (await cards.locator('.placeCopy > b').allTextContents()).map(name => name.replace(/★/g, '').trim())
  await cards.first().locator('.placeMain').click()
  await expect(page.locator('.overlay')).toHaveCount(1)
  await expect(page.locator('.overlay .sheet h1')).toHaveText(titles[0])

  await page.locator('.overlay #want').click()
  await expect(page.locator('.overlay #want')).toHaveAttribute('aria-pressed', 'true')

  // Simulate selecting another castle while the first detail still exists,
  // as may happen through Leaflet's marker click handlers.
  await page.evaluate(() => document.querySelectorAll('#list .placeMain')[1].click())
  await expect(page.locator('.overlay')).toHaveCount(1)
  await expect(page.locator('.overlay .sheet h1')).toHaveText(titles[1])

  await page.evaluate(() => document.querySelectorAll('#list .placeMain')[2].click())
  await expect(page.locator('.overlay')).toHaveCount(1)
  await expect(page.locator('.overlay .sheet h1')).toHaveText(titles[2])

  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)

  await page.locator('#list .placeMain').first().click()
  await expect(page.locator('.overlay #want')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)
})

test('switching details during an in-flight save keeps the latest sheet and refreshes cards', async ({ page }) => {
  const nav = await openApp(page, true, { stateWriteDelayMs: 320 })
  await nav.nth(1).click()
  await page.locator('#preservation').selectOption('all')
  await expect(page.locator('#list .place')).toHaveCount(samplePlaces.length)

  await page.locator('#list .placeMain').first().click()
  const saved = page.waitForResponse(response => {
    if (!response.url().includes('/functions/v1/hradnik-auth')) return false
    return response.request().postDataJSON()?.action === 'state_upsert'
  })
  await page.locator('.overlay #want').click()
  await page.evaluate(() => document.querySelectorAll('#list .placeMain')[1].click())
  await expect(page.locator('.overlay[data-hradnik-detail-context]')).toHaveCount(1)
  await expect(page.locator('.overlay .sheet h1')).toHaveText('Hrad Test')
  await saved
  await expect(page.locator('.overlay .sheet h1')).toHaveText('Hrad Test')
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)
  await expect(page.locator('#list .place').first().locator('.quick > button.want')).toHaveAttribute('aria-pressed', 'true')

  await page.locator('#list .placeMain').first().click()
  await expect(page.locator('.overlay #want')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.overlay .close').click()
})

test('closing a sheet before its save finishes still updates visible place state', async ({ page }) => {
  const nav = await openApp(page, true, { stateWriteDelayMs: 320 })
  await nav.nth(1).click()
  await page.locator('#preservation').selectOption('all')
  await page.locator('#list .placeMain').first().click()
  const saved = page.waitForResponse(response =>
    response.url().includes('/functions/v1/hradnik-auth') &&
    response.request().postDataJSON()?.action === 'state_upsert'
  )
  await page.locator('.overlay #want').click()
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)
  await saved
  await expect(page.locator('#list .place').first().locator('.quick > button.want')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.overlay')).toHaveCount(0)
})

test('consecutive Leaflet marker selections keep a single monument detail', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(() => page.evaluate(() =>
    (window.__hradnikMap?._hradnikReferenceOriginals || []).filter(layer => layer._map && layer.getTooltip?.()).length
  )).toBeGreaterThanOrEqual(3)

  const names = await page.evaluate(() => {
    const layers = (window.__hradnikMap?._hradnikReferenceOriginals || []).filter(layer => layer._map && layer.getTooltip?.()).slice(0, 3)
    const titles = []
    for (const layer of layers) {
      titles.push(layer.getTooltip().getContent())
      layer.fire('click', { latlng: layer.getLatLng(), layer })
      if (document.querySelectorAll('.overlay[data-hradnik-detail-context]').length !== 1) throw new Error('Stacked detail overlays')
    }
    return titles
  })
  expect(names).toHaveLength(3)
  await expect(page.locator('.overlay[data-hradnik-detail-context]')).toHaveCount(1)
  await expect(page.locator('.overlay .sheet h1')).toHaveText(names[2])
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)
})

test('visit date, favorites and toggles preserve account state', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(1).click()
  await page.locator('#preservation').selectOption('all')
  await page.locator('#list .placeMain').first().click()

  const detail = page.locator('.overlay .sheet')
  const visit = detail.locator('#visit')
  const want = detail.locator('#want')
  const fav = detail.locator('#fav')
  const date = detail.locator('#visitDate')
  await expect(date).toBeHidden()
  await visit.click()
  await expect(visit).toHaveAttribute('aria-pressed', 'true')
  await expect(visit).toContainText('odebrat')
  await expect(date).toBeVisible()
  await expect(date).toHaveValue(/^\d{4}-\d{2}-\d{2}$/)

  const dateSaved = page.waitForResponse(r => r.url().includes('/hradnik-auth') && r.request().postDataJSON()?.visited_on === '2024-05-20')
  await date.fill('2024-05-20')
  await dateSaved
  await expect(fav).toBeEnabled()
  await expect(date).toHaveValue('2024-05-20')
  await fav.click()
  await expect(fav).toHaveAttribute('aria-pressed', 'true')
  await expect(date).toHaveValue('2024-05-20')

  await detail.locator('.close').click()
  await page.locator('#list .placeMain').first().click()
  await expect(page.locator('.overlay #visitDate')).toHaveValue('2024-05-20')
  await expect(page.locator('.overlay #fav')).toHaveAttribute('aria-pressed', 'true')

  await want.click()
  await expect(want).toHaveAttribute('aria-pressed', 'true')
  await expect(want).toContainText('odebrat')
  await expect(date).toBeHidden()
  await expect(fav).toHaveAttribute('aria-pressed', 'true')
  await want.click()
  await expect(want).toHaveAttribute('aria-pressed', 'false')
  await fav.click()
  await expect(fav).toHaveAttribute('aria-pressed', 'false')
})

test('map, list detail and settings remain interactive', async ({ page }) => {
  let nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await page.waitForTimeout(500)
  await closeMapDetailIfOpen(page)

  const mapTypes = page.locator('#mapTypes button')
  if (await mapTypes.count()) {
    await page.locator('.reference-filter-button').click()
    const ruinFilter = mapTypes.filter({ hasText: 'Zřícenina' })
    await expect(ruinFilter).toBeVisible()
    await ruinFilter.click()
    await expect(page.locator('#map')).toBeVisible()
  }

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(1).click()
  await expect(page.locator('.place').first()).toBeVisible()
  await page.locator('.placeMain').first().click()
  await expect(page.locator('.overlay .sheet')).toBeVisible()
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)

  if (test.info().project.name === 'desktop') {
    await page.locator('.reference-settings-button').click()
  } else {
    await page.locator('.mobileHeaderMenu').click()
    await page.locator('[data-ref-mobile="settings"]').click()
  }
  await expect(page.locator('.reference-settings-panel')).toBeVisible()
  await expect(page.locator('.reference-check-update')).toBeVisible()
  await page.locator('.reference-settings-close').click()
})

test('map lifecycle stays singular across filters, styles, zoom and navigation', async ({ page }) => {
  let nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()

  await expect.poll(async () => page.evaluate(() => {
    const map = window.__hradnikMap
    return !!map && !!map._container?.isConnected
  })).toBe(true)

  const firstMapId = await page.evaluate(() => window.__hradnikMap?._leaflet_id)
  expect(firstMapId).toBeTruthy()
  await expect(page.locator('#map')).toHaveCount(1)

  await page.locator('.reference-filter-button').click()
  const ruin = page.locator('#mapTypes button').filter({ hasText: 'Zřícenina' })
  await expect(ruin).toBeVisible()
  await ruin.click()
  await expect(page.locator('#map')).toBeVisible()

  await expect.poll(async () => page.evaluate(() => window.__hradnikMap?._leaflet_id)).not.toBe(firstMapId)
  const filteredMapId = await page.evaluate(() => window.__hradnikMap?._leaflet_id)
  await expect(page.locator('#map')).toHaveCount(1)

  const styleButtons = page.locator('.hradnik-map-style button')
  await expect(styleButtons).toHaveCount(2)
  await styleButtons.filter({ hasText: 'Mapa' }).click()
  await expect.poll(async () => page.evaluate(() => window.__hradnikMap?._hradnikMapStyle)).toBe('map')
  await styleButtons.filter({ hasText: 'Satelit' }).click()
  await expect.poll(async () => page.evaluate(() => window.__hradnikMap?._hradnikMapStyle)).toBe('satellite')
  const tileLayerCount = await page.evaluate(() => {
    let count = 0
    window.__hradnikMap?.eachLayer(layer => {
      if (window.L && layer instanceof window.L.TileLayer) count += 1
    })
    return count
  })
  expect(tileLayerCount).toBe(1)

  await page.evaluate(() => window.__hradnikMap?.setZoom(11, { animate: false }))
  await expect.poll(async () => page.locator('.hradnik-reference-marker').count()).toBeGreaterThan(0)
  const markerCount = await page.locator('.hradnik-reference-marker').count()

  await page.evaluate(() => window.__hradnikMap?.setZoom(10, { animate: false }))
  await page.evaluate(() => window.__hradnikMap?.setZoom(11, { animate: false }))
  await page.waitForTimeout(1100)
  expect(await page.locator('.hradnik-reference-marker').count()).toBe(markerCount)

  const opened = await page.evaluate(() => {
    const layer=(window.__hradnikMap?._hradnikReferenceOriginals||[]).find(item=>item?._map&&item.getLatLng)
    if(!layer)return false
    layer.fire('click',{latlng:layer.getLatLng(),layer})
    return true
  })
  expect(opened).toBe(true)
  await expect(page.locator('.overlay .sheet')).toBeVisible()
  expect(await page.evaluate(() => window.__hradnikMap?._leaflet_id)).toBe(filteredMapId)
  await page.locator('.overlay .close').click()
  await expect(page.locator('.overlay')).toHaveCount(0)

  if (test.info().project.name === 'desktop') {
    nav = page.locator('.redesign-sidebar .redesign-nav > button')
    await nav.nth(1).click()
    await expect(page.locator('#list')).toBeVisible()
    nav = page.locator('.redesign-sidebar .redesign-nav > button')
    await nav.nth(0).click()
    await expect(page.locator('#map')).toBeVisible()
    await expect(page.locator('#map')).toHaveCount(1)

    const finalState = await page.evaluate(() => ({
      id: window.__hradnikMap?._leaflet_id,
      connected: !!window.__hradnikMap?._container?.isConnected,
      mapContainers: document.querySelectorAll('#map').length
    }))
    expect(finalState.id).not.toBe(filteredMapId)
    expect(finalState.connected).toBe(true)
    expect(finalState.mapContainers).toBe(1)
  } else {
    const finalState = await page.evaluate(() => ({
      id: window.__hradnikMap?._leaflet_id,
      connected: !!window.__hradnikMap?._container?.isConnected,
      mapContainers: document.querySelectorAll('#map').length
    }))
    expect(finalState.id).toBe(filteredMapId)
    expect(finalState.connected).toBe(true)
    expect(finalState.mapContainers).toBe(1)
  }
})

test('map never opens a monument detail on its own', async ({ page }) => {
  const nav = await openApp(page)
  await expect(page.locator('.overlay')).toHaveCount(0)

  await nav.nth(1).click()
  await expect(page.locator('#list')).toBeVisible()
  await page.locator('.redesign-sidebar .redesign-nav > button').nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect(page.locator('.overlay')).toHaveCount(0)
})

test('selected search result has a photo and carries its map focus', async ({ page }) => {
  const nav = await openApp(page)
  await nav.nth(1).click()
  await page.locator('#search').fill('Hrad Test')
  const result = page.locator('#list .place').first()
  await expect(result.locator('.placePhoto')).toBeVisible()
  await expect(result.locator('.placeIcon')).toHaveCount(0)
  expect(await result.locator('.placeCopy').evaluate(el => getComputedStyle(el, '::before').content)).toBe('none')

  await result.locator('.placeMain').click()
  const detail = page.locator('.overlay[data-hradnik-detail-context="list"] .sheet')
  await expect(detail).toBeVisible()
  await expect(detail.locator('h1')).toHaveText('Hrad Test')
  await expect(detail).toHaveAttribute('data-info-enriched', '1')
  const stateCard = detail.locator('.detailGrid .card').filter({ hasText: 'Stav' })
  const descriptionCard = detail.locator('.detailGrid .card').filter({ hasText: 'Popis' })
  await expect(stateCard.locator('p')).toHaveText('Navštíveno')
  await expect(descriptionCard.locator('p')).toHaveText('Ověřený popis Hrad Test')
  await expect(stateCard.locator('p')).not.toContainText('Ověřený popis')
  if (test.info().project.name === 'desktop') {
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(410)
    expect(box?.height).toBeGreaterThan(800)
  }

  await page.locator('.redesign-sidebar .redesign-nav > button').nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => {
    const center = window.__hradnikMap?.getCenter()
    return center && Math.abs(center.lat - 50.54) < 0.002 && Math.abs(center.lng - 15.72) < 0.002
  })).toBe(true)

  // "Nedávno zobrazené" is a desktop dashboard rail. On mobile the map
  // intentionally fills the available viewport and the recent rail is hidden.
  if (test.info().project.name === 'desktop') {
    const recent = page.locator('.reference-recent-card', { hasText: 'Hrad Test' })
    await expect(recent.locator('.reference-recent-photo')).toBeVisible()
    await recent.click()
    await expect(page.locator('.overlay .sheet h1')).toHaveText('Hrad Test')
    await expect.poll(async () => page.evaluate(() => {
      const center = window.__hradnikMap?.getCenter()
      return center && Math.abs(center.lat - 50.54) < 0.002 && Math.abs(center.lng - 15.72) < 0.002
    })).toBe(true)
  } else {
    await expect(page.locator('.reference-recent')).toBeHidden()
  }
})

test('catalog filters and map viewport survive navigation changes', async ({ page }) => {
  let nav = await openApp(page)
  await nav.nth(1).click()

  await page.locator('#search').fill('Test')
  await page.locator('#preservation').selectOption('all')
  await page.locator('#typeChips button').filter({ hasText: /^Hrad$/ }).click()
  await expect(page.locator('#search')).toHaveValue('Test')
  await expect(page.locator('#preservation')).toHaveValue('all')
  await expect(page.locator('#typeChips button').filter({ hasText: /^Hrad$/ })).toHaveClass(/active/)
  await expect(page.locator('#list .place')).toHaveCount(1)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await page.evaluate(() => window.__hradnikMap?.setView([50.2, 15.8], 9, { animate: false }))
  await expect.poll(async () => page.evaluate(() => window.__hradnikMap?.getZoom())).toBe(9)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(1).click()
  await expect(page.locator('#search')).toHaveValue('Test')
  await expect(page.locator('#preservation')).toHaveValue('all')
  await expect(page.locator('#typeChips button').filter({ hasText: /^Hrad$/ })).toHaveClass(/active/)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => {
    const map=window.__hradnikMap
    const c=map?.getCenter()
    return !!c && Math.abs(c.lat-50.2)<0.01 && Math.abs(c.lng-15.8)<0.01 && map.getZoom()===9
  })).toBe(true)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(2).click()
  await page.locator('#mf').click()
  await expect(page.locator('#mineList .place')).toHaveCount(1)
  await expect(page.locator('#mineList .place')).toContainText('Hrad Test')
})

test('marker refresh stops when the Leaflet map is removed', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  let nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !!window.__hradnikMap)).toBe(true)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(1).click()
  await expect(page.locator('#list')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !window.__hradnikMap)).toBe(true)

  // Longer than the old 900ms marker refresh timer.
  await page.waitForTimeout(1250)
  expect(pageErrors).toEqual([])
})

test('marker refresh polling runs only while map exists', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetInterval = window.setInterval.bind(window)
    const nativeClearInterval = window.clearInterval.bind(window)
    const active900msIntervals = new Set()
    window.__hradnikTestActiveMarkerTimers = () => active900msIntervals.size
    window.setInterval = (fn, delay, ...args) => {
      const id = nativeSetInterval(fn, delay, ...args)
      if (delay === 900) active900msIntervals.add(id)
      return id
    }
    window.clearInterval = id => {
      active900msIntervals.delete(id)
      return nativeClearInterval(id)
    }
  })

  let nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__hradnikTestActiveMarkerTimers())).toBe(1)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(1).click()
  await expect(page.locator('#list')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !window.__hradnikMap)).toBe(true)
  await expect.poll(() => page.evaluate(() => window.__hradnikTestActiveMarkerTimers())).toBe(0)

  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__hradnikTestActiveMarkerTimers())).toBe(1)
})

test('pending map size refresh cannot run after removal', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  const nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !!window.__hradnikMap)).toBe(true)

  // Wait for mobile navigation to settle, then trigger zoom and navigation
  // synchronously in the same browser task to preserve the teardown race.
  await page.evaluate(async () => {
    let listButton
    for (let frame = 0; frame < 120; frame++) {
      listButton = document.querySelectorAll('.redesign-sidebar .redesign-nav > button')[1]
      if (listButton?.isConnected) break
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    if (!listButton?.isConnected) throw new Error('List navigation button did not mount')
    const map = window.__hradnikMap
    if (!map) throw new Error('Map was not initialized')
    const invalidate = map.invalidateSize
    map.invalidateSize = function (...args) {
      if (!this._mapPane || !this._container?.isConnected) {
        throw new Error('Stale map invalidateSize called after removal')
      }
      return invalidate.apply(this, args)
    }
    window.__hradnikRemovedCanvas = map._renderer
    if (!window.__hradnikRemovedCanvas) throw new Error('Expected canvas renderer is unavailable')
    map.setZoom(map.getZoom() + 2, { animate: true })
    // Guarantee the hover layer queues its own next-frame resize before teardown.
    map.fire('moveend')
    listButton.click()
  })
  await expect(page.locator('#list')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !window.__hradnikMap)).toBe(true)
  // A queued Leaflet canvas frame must be harmless once _destroyContainer deletes _ctx.
  await page.evaluate(() => {
    const renderer = window.__hradnikRemovedCanvas
    if (renderer._ctx) throw new Error('Canvas renderer was not disposed')
    renderer._redraw()
    delete window.__hradnikRemovedCanvas
  })
  // Wait longer than the original delayed 250ms refresh and zoom callback.
  await page.waitForTimeout(700)
  expect(pageErrors).toEqual([])
})

test('core navigation stays free of application runtime errors', async ({ page }) => {
  const consoleErrors = []
  const pageErrors = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => pageErrors.push(error.message))

  let nav = await openApp(page)
  await nav.nth(0).click()
  await expect(page.locator('#map')).toBeVisible()
  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(1).click()
  await expect(page.locator('#list')).toBeVisible()
  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(2).click()
  await expect(page.locator('#mineList')).toBeVisible()
  nav = page.locator('.redesign-sidebar .redesign-nav > button')
  await nav.nth(3).click()
  await expect(page.locator('.reference-category-page')).toBeVisible()
  await page.waitForTimeout(350)

  expect(pageErrors).toEqual([])
  const appErrors = consoleErrors.filter(text =>
    /cgshssdjgzzuprlwnabl|multiple gotrueclient|multiple.*auth.*client|uncaught|unhandled|typeerror|referenceerror|syntaxerror|404.*supabase/i.test(text)
  )
  expect(appErrors).toEqual([])
})

test('all Supabase requests use the dedicated Hradník project', async ({ page }) => {
  const supabaseRequests = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.hostname.endsWith('.supabase.co')) supabaseRequests.push(url)
  })
  const nav = await openApp(page)
  await nav.nth(1).click()
  await expect(page.locator('#list .place')).toHaveCount(4)
  await page.locator('#list .placeMain').first().click()
  await expect(page.locator('.overlay .sheet')).toBeVisible()
  await page.locator('.overlay #fav').click()
  await expect(page.locator('.overlay #fav')).toHaveAttribute('aria-pressed', 'true')

  expect(supabaseRequests.some(url => url.pathname.includes('/rest/v1/hradnik_places'))).toBe(true)
  expect(supabaseRequests.some(url => url.pathname.includes('/functions/v1/hradnik-auth'))).toBe(true)
  expect(supabaseRequests.length).toBeGreaterThan(0)
  expect([...new Set(supabaseRequests.map(url => url.hostname))]).toEqual(['abqiprdggptuxebhpfyi.supabase.co'])
})

test('temporary profile verification outage preserves session and recovers on reload', async ({ page }) => {
  const options = { sessionErrorStatus: 503 }
  const sessionResponse = page.waitForResponse(response => {
    if (!response.url().includes('/functions/v1/hradnik-auth')) return false
    return response.request().postDataJSON()?.action === 'session'
  })
  await openApp(page, true, options)
  expect((await sessionResponse).status()).toBe(503)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hradnik_session'))).toBe('visual-regression-session')
  options.sessionErrorStatus = 0
  await page.reload()
  await expect(page.locator('.reference-profile-button')).toHaveClass(/logged-in/)
  expect(await page.evaluate(() => localStorage.getItem('hradnik_session'))).toBe('visual-regression-session')
})

test('network failure during session verification keeps the token and recovers on reload', async ({ page }) => {
  const options = { sessionNetworkFailure: true }
  const failedRequest = page.waitForEvent('requestfailed', request => {
    if (!request.url().includes('/functions/v1/hradnik-auth')) return false
    return request.postDataJSON()?.action === 'session'
  })
  await openApp(page, true, options)
  await failedRequest
  expect(await page.evaluate(() => localStorage.getItem('hradnik_session'))).toBe('visual-regression-session')
  options.sessionNetworkFailure = false
  await page.reload()
  await expect(page.locator('.reference-profile-button')).toHaveClass(/logged-in/)
  expect(await page.evaluate(() => localStorage.getItem('hradnik_session'))).toBe('visual-regression-session')
})

test('explicit 403 session rejection clears the invalid token', async ({ page }) => {
  const sessionResponse = page.waitForResponse(response => {
    if (!response.url().includes('/functions/v1/hradnik-auth')) return false
    return response.request().postDataJSON()?.action === 'session'
  })
  await openApp(page, true, { sessionErrorStatus: 403 })
  expect((await sessionResponse).status()).toBe(403)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hradnik_session'))).toBeNull()
})

test('explicitly rejected profile session is cleared', async ({ page }) => {
  const sessionResponse = page.waitForResponse(response => {
    if (!response.url().includes('/functions/v1/hradnik-auth')) return false
    return response.request().postDataJSON()?.action === 'session'
  })
  await openApp(page, true, { sessionErrorStatus: 401 })
  expect((await sessionResponse).status()).toBe(401)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hradnik_session'))).toBeNull()
})

test('clean visitor gets a friendly Czech fallback when catalog backend is down', async ({ page }) => {
  await mockBackend(page, false, { catalogFailure: true })
  await page.goto('/')
  const notice = page.locator('.authCard .notice')
  await expect(notice).toBeVisible()
  await expect(notice).toContainText('Hradník se teď nepodařilo načíst')
  await expect(page.locator('body')).not.toContainText('temporary backend failure')
  await expect(page.locator('body')).not.toContainText('relation')
})

test('cached catalog stays usable when backend becomes unavailable', async ({ page }) => {
  await openApp(page, false)
  await expect(page.locator('.redesign-sidebar .redesign-nav > button')).toHaveCount(5)

  await expect.poll(async () => page.evaluate(async () => {
    return await new Promise(resolve => {
      const req=indexedDB.open('hradnik-cache-v1',1)
      req.onerror=()=>resolve(0)
      req.onsuccess=()=>{
        const db=req.result
        const tx=db.transaction('catalog','readonly')
        const get=tx.objectStore('catalog').get('places')
        get.onerror=()=>resolve(0)
        get.onsuccess=()=>resolve(Array.isArray(get.result?.places)?get.result.places.length:0)
      }
    })
  })).toBe(samplePlaces.length)

  await page.unroute('**/rest/v1/hradnik_places*')
  await page.route('**/rest/v1/hradnik_places*', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'temporary backend failure' })
  }))
  await page.reload()

  await expect(page.locator('.hradnik-offline-notice')).toBeVisible()
  await expect(page.locator('.hradnik-offline-notice')).toContainText('Server je teď nedostupný')
  await expect(page.locator('.redesign-sidebar .redesign-nav > button')).toHaveCount(5)
  await page.locator('.redesign-sidebar .redesign-nav > button').nth(1).click()
  await expect(page.locator('#list .place')).toHaveCount(4)
})

test('installed PWA uses transparent versioned Hradnik icons', async ({ page }) => {
  await openApp(page, false)
  const manifestHref = await page.locator('link[rel="manifest"]').first().getAttribute('href')
  const response = await page.request.get(manifestHref)
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest.icons).toEqual([
    { src: '/icon-192-v011.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512-v011.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/apple-touch-icon-ios-v012.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
  ])
  await expect(page.locator('link[rel="apple-touch-icon"][sizes="180x180"]')).toHaveAttribute('href', '/apple-touch-icon-ios-v012.png')
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg?v=0.1.1')
  for (const icon of [...manifest.icons, { src:'/apple-touch-icon-v011.png' }]) {
    const file = await page.request.get(icon.src)
    expect(file.status()).toBe(200)
    expect(file.headers()['content-type']).toContain('image/png')
  }
})

test('PWA update bridge is installed and guest mode still boots', async ({ page }) => {
  await openApp(page, false)
  const bridge = await page.evaluate(() => ({
    check: typeof window.hradnikPwaCheck,
    apply: typeof window.hradnikPwaApply,
    available: typeof window.hradnikPwaUpdateAvailable
  }))
  expect(bridge.check).toBe('function')
  expect(bridge.apply).toBe('function')
  expect(bridge.available).toBe('boolean')
})

test('installed iOS Edge shortcut redirects from installer to actual Hradnik app', async ({ page }) => {
  await mockBackend(page, false)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
  })
  await page.goto('/ios-install.html')
  await expect(page).toHaveURL(/\/\?source=pwa$/, { timeout: 15000 })
  await expect(page.locator('.redesign-sidebar .redesign-nav > button')).toHaveCount(5, { timeout: 15000 })
  await expect(page.locator('#app')).toBeVisible()
})

test('separate iOS Edge installer contains the real opaque PNG and launches application', async ({ page }) => {
  const response = await page.request.get('/ios-install.html')
  expect(response.status()).toBe(200)
  const html = await response.text()
  const marker = 'rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,'
  const match = html.includes(marker) ? [null, html.split(marker)[1].split('"')[0]] : null
  expect(match).not.toBeNull()
  const png = await page.request.get('/apple-touch-icon-ios-v012.png')
  expect(png.status()).toBe(200)
  expect(png.headers()['content-type']).toContain('image/png')
  expect(Buffer.from(match[1], 'base64')).toEqual(await png.body())
  await page.goto('/ios-install.html')
  await expect(page.getByRole('heading', { name: 'Hradník – instalace na iPhone' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Otevřít Hradník' })).toHaveAttribute('href', '/')
  const app = await page.request.get('/')
  expect(app.status()).toBe(200)
})

test('ordinary signed-in visitor cannot see the admin entry', async ({ page }) => {
  const adminActions = []
  await openApp(page, true, { adminActions })
  await expect.poll(() => adminActions.includes('me')).toBe(true)
  await expect(page.locator('.hradnik-admin-btn')).toHaveCount(0)
  await expect(page.locator('#hqOpen')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('hradnik_session'))).toBe('visual-regression-session')
})

test('administrator can inspect the catalog and quality queue without modifying data', async ({ page }) => {
  const adminActions = []
  const qualityActions = []
  await openApp(page, true, { adminAccess: true, adminActions, qualityActions })
  await expect(page.locator('.hradnik-admin-btn')).toBeVisible({ timeout: 15000 })
  await page.locator('.hradnik-admin-btn').click()
  await expect(page.locator('#hradnikAdminList .hradnik-admin-row')).toHaveCount(samplePlaces.length)
  await page.locator('#hradnikAdminSearch').fill('Hrad Test')
  await expect(page.locator('#hradnikAdminList .hradnik-admin-row')).toHaveCount(1)
  await expect(page.locator('#hradnikAdminList .hradnik-admin-row b')).toHaveText('Hrad Test')
  await page.locator('#hradnikAdminList .edit').click()
  await expect(page.locator('#hradnikAdminForm input[name="name"]')).toHaveValue('Hrad Test')
  await expect(page.locator('#hqOpen')).toBeVisible()
  await page.locator('#hqOpen').click()
  await expect(page.locator('#hqList .hq-row')).toHaveCount(2)
  await expect(page.locator('#hqSummary')).toContainText('2 ke kontrole')
  await page.locator('#hqClose').click()
  await expect(page.locator('#hqModal')).toHaveCount(0)
  expect(adminActions.every(action => ['me', 'list'].includes(action))).toBe(true)
  expect(adminActions).toContain('list')
  expect(qualityActions).toEqual(['list'])
})

test('quality review access failure is shown without exposing private records', async ({ page }) => {
  const qualityActions = []
  await openApp(page, true, { adminAccess: true, qualityDenied: true, qualityActions })
  await expect(page.locator('.hradnik-admin-btn')).toBeVisible({ timeout: 15000 })
  await page.locator('.hradnik-admin-btn').click()
  await expect(page.locator('#hqOpen')).toBeVisible()
  await page.locator('#hqOpen').click()
  await expect(page.locator('#hqList .hradnik-admin-empty')).toContainText('Přístup mají jen administrátoři.')
  await expect(page.locator('#hqList .hq-row')).toHaveCount(0)
  expect(qualityActions).toEqual(['list'])
})
