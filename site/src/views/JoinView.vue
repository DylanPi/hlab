<script setup>
// ===== JoinView.vue - Recruiting: four position cards + how-to-apply steps =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/join | Data: site.json (email for mailto links) | i18n: join.*
// positions is a computed over t() so the four cards (PhD / master / undergrad / postdoc)
// re-resolve when the locale switches. Sections: page head; position grid with LineIcon
// visuals; how-to-apply ordered steps + mailto CTA button.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import SectionHead from '../components/SectionHead.vue'
import LineIcon from '../components/LineIcon.vue'
import site from '../data/site.json'

const { t } = useI18n()

const positions = computed(() => [
  { icon: 'grad-cap', title: t('join.posPhd'), desc: t('join.posPhdDesc') },
  { icon: 'book', title: t('join.posMaster'), desc: t('join.posMasterDesc') },
  { icon: 'sprout', title: t('join.posUndergrad'), desc: t('join.posUndergradDesc') },
  { icon: 'microscope', title: t('join.posPostdoc'), desc: t('join.posPostdocDesc') },
])
</script>

<template>
  <PageHead index="08" eyebrow="Join us" :title="t('join.title')" :lead="t('join.lead')" />

  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'Positions'" :title="t('join.positionsTitle')" />
      <div class="grid cols-4">
        <div v-for="(p, i) in positions" :key="i" class="card hov pos" v-reveal="{ delay: i * 0.08 + 's' }">
          <div class="pos-top">
            <div class="pos-icon"><LineIcon :name="p.icon" :size="42" /></div>
            <span class="pos-idx mono" aria-hidden="true">0{{ i + 1 }}</span>
          </div>
          <h3>{{ p.title }}</h3>
          <p>{{ p.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section alt">
    <div class="container how-grid">
      <div class="how-copy">
        <span class="eyebrow">How to apply</span>
        <h2 class="sec-title">{{ t('join.howTitle') }}</h2>
        <ol class="steps">
          <li><span class="step-num mono" aria-hidden="true">01</span><span>{{ t('join.how1') }} <a :href="'mailto:' + site.email">{{ site.email }}</a></span></li>
          <li><span class="step-num mono" aria-hidden="true">02</span><span>{{ t('join.how2') }}</span></li>
          <li><span class="step-num mono" aria-hidden="true">03</span><span>{{ t('join.how3') }}</span></li>
        </ol>
      </div>
      <div class="how-cta card" v-reveal="{ delay: '0.1s' }">
        <svg class="how-wave" viewBox="0 0 260 60" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="howWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop stop-color="#38d6ff" stop-opacity="0.8" />
              <stop offset="1" stop-color="#ffb45c" stop-opacity="0.6" />
            </linearGradient>
          </defs>
          <path d="M0 30 H56 L70 12 L84 48 L98 30 H150 L164 18 L178 42 L192 30 H260" fill="none" stroke="url(#howWaveGrad)" stroke-width="1.5" />
        </svg>
        <a :href="'mailto:' + site.email" class="btn primary">{{ t('join.cta') }}</a>
        <a class="how-mail mono" :href="'mailto:' + site.email">{{ site.email }}</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pos { display: flex; flex-direction: column; text-align: left; }
.pos-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
.pos-icon {
  width: 54px; height: 54px; display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.1), rgba(56, 214, 255, 0.02));
  border: 1px solid rgba(56, 214, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.pos-idx { font-size: 0.72rem; letter-spacing: 0.12em; color: var(--ink-faint); }
.pos h3 { margin: 0 0 0.45rem; font-size: 1.05rem; }
.pos p { margin: 0; font-size: 0.87rem; color: var(--ink-dim); line-height: 1.7; flex: 1; }

.how-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr); gap: 2.6rem; align-items: start; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.8rem; }
.steps li {
  display: grid; grid-template-columns: 32px 1fr; gap: 0.9rem; align-items: start;
  padding: 1rem 1.1rem; color: var(--ink-dim); font-size: 0.94rem; line-height: 1.7;
  border: 1px solid var(--line-soft); border-radius: var(--r-sm);
  background: rgba(19, 28, 49, 0.35);
}
.step-num {
  display: grid; place-items: center; width: 32px; height: 32px;
  border-radius: 50%; border: 1px solid rgba(56, 214, 255, 0.28);
  background: rgba(56, 214, 255, 0.07); color: var(--accent); font-size: 0.72rem;
}
.how-cta {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
  gap: 1rem; min-height: 230px; padding: 1.8rem;
  background:
    radial-gradient(80% 90% at 80% 0%, rgba(56, 214, 255, 0.08), transparent 68%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.how-cta::before {
  content: ""; position: absolute; top: 0; left: 1.8rem; right: 1.8rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.5), rgba(255, 180, 92, 0.3), transparent);
  opacity: 0.6;
}
.how-wave { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 54px; opacity: 0.3; pointer-events: none; }
.how-cta .btn, .how-mail { position: relative; z-index: 1; }
.how-mail { font-size: 0.8rem; color: var(--ink-dim); word-break: break-all; }
@media (max-width: 720px) {
  .how-grid { grid-template-columns: 1fr; }
  .how-cta { min-height: 0; }
}
</style>
