<script setup>
// ===== BackTop — floating back-to-top button with a scroll-progress ring =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 adds the progress ring,
//  rAF-throttled scroll updates and reduced-motion-aware scrolling.]
// Shows once window.scrollY passes 600px; the conic ring tracks reading progress.
// Rendered once by App.vue; fixed-position, z-index sits below NavBar.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const show = ref(false)
const progress = ref(0)
let ticking = false

// One rAF per scroll burst: reading progress + visibility share the same pass.
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0
    show.value = window.scrollY > 600
    ticking = false
  })
}
function up() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
// passive: scroll fires per frame, and we never call preventDefault
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Transition name="fade">
    <button
      v-if="show"
      class="backtop"
      :style="{ '--p': progress + '%' }"
      :aria-label="t('common.backTop')"
      @click="up"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.backtop {
  position: fixed; right: 1.4rem; bottom: 1.6rem; z-index: 90;
  width: 46px; height: 46px; border-radius: 50%;
  display: grid; place-items: center;
  color: var(--accent); cursor: pointer;
  border: none;
  background:
    radial-gradient(circle, rgba(19, 28, 49, 0.96) 0 71%, transparent 72%),
    conic-gradient(from -90deg, var(--accent) 0 var(--p, 0%), rgba(120, 150, 200, 0.16) var(--p, 0%) 100%);
  box-shadow: var(--shadow-card), 0 0 0 1px rgba(56, 214, 255, 0.16);
  backdrop-filter: blur(8px);
  transition: transform 0.2s var(--ease-out), box-shadow 0.25s ease, color 0.2s ease;
}
.backtop svg { width: 18px; height: 18px; }
.backtop:hover {
  transform: translateY(-2px);
  color: #fff;
  box-shadow: var(--shadow-lift), 0 0 22px rgba(56, 214, 255, 0.3);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s var(--ease-out); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
@media (prefers-reduced-motion: reduce) {
  .backtop, .backtop:hover { transform: none; }
  .fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
  .fade-enter-from, .fade-leave-to { transform: none; }
}
</style>
