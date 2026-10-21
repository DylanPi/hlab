<script setup>
// ===== PeopleView.vue - Lab roster: PI + contact card, then member groups sorted by join year =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/people | Data: people.json | i18n: people.*, common.*
// bySince sorts ascending by 'since' year (entries without a year go last, same-year keeps
// JSON order). PersonCard renders the MonogramAvatar placeholder when a person has no photo.
// master / undergrad / alumni sections are v-if-guarded on array length so empty groups
// auto-hide; the Ph.D. section always shows. The recruiting "join" card sits at the end of
// the master grid and therefore hides together with that section when master is empty.
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import SectionHead from '../components/SectionHead.vue'
import PersonCard from '../components/PersonCard.vue'
import people from '../data/people.json'
import { bySince, tx } from '../utils/tx'

const { t } = useI18n()

// Copy-then-sort: never mutate the shared JSON module import in place.
const phdSorted = [...people.phd].sort(bySince)
const masterSorted = [...people.master].sort(bySince)
const undergradSorted = [...people.undergrad].sort(bySince)
const alumniSorted = [...people.alumni].sort(bySince)
</script>

<template>
  <PageHead index="06" eyebrow="People" :title="t('people.title')" :lead="t('people.lead')" />

  <!-- PI -->
  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'PI'" :title="t('common.pi')" />
      <div class="pi-row">
        <div class="pi-person" v-reveal>
          <PersonCard :person="people.pi" :role="t('common.pi')" />
        </div>
        <div class="pi-quick card" v-reveal="{ delay: '0.08s' }">
          <div class="pi-quick-block">
            <h3>{{ t('common.email') }}</h3>
            <a href="mailto:yaoyaoh@zju.edu.cn">yaoyaoh@zju.edu.cn</a>
          </div>
          <div class="pi-quick-block">
            <h3>{{ t('people.homepage') }}</h3>
            <a href="https://person.zju.edu.cn/yaoyaoh" target="_blank" rel="noopener">person.zju.edu.cn/yaoyaoh ↗</a>
          </div>
          <div class="pi-interests">
            <span v-for="(it, i) in people.pi.interests" :key="i" class="tag">{{ tx(it) }}</span>
          </div>
          <span class="pi-quick-mark" aria-hidden="true">{{ tx(people.pi.name).charAt(0) }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 博士生 -->
  <section class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'Ph.D.'" :title="t('people.phd')">
        <span class="group-count mono" aria-hidden="true">{{ phdSorted.length }}</span>
      </SectionHead>
      <div class="grid cols-3">
        <PersonCard
          v-for="(p, i) in phdSorted"
          :key="i"
          :person="p"
          role="Ph.D."
          v-reveal="{ delay: (i % 4) * 0.06 + 's' }"
        />
      </div>
    </div>
  </section>

  <!-- 硕士 -->
  <section v-if="masterSorted.length" class="section">
    <div class="container">
      <SectionHead :eyebrow="'Master'" :title="t('people.master')">
        <span class="group-count mono" aria-hidden="true">{{ masterSorted.length }}</span>
      </SectionHead>
      <div class="grid cols-3">
        <PersonCard
          v-for="(p, i) in masterSorted"
          :key="i"
          :person="p"
          role="Master"
          v-reveal="{ delay: (i % 4) * 0.06 + 's' }"
        />
        <RouterLink to="/join" class="card hov join-card">
          <span class="jc-q" aria-hidden="true">＋</span>
          <strong>{{ t('people.joinCard') }}</strong>
          <span class="jc-desc">{{ t('people.joinCardDesc') }}</span>
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- 本科生（毕设/实习）：people.json 的 undergrad 数组有数据时自动显示 -->
  <section v-if="undergradSorted.length" class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'Undergrad'" :title="t('people.undergrad')">
        <span class="group-count mono" aria-hidden="true">{{ undergradSorted.length }}</span>
      </SectionHead>
      <div class="grid cols-3">
        <PersonCard
          v-for="(p, i) in undergradSorted"
          :key="i"
          :person="p"
          role="Undergrad"
          v-reveal="{ delay: (i % 4) * 0.06 + 's' }"
        />
      </div>
    </div>
  </section>

  <!-- 校友：alumni 数组有数据时自动显示，since/until 显示在组年份区间 -->
  <section v-if="alumniSorted.length" class="section">
    <div class="container">
      <SectionHead :eyebrow="'Alumni'" :title="t('people.alumni')">
        <span class="group-count mono" aria-hidden="true">{{ alumniSorted.length }}</span>
      </SectionHead>
      <div class="grid cols-3">
        <PersonCard
          v-for="(p, i) in alumniSorted"
          :key="i"
          :person="p"
          role="Alumni"
          v-reveal="{ delay: (i % 4) * 0.06 + 's' }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pi-row {
  display: grid; grid-template-columns: minmax(250px, 300px) 1fr;
  gap: 1.5rem; align-items: start;
}
.pi-person { min-width: 0; }
.pi-quick {
  position: relative; overflow: hidden;
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem 2rem;
  padding: 1.5rem 1.6rem; align-content: start;
}
.pi-quick::before {
  content: ""; position: absolute; top: 0; left: 1.6rem; right: 1.6rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.5), transparent);
  opacity: 0.5;
}
.pi-quick-block, .pi-interests { position: relative; z-index: 1; }
.pi-quick-block { min-width: 0; }
/* Oversized surname watermark fills the wide card without adding information. */
.pi-quick-mark {
  position: absolute; right: 2rem; top: 50%; transform: translateY(-50%);
  z-index: 0; font-family: var(--font-serif); font-size: clamp(7rem, 12vw, 10rem);
  font-weight: 900; line-height: 1; color: var(--ink); opacity: 0.035;
  pointer-events: none; user-select: none;
}
.pi-quick h3 {
  margin: 0 0 0.35rem; font-family: var(--font-mono); font-size: 0.72rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-dim); font-weight: 500;
}
.pi-quick a { font-size: 0.92rem; word-break: break-all; }
.pi-interests {
  grid-column: 1 / -1;
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  padding-top: 1.1rem; border-top: 1px solid var(--line-soft);
}
.group-count {
  display: inline-grid; place-items: center;
  min-width: 34px; height: 34px; padding: 0 0.55rem;
  border-radius: var(--r-pill); border: 1px solid var(--line);
  background: rgba(19, 28, 49, 0.4);
  font-size: 0.74rem; color: var(--ink-dim);
}
.join-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; text-align: center; color: var(--ink-dim); min-height: 260px;
  border-style: dashed; background: rgba(19, 28, 49, 0.35); box-shadow: none;
}
.jc-q { font-size: 2rem; color: var(--accent); line-height: 1; }
.join-card strong { color: var(--ink); font-size: 1.05rem; }
.jc-desc { font-size: 0.85rem; }
@media (max-width: 760px) {
  .pi-row { grid-template-columns: 1fr; }
  .pi-person { max-width: 340px; }
  .pi-quick { grid-template-columns: 1fr; }
  .pi-quick-mark { display: none; }
}
</style>
