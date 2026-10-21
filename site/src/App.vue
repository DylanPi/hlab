<script setup>
// ===== App — application shell: NavBar / RouterView / SiteFooter / BackTop + head sync =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Owns per-route document.title and description/OG/Twitter meta: the page title pairs
// the route's nav label with the brand (home shows the brand alone); description =
// the route's i18n lead, HOME_DESC for home.
// Re-syncs whenever the route name or the locale changes, and keeps <html lang> in
// step with the locale (also done imperatively by i18n setLang).
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NavBar from './components/NavBar.vue'
import SiteFooter from './components/SiteFooter.vue'
import BackTop from './components/BackTop.vue'

const route = useRoute()
const { t, locale } = useI18n()

// 各栏目分享描述：未列出的栏目回退 heroSub
const LEADS = {
  about: 'about.lead', research: 'research.lead', publications: 'pubs.lead',
  news: 'news.lead', people: 'people.lead', gallery: 'gallery.lead',
  join: 'join.lead', contact: 'contact.lead', lab: 'lab.lead',
}
const HOME_DESC = {
  zh: '浙江大学脑机智能全国重点实验室郝耀耀课题组：植入式脑机接口、运动神经编解码、汉字书写脑机接口、临床转化研究。让思维直达世界。',
  en: 'Hao Lab at the National Key Laboratory of Brain-Machine Intelligence, Zhejiang University: implantable BCIs, motor neural coding, Chinese handwriting BCI and clinical translation.',
}

function setMeta(sel, val) {
  // Meta tags live in index.html; optional chaining tolerates a tag being absent
  document.querySelector(sel)?.setAttribute('content', val)
}

// 按栏目与语言更新页面标题与分享 meta（收藏、多标签页、微信/QQ 分享卡片）
function setTitle() {
  const brand = locale.value === 'zh' ? '郝耀耀课题组 Hao Lab' : 'Hao Lab · ZJU'
  const name = route.name
  const isHome = !name || name === 'home'
  document.title = isHome ? brand : `${t('nav.' + name)} · ${brand}`
  const desc = isHome ? HOME_DESC[locale.value] : t(LEADS[name] || 'home.heroSub')
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  setMeta('meta[name="description"]', desc)
  setMeta('meta[property="og:title"]', document.title)
  setMeta('meta[property="og:description"]', desc)
  setMeta('meta[property="og:locale"]', locale.value === 'zh' ? 'zh_CN' : 'en_US')
  setMeta('meta[name="twitter:title"]', document.title)
  setMeta('meta[name="twitter:description"]', desc)
}

// Route changes retitle the page; locale changes retranslate title + meta in place
watch(() => route.name, setTitle)
watch(locale, setTitle)
setTitle()

// Skip link must NOT use a bare href="#main": hash history would read "#main" as a
// route and the catch-all would bounce the user home. Focus the main landmark instead,
// leaving the route URL untouched.
function skipToMain(e) {
  e.preventDefault()
  const main = document.getElementById('main')
  if (!main) return
  main.focus({ preventScroll: true })
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>

<template>
  <!-- Skip link is the first focusable element; #main receives programmatic focus. -->
  <a class="skip-link" href="#main" @click="skipToMain">{{ t('common.skip') }}</a>
  <!-- Static aurora + grid layer; fixed negative-z, no pointer events, hidden from AT. -->
  <div class="bg-atmosphere" aria-hidden="true"></div>
  <NavBar />
  <main id="main" class="main" tabindex="-1">
    <!-- RED LINE: never wrap RouterView in <Transition mode="out-in"> -- with no
         transition classes applied, transitionend never fires and routing deadlocks
         (documented pitfall). -->
    <RouterView />
  </main>
  <SiteFooter />
  <BackTop />
</template>

<style>
.main { min-height: 70vh; scroll-margin-top: var(--nav-h); }
/* The skip link focuses main programmatically; a page-sized focus ring is noise. */
.main:focus { outline: none; }
</style>
