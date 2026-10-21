<script setup>
// ===== SectionHead — standard section header: eyebrow + title + description + slot =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 aligns the optional
//  slot as a right-side action instead of stacking it under the description.]
// Props: eyebrow (mono kicker line), title, optional desc; default slot carries extra
// content (e.g. a "view all" link). The block fades in via v-reveal. Used by most views.
defineProps({
  eyebrow: String,
  title: String,
  desc: String,
})
</script>

<template>
  <div class="sec-head" v-reveal>
    <div class="sh-main">
      <div class="sh-copy">
        <span class="eyebrow">{{ eyebrow }}</span>
        <h2 class="sec-title">{{ title }}</h2>
        <p v-if="desc" class="sec-desc">{{ desc }}</p>
      </div>
      <div v-if="$slots.default" class="sh-side">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sec-head { margin-bottom: 2.6rem; }
.sh-main { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; }
.sh-copy { min-width: 0; }
/* The global .sec-desc bottom margin is meant for standalone use; the header owns the
   vertical rhythm here, otherwise desc + header margin double up to a 5rem gap. */
.sh-copy .sec-desc { margin-bottom: 0; }
.sh-side { flex: none; padding-bottom: 0.15rem; display: flex; align-items: center; justify-content: flex-end; }
@media (max-width: 640px) {
  .sh-main { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .sh-side { width: 100%; padding-bottom: 0; }
}
</style>
