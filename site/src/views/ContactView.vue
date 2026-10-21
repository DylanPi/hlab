<script setup>
// ===== ContactView.vue - Contact info cards (address / email / PI page) + visit note =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/contact | Data: site.json | i18n: contact.*
// Fully static: three info cards with staggered v-reveal delays plus a note card; tx()
// resolves the {zh, en} address and note strings per current locale (zh fallback).
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import site from '../data/site.json'
import { tx } from '../utils/tx'

const { t } = useI18n()
</script>

<template>
  <PageHead index="09" eyebrow="Contact" :title="t('contact.title')" :lead="t('contact.lead')" />

  <section class="section">
    <div class="container contact-grid">
      <div class="cards">
        <div class="card c-item" v-reveal>
          <span class="c-label">{{ t('contact.addrLabel') }}</span>
          <span class="c-value">{{ tx(site.address) }}</span>
        </div>
        <div class="card c-item" v-reveal="{ delay: '0.08s' }">
          <span class="c-label">{{ t('contact.emailLabel') }}</span>
          <a class="c-value" :href="'mailto:' + site.email">{{ site.email }}</a>
        </div>
        <div class="card c-item" v-reveal="{ delay: '0.16s' }">
          <span class="c-label">{{ t('contact.piPageLabel') }}</span>
          <a class="c-value" :href="site.piPage" target="_blank" rel="noopener">person.zju.edu.cn/yaoyaoh ↗</a>
        </div>
      </div>
      <div class="card c-note" v-reveal="{ delay: '0.24s' }">
        <span class="c-quote" aria-hidden="true">“</span>
        <p>{{ tx({ zh: '来访与合作请先邮件联系，我们尽快回复。', en: 'For visits and collaboration, please email us first — we reply as soon as possible.' }) }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.4rem; align-items: stretch; }
.cards { display: grid; gap: 1rem; align-content: start; }
.c-item {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 0.35rem; padding: 1.3rem 1.5rem;
}
.c-item::before {
  content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 2px;
  border-radius: 2px; background: linear-gradient(180deg, var(--accent), transparent);
  opacity: 0.55;
}
.c-label {
  font-size: 0.72rem; letter-spacing: 0.14em; color: var(--accent);
  text-transform: uppercase; font-family: var(--font-mono);
}
.c-value { font-size: 1.05rem; line-height: 1.6; }
.c-note {
  position: relative; overflow: hidden;
  display: flex; align-items: center; padding: 2rem;
  background:
    radial-gradient(70% 100% at 100% 0%, rgba(255, 180, 92, 0.08), transparent 65%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.c-note::before {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120, 150, 200, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 150, 200, 0.06) 1px, transparent 1px);
  background-size: 34px 34px;
  -webkit-mask-image: radial-gradient(80% 80% at 70% 30%, #000, transparent 78%);
  mask-image: radial-gradient(80% 80% at 70% 30%, #000, transparent 78%);
  pointer-events: none;
}
.c-note::after {
  content: ""; position: absolute; top: 0; left: 2rem; right: 2rem; height: 1px;
  background: linear-gradient(90deg, rgba(255, 180, 92, 0.5), transparent);
  opacity: 0.5;
}
.c-quote {
  position: absolute; top: 0.6rem; left: 1.2rem;
  font-family: var(--font-serif); font-size: 4rem; line-height: 1; color: var(--warm);
  opacity: 0.18; pointer-events: none;
}
.c-note p { position: relative; z-index: 1; margin: 0; color: var(--ink-dim); font-size: 0.98rem; line-height: 1.95; }
@media (max-width: 820px) { .contact-grid { grid-template-columns: 1fr; } }
</style>
