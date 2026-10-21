// ===== regress.mjs — automated regression checklist (HANDOVER.md section 5) =====
// Runs the documented release checklist headlessly: bilingual titles, EN zero-Chinese,
// 390px overflow, DOI count, BibTeX copy, catch-all redirect, ink flag-off zero vars,
// fonts loaded, nav single-line, skip-link hash safety, drawer focus handling, plus
// static guards (dist placeholders, non-route hash anchors).
// Usage: npm run build && npm run regress
// Env overrides: REGRESS_URL (test an already-running instance, e.g. the public site),
//   BROWSER_PATH (chrome-headless-shell binary). Driver resolution: local
//   playwright-core devDependency first, then the ZCode runtime bundle.
// All assertions are deterministic DOM checks; nothing here needs a vision model.
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROUTES = ['/', '/about', '/research', '/publications', '/news', '/people', '/gallery', '/join', '/contact']
const ALL_ROUTES = [...ROUTES, '/lab']
const DEFAULT_BROWSER = '/opt/chrome-shell/chrome-headless-shell-linux64/chrome-headless-shell'

// ---- driver + browser resolution -------------------------------------------
async function loadChromium() {
  const pick = (mod) => mod.chromium ?? mod.default?.chromium
  try {
    const pw = await import('playwright-core')
    const c = pick(pw)
    if (c) return c
  } catch { /* fall through to bundled candidates */ }
  const rel = '/root/.zcode/server/releases'
  if (existsSync(rel)) {
    for (const v of readdirSync(rel).sort().reverse()) {
      const idx = join(rel, v, 'runtime/node_modules/playwright-core/index.js')
      if (existsSync(idx)) {
        // CJS module: the named-export interop can miss `chromium`; read .default too.
        const c = pick(await import(pathToFileURL(idx).href))
        if (c) return c
      }
    }
  }
  console.error('FAIL driver: playwright-core not found. Fix: cd site && npm i -D playwright-core')
  process.exit(1)
}

// ---- tiny test harness ------------------------------------------------------
const results = []
function report(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}${detail ? ' - ' + detail : ''}`)
}
const compact = (v) => JSON.stringify(v)

// ---- static checks (no browser) ---------------------------------------------
function staticChecks() {
  const dist = join(SITE_DIR, 'dist')
  if (!existsSync(dist)) {
    report('dist-exists', false, 'run npm run build first')
    return
  }
  const bad = []
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) walk(p)
      else if (/\.(html|js|css)$/.test(f.name)) {
        const s = readFileSync(p, 'utf8')
        if (/待提供|TBD|provide\//.test(s)) bad.push(f.name)
      }
    }
  }
  walk(dist)
  report('dist-placeholders', bad.length === 0, bad.length ? compact(bad) : '')

  // Hash router rule: in-app anchors must be routes (#/...); a bare href="#id"
  // becomes a route hit and the catch-all bounces the user home (HANDOVER 4.10).
  // Allowed exception: an element whose own line carries an @click handler that
  // intercepts navigation (the skip link). Comment lines are ignored.
  const srcBad = []
  const srcDir = join(SITE_DIR, 'src')
  const walkSrc = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) walkSrc(p)
      else if (/\.(vue|js)$/.test(f.name)) {
        for (const line of readFileSync(p, 'utf8').split('\n')) {
          const t = line.trim()
          if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue
          const m = line.match(/href="#(?!\/)[^"'\s]*/)
          if (m && !line.includes('@click')) srcBad.push(`${f.name}: ${m[0]}`)
        }
      }
    }
  }
  walkSrc(srcDir)
  report('src-hash-anchors', srcBad.length === 0, srcBad.join('; '))
}

// ---- preview server lifecycle ------------------------------------------------
let previewProc = null
async function startPreview() {
  const port = 4187
  const bin = join(SITE_DIR, 'node_modules/.bin/vite')
  previewProc = spawn(bin, ['preview', '--host', '127.0.0.1', '--port', String(port)], { cwd: SITE_DIR, stdio: 'ignore' })
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(base + '/')
      if (r.ok) return base
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error('vite preview did not become ready within 18s')
}

// ---- browser helpers ----------------------------------------------------------
async function newCtx(browser, { lang = 'zh', width = 1440, height = 1000, mobile = false, ink = 'on' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height }, isMobile: mobile, hasTouch: mobile,
    colorScheme: 'dark', reducedMotion: 'reduce',
    locale: lang === 'en' ? 'en-US' : 'zh-CN',
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  await ctx.addInitScript(
    ({ l, i }) => {
      localStorage.setItem('haolab-lang', l)
      if (i === 'off') localStorage.setItem('inkintent', 'off')
      else localStorage.removeItem('inkintent')
    },
    { l: lang, i: ink },
  )
  return ctx
}
const pageMetrics = (page) => page.evaluate(() => {
  const txt = document.body.innerText || ''
  return {
    hash: location.hash,
    h1: document.querySelector('h1')?.innerText.replace(/\n+/g, ' / ') || null,
    cjk: [...new Set(txt.match(/[\u4e00-\u9fff]+/g) || [])],
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    sizes: [innerWidth, document.documentElement.scrollWidth],
    hidden: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity === '0').length,
    broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
    fonts: [document.fonts.check('16px "Space Grotesk"'), document.fonts.check('16px "JetBrains Mono"')],
    doi: document.querySelectorAll('a.doi').length,
  }
})

async function main() {
  staticChecks()
  const base = process.env.REGRESS_URL || (await startPreview())
  console.log(`target: ${base}`)
  const browserPath = process.env.BROWSER_PATH || DEFAULT_BROWSER
  if (!existsSync(browserPath)) {
    report('browser-binary', false, `${browserPath} missing; set BROWSER_PATH`)
    return finish()
  }
  const chromium = await loadChromium()
  const browser = await chromium.launch({ executablePath: browserPath, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const goto = (page, route) => page.goto(base + '/#' + route, { waitUntil: 'domcontentloaded' }).then(() => page.waitForTimeout(500))

  try {
    // 1) zh desktop: titles, overflow, reveal visibility, broken images, fonts
    {
      const ctx = await newCtx(browser)
      const p = await ctx.newPage()
      let fonts = null
      for (const r of ALL_ROUTES) {
        await goto(p, r)
        await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await p.waitForTimeout(300)
        const m = await pageMetrics(p)
        fonts = m.fonts
        report(`zh-1440 ${r} h1`, !!m.h1, m.h1 || 'missing')
        report(`zh-1440 ${r} no-overflow`, !m.overflow, m.overflow ? compact(m.sizes) : '')
        report(`zh-1440 ${r} reveal-visible`, m.hidden === 0, `${m.hidden} hidden`)
        report(`zh-1440 ${r} images-ok`, m.broken.length === 0, compact(m.broken))
      }
      report('fonts-selfhosted', fonts && fonts.every(Boolean), compact(fonts))
      await ctx.close()
    }

    // 2) en desktop: zero Chinese beyond the language toggle
    {
      const ctx = await newCtx(browser, { lang: 'en' })
      const p = await ctx.newPage()
      const offenders = []
      for (const r of ROUTES) {
        await goto(p, r)
        const m = await pageMetrics(p)
        const extra = m.cjk.filter(x => x !== '中文')
        if (extra.length) offenders.push(`${r}: ${extra.join(',')}`)
        report(`en-1440 ${r} no-overflow`, !m.overflow)
      }
      report('en zero-chinese', offenders.length === 0, offenders.join('; '))
      await ctx.close()
    }

    // 3) 390px mobile overflow, zh, all routes
    {
      const ctx = await newCtx(browser, { width: 390, height: 844, mobile: true })
      const p = await ctx.newPage()
      const bad = []
      for (const r of ALL_ROUTES) {
        await goto(p, r)
        const m = await pageMetrics(p)
        if (m.overflow) bad.push(r)
      }
      report('390px no-overflow (10 routes)', bad.length === 0, compact(bad))
      await ctx.close()
    }

    // 4) nav single-line at desktop widths, both locales (HANDOVER 4.11)
    {
      const ctx = await newCtx(browser)
      const p = await ctx.newPage()
      const bad = []
      for (const lang of ['zh', 'en']) for (const w of [1440, 1141]) {
        await p.setViewportSize({ width: w, height: 400 })
        await goto(p, '/people')
        const rows = await p.evaluate(() =>
          [...new Set([...document.querySelectorAll('.links .link')].map(a => Math.round(a.getBoundingClientRect().top)))].length)
        if (rows !== 1) bad.push(`${lang}@${w}:${rows}rows`)
      }
      report('nav single-line', bad.length === 0, compact(bad))
      await ctx.close()
    }

    // 5) publications contract: 15 DOIs + BibTeX copy confirmation (zh)
    {
      const ctx = await newCtx(browser)
      const p = await ctx.newPage()
      await goto(p, '/publications')
      const doi = await p.locator('a.doi').count()
      report('publications doi=15', doi === 15, `got ${doi}`)
      const btn = p.locator('button.copy').first()
      await btn.click()
      await p.waitForTimeout(150)
      const label = (await btn.innerText()).trim()
      report('bibtex copy label', label.includes('已复制'), label)
      await ctx.close()
    }

    // 6) unknown hash redirects home
    {
      const ctx = await newCtx(browser)
      const p = await ctx.newPage()
      await goto(p, '/definitely-not-a-route')
      const hash = await p.evaluate(() => location.hash)
      report('catch-all redirect', hash === '#/', hash)
      await ctx.close()
    }

    // 7) ink flag-off: zero --exc/--fire variables and zero halo opacity (UI-FRAMEWORK 10.5)
    {
      const ctx = await newCtx(browser, { ink: 'off' })
      const p = await ctx.newPage()
      await goto(p, '/')
      const m = await p.evaluate(() => {
        let vars = 0
        for (const e of document.querySelectorAll('*'))
          if (e.style.getPropertyValue('--exc') || e.style.getPropertyValue('--fire')) vars++
        const btn = document.querySelector('.hero-cta .btn')
        const card = document.querySelector('.card.hl')
        return {
          vars,
          field: document.documentElement.style.getPropertyValue('--field'),
          heroHalo: btn ? getComputedStyle(btn, '::after').opacity : null,
          cardHalo: card ? getComputedStyle(card, '::after').opacity : null,
        }
      })
      report('ink-off zero-vars', m.vars === 0 && m.field === '', compact(m))
      report('ink-off zero-halo', m.heroHalo === '0' && m.cardHalo === '0', compact(m))
      await ctx.close()
    }

    // 8) skip link must not change the hash (HANDOVER 4.10)
    {
      const ctx = await newCtx(browser)
      const p = await ctx.newPage()
      await goto(p, '/about')
      await p.keyboard.press('Tab')
      await p.keyboard.press('Enter')
      await p.waitForTimeout(150)
      const m = await p.evaluate(() => ({ hash: location.hash, active: document.activeElement?.id }))
      report('skip-link keeps hash', m.hash === '#/about' && m.active === 'main', compact(m))
      await ctx.close()
    }

    // 9) mobile drawer: aria state, scroll lock, Esc close, focus return
    {
      const ctx = await newCtx(browser, { width: 390, height: 844, mobile: true })
      const p = await ctx.newPage()
      await goto(p, '/')
      await p.locator('.burger').click()
      await p.waitForTimeout(300)
      const open = await p.evaluate(() => ({
        exp: document.querySelector('.burger')?.getAttribute('aria-expanded'),
        lock: document.body.style.overflow,
      }))
      await p.keyboard.press('Escape')
      await p.waitForTimeout(300)
      const closed = await p.evaluate(() => ({
        exp: document.querySelector('.burger')?.getAttribute('aria-expanded'),
        lock: document.body.style.overflow,
        active: document.activeElement?.className,
      }))
      report('drawer open state', open.exp === 'true' && open.lock === 'hidden', compact(open))
      report('drawer esc+focus', closed.exp === 'false' && closed.lock === '' && closed.active === 'burger', compact(closed))
      await ctx.close()
    }

    // 10) CTA 660ms delay delta (report-only: chunk lazy-load noise makes absolutes flaky)
    {
      const time = async (reduced) => {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
        await ctx.addInitScript(() => localStorage.setItem('haolab-lang', 'zh'))
        const p = await ctx.newPage()
        await goto(p, '/')
        await p.waitForTimeout(reduced ? 400 : 1500)
        const dt = await p.evaluate(async () => {
          const t0 = performance.now()
          document.querySelector('.hero-cta a.primary').click()
          const ok = await new Promise(res => {
            const iv = setInterval(() => { if (location.hash === '#/research') { clearInterval(iv); res(true) } }, 5)
            setTimeout(() => { clearInterval(iv); res(false) }, 2500)
          })
          return { dt: Math.round(performance.now() - t0), ok }
        })
        await ctx.close()
        return dt
      }
      const normal = await time(false)
      const reduced = await time(true)
      const delta = normal.dt - reduced.dt
      console.log(`[INFO] cta-timing normal ${normal.dt}ms reduced ${reduced.dt}ms delta ${delta}ms (report-only: chunk lazy-load noise; the 660ms timer itself is unchanged code)`)
    }
  } finally {
    await browser.close().catch(() => {})
  }
}

function finish() {
  const fails = results.filter(r => !r.ok)
  console.log(`-- ${results.length - fails.length}/${results.length} passed`)
  if (previewProc) previewProc.kill('SIGTERM')
  if (fails.length) process.exit(1)
}

main().then(finish).catch(e => { console.error('FAIL runner:', e); finish() })
