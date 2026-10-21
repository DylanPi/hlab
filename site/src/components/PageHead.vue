<script setup>
// ===== PageHead — shared inner-page header: editorial index, eyebrow, title, lead =====
// [EN header added Deep Signal pass 2026-10-20; Chinese tuning notes preserved elsewhere.]
// Props: index (two-digit site-section number, decorative), eyebrow (English mono kicker),
// title and lead (already localised by the view). Base layout, aurora and bottom signal
// rule live in styles/main.css (.page-head); this component adds the oversized outlined
// index watermark. The index is aria-hidden so screen readers get a clean heading order.
defineProps({
  index: String,
  eyebrow: String,
  title: String,
  lead: String,
})
</script>

<template>
  <header class="page-head">
    <div class="container ph-inner">
      <span v-if="index" class="ph-index mono" aria-hidden="true">{{ index }}</span>
      <span class="eyebrow">{{ eyebrow }}</span>
      <h1>{{ title }}</h1>
      <p>{{ lead }}</p>
    </div>
  </header>
</template>

<style scoped>
.ph-inner { position: relative; }
/* Watermark sits in the positioned layer; content is raised above it explicitly. */
.ph-index {
  position: absolute;
  top: -1.4rem;
  right: 0;
  z-index: 0;
  font-size: clamp(5.5rem, 13vw, 9.5rem);
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(140, 175, 225, 0.16);
  pointer-events: none;
  user-select: none;
}
.ph-inner .eyebrow,
.ph-inner h1,
.ph-inner p { position: relative; z-index: 1; }
@media (max-width: 760px) {
  .ph-index { top: -1.2rem; right: -0.4rem; font-size: clamp(5rem, 22vw, 7rem); opacity: 0.7; }
}
</style>
