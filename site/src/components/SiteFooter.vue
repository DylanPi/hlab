<script setup>
// ===== SiteFooter — global footer: brand, full navigation, contact, legal bar =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 adds the full
//  nine-link map, tagline and signal mark.]
// UI strings come from i18n (footer.*/nav.*); lab identity from data/site.json via tx().
// Copyright year is derived once from the client clock. Rendered by App.vue below RouterView.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import site from '../data/site.json'
import { tx } from '../utils/tx'

const { t } = useI18n()
const year = new Date().getFullYear()

// Full nine-column map, two columns on desktop: the footer doubles as a sitemap.
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
</script>

<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div class="f-brand-block">
        <div class="f-brand">
          <span class="f-mark" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="footBrandGrad" x1="2" y1="2" x2="26" y2="26">
                  <stop stop-color="#38d6ff" />
                  <stop offset="1" stop-color="#7c8cff" />
                </linearGradient>
              </defs>
              <circle cx="14" cy="14" r="11" stroke="url(#footBrandGrad)" stroke-width="1.4" opacity="0.85" />
              <circle cx="14" cy="14" r="6" stroke="rgba(56,214,255,0.4)" stroke-width="1" />
              <circle cx="14" cy="14" r="2.3" fill="#ffb45c" />
            </svg>
          </span>
          <strong>{{ t('footer.lab') }}</strong>
        </div>
        <p class="f-text">{{ tx(site.university) }}</p>
        <p class="f-tagline">{{ tx(site.tagline) }}</p>
      </div>

      <div>
        <p class="f-title">{{ t('footer.quick') }}</p>
        <nav class="f-links" :aria-label="t('common.mainNav')">
          <RouterLink v-for="l in links" :key="l.to" :to="l.to">{{ l.label }}</RouterLink>
        </nav>
      </div>

      <div class="f-contact">
        <p class="f-title">{{ t('footer.contact') }}</p>
        <p class="f-text"><a :href="'mailto:' + site.email">{{ site.email }}</a></p>
        <p class="f-text dim">{{ tx(site.address) }}</p>
      </div>
    </div>

    <div class="container f-bottom">
      <span class="mono">{{ t('footer.rights') }} · © {{ year }}</span>
      <span class="f-signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(12, 19, 34, 0.92), rgba(7, 11, 20, 0.98));
  padding: 3.6rem 0 1.5rem;
  margin-top: var(--content-gap);
}
.footer::before {
  content: "";
  position: absolute; top: -1px; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 214, 255, 0.5), rgba(124, 140, 255, 0.24), transparent);
  opacity: 0.65;
}
.footer-grid {
  display: grid; grid-template-columns: 1.35fr 1fr 1.1fr; gap: 2.4rem;
}
.f-brand { display: flex; align-items: center; gap: 0.6rem; font-size: 1.05rem; margin-bottom: 0.65rem; }
.f-mark {
  width: 28px; height: 28px; flex: none;
  filter: drop-shadow(0 0 9px rgba(56, 214, 255, 0.26));
}
.f-mark svg { width: 100%; height: 100%; }
.f-title {
  margin: 0 0 0.9rem; font-family: var(--font-mono); font-size: 0.72rem;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-dim); font-weight: 500;
}
.f-text { margin: 0 0 0.4rem; font-size: 0.9rem; color: var(--ink-dim); }
.f-text.dim { opacity: 0.78; font-size: 0.84rem; line-height: 1.7; }
.f-tagline {
  margin: 0.7rem 0 0; font-family: var(--font-serif); font-size: 0.95rem;
  color: var(--warm); opacity: 0.85; letter-spacing: 0.06em;
}
.f-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem 1.2rem; font-size: 0.9rem; }
.f-links a { color: var(--ink-dim); width: fit-content; }
.f-links a:hover { color: var(--accent); }
.f-contact a { color: var(--accent); }
.f-bottom {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-top: 2.6rem; padding-top: 1.1rem; border-top: 1px solid var(--line-soft);
  font-size: 0.72rem; color: var(--ink-faint);
}
.f-signal { display: inline-flex; align-items: center; gap: 3px; height: 12px; }
.f-signal i {
  display: block; width: 2px; height: 5px; border-radius: 1px;
  background: var(--accent); opacity: 0.55;
}
.f-signal i:nth-child(2) { height: 10px; opacity: 0.8; }
.f-signal i:nth-child(3) { height: 7px; opacity: 0.65; }
.f-signal i:nth-child(4) { height: 12px; opacity: 0.9; }
.f-signal i:nth-child(5) { height: 4px; opacity: 0.45; }
@media (max-width: 760px) {
  .footer-grid { grid-template-columns: 1fr; gap: 1.8rem; }
  .f-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .f-bottom { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
}
</style>
