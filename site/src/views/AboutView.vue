<script setup>
// ===== AboutView.vue - Lab story: mission, PI profile, milestones timeline, collaborators =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/about | Data: site.json, people.json, timeline.json | i18n: about.*
// Top-to-bottom: mission grid (text + 3 pillar cards, decorative signal/stroke SVG card);
// PI section (photo with MonogramAvatar fallback, collapsible long bio, interest tags,
// external links, education list); TimeLine milestones; partner cards.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import SectionHead from '../components/SectionHead.vue'
import TimeLine from '../components/TimeLine.vue'
import MonogramAvatar from '../components/MonogramAvatar.vue'
import site from '../data/site.json'
import people from '../data/people.json'
import timeline from '../data/timeline.json'
import { tx } from '../utils/tx'

const { t } = useI18n()
// PI 长简介默认折叠，展开可读全文
const bioOpen = ref(false)
</script>

<template>
  <PageHead index="02" eyebrow="About" :title="t('about.title')" :lead="t('about.lead')" />

  <!-- 使命 -->
  <section class="section">
    <div class="container mission-grid">
      <div v-reveal>
        <SectionHead :eyebrow="'Mission'" :title="t('about.missionTitle')" />
        <p class="para">{{ t('about.mission1') }}</p>
        <p class="para">{{ t('about.mission2') }}</p>
        <div class="mission-cards">
          <div class="mc card">
            <span class="mc-num mono">01</span>
            <span>{{ tx({ zh: '神经编解码机制', en: 'Neural coding mechanisms' }) }}</span>
          </div>
          <div class="mc card">
            <span class="mc-num mono">02</span>
            <span>{{ tx({ zh: '植入式微系统', en: 'Implantable microsystems' }) }}</span>
          </div>
          <div class="mc card">
            <span class="mc-num mono">03</span>
            <span>{{ tx({ zh: '临床转化', en: 'Clinical translation' }) }}</span>
          </div>
        </div>
      </div>
      <div class="mission-photo" v-reveal="{ delay: '0.15s' }">
        <div class="signal-art card">
          <svg viewBox="0 0 320 300" aria-hidden="true">
            <defs>
              <linearGradient id="saGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#38d6ff" />
                <stop offset="1" stop-color="#7c8cff" />
              </linearGradient>
            </defs>
            <g class="sa-grid">
              <path v-for="i in 7" :key="'h' + i" :d="`M0 ${28 * i} H320`" />
              <path v-for="i in 10" :key="'v' + i" :d="`M${28 * i} 16 V244`" />
            </g>
            <path class="sa-wave" d="M18 150 L46 150 L60 96 L78 204 L94 130 L112 172 L130 150 L172 150 L188 84 L208 216 L226 122 L242 178 L258 150 L302 150" fill="none" stroke="url(#saGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            <path class="sa-stroke" d="M60 268 C 110 252, 150 282, 196 262 S 268 266, 286 256" fill="none" stroke="#ffb45c" stroke-width="4" stroke-linecap="round" />
            <text x="20" y="280" class="sa-label">signal</text>
            <text x="252" y="244" class="sa-label sa-label-warm">stroke</text>
          </svg>
          <p class="sa-cap">{{ tx({ zh: '从神经信号，到书写的一笔。', en: 'From neural signals to a single stroke.' }) }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PI -->
  <section class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'PI'" :title="t('about.piTitle')" />
      <div class="pi-grid">
        <div class="pi-photo" v-reveal>
          <img v-if="people.pi.photo" :src="people.pi.photo" :alt="tx(people.pi.name)" />
          <MonogramAvatar v-else :name="people.pi.name" class="pi-mono" />
        </div>
        <div class="pi-info" v-reveal="{ delay: '0.12s' }">
          <h3 class="pi-name">{{ tx(people.pi.name) }} <span class="grad-text en">Yaoyao Hao</span></h3>
          <p class="pi-title">{{ tx(people.pi.title) }} · {{ tx(site.university) }}</p>
          <!-- Long bio clamped to 4 lines while collapsed (CSS -webkit-line-clamp); toggle expands -->
          <p class="para bio" :class="{ clamp: !bioOpen }">{{ tx(people.pi.bio) }}</p>
          <button class="bio-toggle" :aria-expanded="bioOpen" @click="bioOpen = !bioOpen">
            {{ bioOpen ? t('about.bioLess') : t('about.bioMore') }}<span class="caret" aria-hidden="true">▾</span>
          </button>
          <div class="pi-tags">
            <span v-for="(it, i) in people.pi.interests" :key="i" class="tag">{{ tx(it) }}</span>
          </div>
          <div class="pi-links">
            <a :href="site.piPage" target="_blank" rel="noopener" class="btn ghost">{{ t('about.piPage') }} ↗</a>
            <a :href="'mailto:' + site.email" class="btn ghost">{{ site.email }}</a>
          </div>
          <div class="edu-list">
            <span class="edu-label mono">{{ tx({ zh: '教育与研究经历', en: 'EDUCATION & TRAINING' }) }}</span>
            <ul>
              <li v-for="(e, i) in people.pi.education" :key="i">{{ tx(e) }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 大事记 -->
  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'Milestones'" :title="t('about.milestonesTitle')" />
      <TimeLine :items="timeline" />
    </div>
  </section>

  <!-- 合作 -->
  <section class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'Collaborators'" :title="t('about.partnersTitle')" />
      <div class="grid cols-3">
        <div v-for="(p, i) in site.partners" :key="i" class="card hov partner" v-reveal="{ delay: i * 0.08 + 's' }">
          <h3>{{ tx(p.name) }}</h3>
          <p>{{ tx(p.desc) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mission-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 3rem; align-items: start; }
.para { color: var(--ink-dim); margin: 0 0 1rem; line-height: 1.85; }
.mission-cards { display: flex; gap: 0.8rem; margin-top: 1.4rem; flex-wrap: wrap; }
.mc {
  position: relative; overflow: hidden;
  flex: 1 1 150px;
  display: flex; flex-direction: column; gap: 0.45rem; padding: 1rem 1.1rem;
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.06), rgba(19, 28, 49, 0.72));
}
.mc::before {
  content: ""; position: absolute; top: 0; left: 1rem; right: 1rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.65), transparent);
  opacity: 0.55;
}
.mc-num { color: var(--accent); font-size: 0.72rem; letter-spacing: 0.12em; }
.mission-photo .signal-art {
  position: relative; overflow: hidden;
  padding: 1.6rem; display: flex; flex-direction: column; gap: 0.8rem;
  justify-content: center; min-height: 320px;
  background:
    radial-gradient(70% 60% at 68% 18%, rgba(56, 214, 255, 0.1), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.signal-art::before {
  content: ""; position: absolute; top: -25%; right: -15%; width: 70%; height: 80%;
  background: radial-gradient(circle, rgba(124, 140, 255, 0.14), transparent 68%);
  pointer-events: none;
}
.signal-art::after {
  content: ""; position: absolute; top: 0; left: 1.6rem; right: 1.6rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.55), rgba(255, 180, 92, 0.3), transparent);
  opacity: 0.6;
}
.signal-art svg { position: relative; z-index: 1; width: 100%; height: auto; }
.sa-grid path { stroke: rgba(120, 150, 200, 0.1); stroke-width: 1; }
.sa-label { font-family: var(--font-mono); font-size: 11px; fill: var(--ink-dim); letter-spacing: 0.2em; }
.sa-label-warm { fill: var(--warm); }
.sa-cap { position: relative; z-index: 1; margin: 0; text-align: center; color: var(--ink-dim); font-size: 0.88rem; }

.pi-grid { display: grid; grid-template-columns: 300px 1fr; gap: 2.6rem; align-items: start; }
.pi-photo {
  position: relative; max-width: 320px; padding: 6px;
  border-radius: calc(var(--radius) + 6px);
  background: linear-gradient(160deg, rgba(56, 214, 255, 0.38), rgba(124, 140, 255, 0.14) 45%, rgba(255, 180, 92, 0.22));
  box-shadow: var(--shadow-card);
}
.pi-photo::after {
  content: ""; position: absolute; right: -5px; bottom: 18%; width: 10px; height: 10px;
  border-radius: 50%; background: var(--warm); box-shadow: 0 0 14px rgba(255, 180, 92, 0.7);
}
.pi-photo img { display: block; width: 100%; border-radius: var(--radius); border: 1px solid rgba(7, 11, 20, 0.55); }
.pi-mono { aspect-ratio: 3 / 4; border-radius: var(--radius); overflow: hidden; border: 1px solid rgba(7, 11, 20, 0.55); }
.pi-name { font-family: var(--font-serif); font-weight: 900; margin: 0 0 0.4rem; font-size: 1.65rem; letter-spacing: 0.01em; }
.pi-title { color: var(--ink-dim); font-size: 0.92rem; margin: 0 0 1.1rem; letter-spacing: 0.01em; }
.bio.clamp { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.bio-toggle {
  display: inline-flex; align-items: center; gap: 0.3rem; cursor: pointer;
  padding: 0.3rem 0.75rem; border-radius: var(--r-pill);
  color: var(--accent); background: rgba(19, 28, 49, 0.42);
  border: 1px solid var(--line); font-size: 0.82rem; font-family: inherit;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.bio-toggle:hover { opacity: 1; border-color: var(--accent); background: rgba(56, 214, 255, 0.06); }
.bio-toggle .caret { display: inline-block; margin-left: 0.3rem; transition: transform 0.2s; }
.bio-toggle[aria-expanded="true"] .caret { transform: rotate(180deg); }
@media (pointer: coarse) { .bio-toggle { min-height: 44px; } }
.pi-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0 1.4rem; }
.pi-links { display: flex; gap: 0.8rem; flex-wrap: wrap; }
.edu-list { margin-top: 1.6rem; padding-top: 1.2rem; border-top: 1px dashed var(--line); }
.edu-label { display: block; font-size: 0.74rem; letter-spacing: 0.18em; color: var(--accent); margin-bottom: 0.6rem; }
.edu-list ul { margin: 0; padding: 0; list-style: none; }
.edu-list li { color: var(--ink-dim); font-size: 0.88rem; line-height: 2; }
.edu-list li::before { content: "·"; color: var(--warm); margin-right: 0.6rem; }
.partner { position: relative; overflow: hidden; }
.partner::before {
  content: ""; position: absolute; top: 0; left: 1.4rem; right: 1.4rem; height: 1px;
  background: linear-gradient(90deg, rgba(255, 180, 92, 0.5), transparent);
  opacity: 0.45;
}
.partner h3 { margin: 0 0 0.4rem; font-size: 1.02rem; }
.partner p { margin: 0; font-size: 0.86rem; color: var(--ink-dim); line-height: 1.75; }

@media (max-width: 880px) {
  .mission-grid, .pi-grid { grid-template-columns: 1fr; }
  .mission-photo { order: -1; }
  .pi-photo { margin: 0 auto; }
}
</style>
