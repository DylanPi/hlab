<script setup>
// ===== GalleryView.vue - Photo wall with an intentional designed empty state =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/gallery | Data: site.json (gallery array) | i18n: gallery.*
// Entries missing src are filtered out; when nothing remains (site.json gallery is []) the
// template renders the designed empty-state card (decorative SVG + i18n line) instead of a
// blank section - the empty state is a finished design, not a placeholder stub.
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import site from '../data/site.json'
import { tx } from '../utils/tx'

const { t } = useI18n()
// Only entries with a real src reach the wall; length 0 selects the empty-state branch below.
const photos = site.gallery.filter((g) => g.src)
</script>

<template>
  <PageHead index="07" eyebrow="Gallery" :title="t('gallery.title')" :lead="t('gallery.lead')" />

  <!-- 有真实照片时按图片墙渲染；无照片时显示设计化空态 -->
  <section v-if="photos.length" class="section">
    <div class="container wall">
      <!-- Every 5th item (i % 5 === 0) spans two grid rows (.tall) for a masonry-like rhythm -->
      <figure
        v-for="(g, i) in photos"
        :key="i"
        class="g-item"
        :class="{ tall: i % 5 === 0 }"
        v-reveal="{ delay: (i % 4) * 0.06 + 's' }"
      >
        <img :src="g.src" :alt="tx(g.caption)" loading="lazy" />
        <figcaption>{{ tx(g.caption) }}</figcaption>
      </figure>
    </div>
  </section>

  <section v-else class="section">
    <div class="container">
      <div class="g-empty card" v-reveal>
        <div class="ge-frame">
        <svg class="ge-art" viewBox="0 0 220 150" aria-hidden="true">
          <defs>
            <linearGradient id="geGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#38d6ff" />
              <stop offset="1" stop-color="#7c8cff" />
            </linearGradient>
          </defs>
          <rect x="18" y="26" width="118" height="92" rx="8" fill="none" stroke="url(#geGrad)" stroke-width="2.5" opacity="0.85" />
          <circle cx="46" cy="52" r="9" fill="none" stroke="#ffb45c" stroke-width="2.5" opacity="0.9" />
          <path d="M28 108 L64 74 L88 96 L112 70 L126 84" fill="none" stroke="#38d6ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
          <rect x="96" y="46" width="104" height="78" rx="8" fill="#0b1220" stroke="rgba(120,150,200,0.4)" stroke-width="1.5" />
          <path d="M108 108 C 128 96, 148 112, 168 98 S 190 100, 196 92" fill="none" stroke="#ffb45c" stroke-width="3" stroke-linecap="round" opacity="0.8" />
          <path d="M104 66 L136 66 M104 76 L124 76" stroke="rgba(56,214,255,0.5)" stroke-width="2" stroke-linecap="round" />
        </svg>
        </div>
        <p>{{ t('gallery.empty') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wall {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 190px;
  gap: 1rem;
}
.g-item {
  position: relative; margin: 0; overflow: hidden;
  border-radius: var(--radius); border: 1px solid var(--line);
  background: var(--bg-2);
}
.g-item.tall { grid-row: span 2; }
.g-item img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.5s var(--ease-out);
}
.g-item:hover img { transform: scale(1.04); }
figcaption {
  position: absolute; inset: auto 0 0;
  padding: 1.6rem 0.9rem 0.75rem;
  font-size: 0.8rem; color: var(--ink);
  background: linear-gradient(0deg, rgba(7, 11, 20, 0.82), transparent);
}
.g-empty {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1.3rem; padding: 4.5rem 1.6rem; text-align: center;
  background:
    radial-gradient(60% 70% at 50% 0%, rgba(56, 214, 255, 0.08), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.g-empty::before {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120, 150, 200, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 150, 200, 0.055) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(70% 70% at 50% 45%, #000, transparent 78%);
  mask-image: radial-gradient(70% 70% at 50% 45%, #000, transparent 78%);
  pointer-events: none;
}
.g-empty::after {
  content: ""; position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 214, 255, 0.5), rgba(255, 180, 92, 0.3), transparent);
  opacity: 0.7;
}
.ge-frame {
  position: relative; z-index: 1; width: min(340px, 76%);
  padding: 1.1rem; border: 1px solid rgba(56, 214, 255, 0.18);
  border-radius: var(--r-lg); background: rgba(7, 11, 20, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.ge-art { display: block; width: 100%; height: auto; }
.g-empty p { position: relative; z-index: 1; margin: 0; color: var(--ink-dim); font-size: 0.95rem; }
@media (max-width: 900px) { .wall { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .wall { grid-template-columns: 1fr; grid-auto-rows: 220px; } }
@media (prefers-reduced-motion: reduce) {
  .g-item img, .g-item:hover img { transition: none; transform: none; }
}
</style>
