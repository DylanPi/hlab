<script setup>
// ===== NavBar — fixed glass navigation, language toggle, accessible mobile drawer =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 adds scroll state,
//  the signal-ring brand mark and drawer focus/scrim handling.]
// Renders links for the 9 public routes (computed from i18n so labels retranslate on
// locale switch) and holds the zh/en toggle (setLang persists 'haolab-lang' + syncs
// <html lang>). Below 1020px the link list becomes an off-canvas drawer.
// Mounted once by App.vue as global chrome above RouterView.
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLang } from '../i18n'
import site from '../data/site.json'
import { tx } from '../utils/tx'

const { t, locale } = useI18n()
const route = useRoute()
const open = ref(false)
const scrolled = ref(false)
const burgerEl = ref(null)
const linksEl = ref(null)
let prevOverflow = ''

// 抽屉打开时锁定背景滚动；同时管理 Esc、首项聚焦与关闭后的焦点归还。
// 关闭时把焦点还给汉堡按钮，键盘用户不会迷失在页面顶部。
watch(open, async (v) => {
  if (v) {
    prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    linksEl.value?.querySelector('.link')?.focus()
  } else {
    document.body.style.overflow = prevOverflow
    window.removeEventListener('keydown', onKeydown)
    burgerEl.value?.focus()
  }
})
function onKeydown(e) {
  if (e.key === 'Escape') open.value = false
}
// Route changes (including browser back) must not leave the drawer open.
watch(() => route.path, () => { open.value = false })

// 顶部透明、滚动后加实：只切换一个布尔类，不逐帧写样式。
function onScroll() {
  scrolled.value = window.scrollY > 12
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = prevOverflow
})

const links = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/about', label: t('nav.about') },
  { to: '/research', label: t('nav.research') },
  { to: '/publications', label: t('nav.publications') },
  { to: '/news', label: t('nav.news') },
  { to: '/people', label: t('nav.people') },
  { to: '/gallery', label: t('nav.gallery') },
  { to: '/join', label: t('nav.join') },
  { to: '/contact', label: t('nav.contact') },
])

function toggleLang() {
  setLang(locale.value === 'zh' ? 'en' : 'zh')
}
function close() {
  open.value = false
}
</script>

<template>
  <!-- Fixed scrim lives outside the blurred header so its containing block stays the viewport. -->
  <div class="scrim" :class="{ open }" aria-hidden="true" @click="close"></div>
  <header class="nav" :class="{ scrolled }">
    <div class="container nav-inner">
      <RouterLink to="/" class="brand" @click="close">
        <!-- Signal-ring mark: cyan ring + violet orbit + warm human core. Decorative,
             not a replacement for the (still pending) official lab logo. -->
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="navBrandGrad" x1="2" y1="2" x2="26" y2="26">
                <stop stop-color="#38d6ff" />
                <stop offset="1" stop-color="#7c8cff" />
              </linearGradient>
            </defs>
            <circle cx="14" cy="14" r="11" stroke="url(#navBrandGrad)" stroke-width="1.5" opacity="0.9" />
            <circle cx="14" cy="14" r="6" stroke="rgba(56,214,255,0.45)" stroke-width="1" />
            <circle cx="14" cy="14" r="2.4" fill="#ffb45c" />
            <circle cx="23.6" cy="8.2" r="1.2" fill="#38d6ff" />
          </svg>
        </span>
        <span class="brand-text">
          <strong class="en">{{ tx(site.name) }}</strong>
          <span class="brand-sub">{{ tx(site.university) }}</span>
        </span>
      </RouterLink>

      <nav id="site-nav" ref="linksEl" class="links" :class="{ open }" :aria-label="t('common.mainNav')">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="link"
          :class="{ active: route.path === l.to }"
          @click="close"
        >{{ l.label }}</RouterLink>
        <div class="mobile-lang">
          <button class="lang" :aria-label="t('common.langSwitch')" @click="toggleLang">
            {{ locale === 'zh' ? 'EN' : '中文' }}
          </button>
        </div>
      </nav>

      <div class="nav-right">
        <button class="lang" :aria-label="t('common.langSwitch')" @click="toggleLang">
          {{ locale === 'zh' ? 'EN' : '中文' }}
        </button>
        <button
          ref="burgerEl"
          class="burger"
          :class="{ open }"
          :aria-label="t('common.menu')"
          :aria-expanded="open"
          aria-controls="site-nav"
          @click="open = !open"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(7, 11, 20, 0.56);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border-bottom: 1px solid transparent;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.nav.scrolled {
  background: rgba(7, 11, 20, 0.84);
  border-bottom-color: var(--line);
  box-shadow: 0 18px 50px -34px rgba(0, 0, 0, 0.95);
}
.nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: var(--nav-h); gap: 1rem;
}
.brand { display: flex; align-items: center; gap: 0.7rem; color: var(--ink); min-width: 0; max-width: 290px; }
.brand:hover { opacity: 1; }
.brand-mark {
  width: 26px; height: 26px; flex: none; display: grid; place-items: center;
  filter: drop-shadow(0 0 9px rgba(56, 214, 255, 0.3));
}
.brand-mark svg { width: 100%; height: 100%; }
.brand-text { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; max-width: 240px; }
.brand-text strong { font-size: 1.05rem; letter-spacing: 0.02em; }
.brand-sub { font-size: 0.66rem; color: var(--ink-dim); letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Desktop links must stay on one line. The English labels + the long institution
   subtitle used to push the last two links onto a second row inside the 68px bar. */
.links { display: flex; align-items: center; gap: 0.15rem; flex-wrap: nowrap; }
.link {
  position: relative; white-space: nowrap;
  color: var(--ink-dim); font-size: 0.92rem;
  padding: 0.45rem 0.6rem; border-radius: var(--r-pill);
  border: 1px solid transparent;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.link:hover { color: var(--ink); background: rgba(120, 150, 200, 0.07); opacity: 1; }
.link.active {
  color: var(--ink);
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.1), rgba(56, 214, 255, 0.03));
  border-color: rgba(56, 214, 255, 0.16);
}
.link.active::after {
  content: ""; position: absolute; left: 0.6rem; right: 0.6rem; bottom: 0.16rem;
  height: 1.5px; border-radius: 2px; background: var(--grad);
  box-shadow: 0 0 8px rgba(56, 214, 255, 0.6);
}
.nav-right { display: flex; align-items: center; gap: 0.7rem; }

.lang {
  font-family: var(--font-en);
  font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em;
  color: var(--ink); background: rgba(19, 28, 49, 0.7);
  border: 1px solid rgba(120, 150, 200, 0.32);
  padding: 0.34rem 0.82rem; border-radius: var(--r-pill); cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}
.lang:hover { border-color: var(--accent); color: var(--accent); background: rgba(56, 214, 255, 0.06); }
.mobile-lang { display: none; }

.burger {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 6px; border-radius: 10px;
}
.burger:hover { background: rgba(120, 150, 200, 0.08); }
.burger span {
  width: 22px; height: 2px; background: var(--ink); border-radius: 2px;
  transition: transform 0.25s var(--ease-out), opacity 0.2s ease;
}
.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Backdrop below the header (z 99) and above page content; only active in drawer mode. */
.scrim {
  position: fixed; inset: var(--nav-h) 0 0; z-index: 99;
  background: rgba(2, 5, 10, 0.62);
  opacity: 0; visibility: hidden;
  transition: opacity 0.28s ease, visibility 0.28s ease;
}
.scrim.open { opacity: 1; visibility: visible; }

/* 触屏设备：语言/汉堡按钮点击热区扩到 ≥44px（视觉尺寸不变） */
@media (pointer: coarse) {
  .lang { min-height: 44px; min-width: 44px; }
  .burger { padding: 14px 12px; }
}

@media (max-width: 1140px) {
  .links {
    position: fixed; top: var(--nav-h); right: 0;
    flex-direction: column; align-items: stretch;
    background: rgba(9, 14, 26, 0.97);
    border-left: 1px solid var(--line);
    width: min(78vw, 320px); height: calc(100vh - var(--nav-h));
    padding: 1.2rem; gap: 0.3rem;
    transform: translateX(100%);
    transition: transform 0.3s var(--ease-out);
    z-index: 100;
  }
  .links.open { transform: none; }
  .link {
    min-height: 44px; display: flex; align-items: center;
    padding: 0.7rem 0.9rem; font-size: 1rem;
  }
  .link.active::after { left: 0.9rem; right: auto; width: 22px; bottom: 0.35rem; }
  .burger { display: flex; }
  .mobile-lang { display: block; padding: 0.7rem 0.9rem 0; }
  .brand-sub { display: none; }
}
@media (min-width: 1141px) {
  .scrim { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .links, .scrim, .burger span { transition: none; }
}
</style>
