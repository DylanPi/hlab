<script setup>
// ===== PubItem — publication card with BibTeX generation and copy-to-clipboard =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 moves the copy button
//  into the header row so it never collides with a long title.]
// Props: pub (data/publications.json entry). Entry type switches the BibTeX stanza:
// pub.type === 'conference' -> @inproceedings/booktitle, else @article/journal; the key
// is first-author surname + year + first English word of the venue (unique per list).
// Copy uses the async Clipboard API with a hidden-textarea execCommand fallback for
// non-secure contexts, then shows the "copied" confirmation for 1.6s.
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { tx } from '../utils/tx'

const props = defineProps({
  pub: { type: Object, required: true },
})
const { t } = useI18n()
const copied = ref(false)

// BibTeX key：一作姓 + 年份 + 期刊/会议名首个英文单词，全列表内唯一
function bibKey(p) {
  const first = (p.authors.replace(/【[^】]*】/g, '').trim().split(',')[0] || 'Hao Lab').trim()
  const last = first.split(/\s+/).pop().replace(/[^A-Za-z]/g, '') || 'Hao'
  const venueWord = (p.venue.replace(/【[^】]*】/g, '').match(/[A-Za-z]+/) || ['misc'])[0].toLowerCase()
  return (last + p.year + venueWord).toLowerCase()
}

function bib() {
  const p = props.pub
  const authors = p.authors.replace(/【[^】]*】/g, '').trim() || 'Hao Lab'
  const title = (p.title && p.title.en) || tx(p.title) // BibTeX 固定用英文原题
  const venue = p.venue.replace(/【[^】]*】/g, '').trim()
  const conf = p.type === 'conference'
  return [
    (conf ? '@inproceedings{' : '@article{') + bibKey(p) + ',',
    '  title   = {' + title + '},',
    '  author  = {' + authors + '},',
    (conf ? '  booktitle = {' : '  journal  = {') + venue + '},',
    '  year    = {' + p.year + '},',
    p.doi ? '  doi     = {' + p.doi + '},' : '',
    '}',
  ].filter(Boolean).join('\n')
}

async function copy() {
  try {
    await navigator.clipboard.writeText(bib())
  } catch {
    // Clipboard API rejected/unavailable (e.g. plain http): legacy execCommand fallback
    const ta = document.createElement('textarea')
    ta.value = bib()
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

const venueClean = computed(() => props.pub.venue.replace(/【[^】]*】/g, '').trim())
</script>

<template>
  <article class="pub card hov" :class="{ featured: pub.flag === 'featured' }">
    <div class="pub-head">
      <span class="year mono">{{ pub.year }}</span>
      <span v-if="pub.flag === 'featured'" class="tag">★ Featured</span>
      <button class="copy mono" :class="{ copied }" @click="copy">
        {{ copied ? t('common.copied') : t('common.copyBib') }}
      </button>
    </div>
    <h3 class="pub-title">{{ tx(pub.title) }}</h3>
    <p class="pub-authors">{{ pub.authors }}</p>
    <div class="pub-meta">
      <span class="tag purple">{{ venueClean }}</span>
      <a v-if="pub.doi" :href="pub.doi" target="_blank" rel="noopener" class="doi mono">{{ pub.doi }}</a>
      <span v-if="pub.note" class="note">{{ tx(pub.note) }}</span>
    </div>
  </article>
</template>

<style scoped>
.pub { position: relative; padding: 1.2rem 1.4rem 1.2rem calc(1.4rem + 10px); }
.pub::before {
  content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px;
  border-radius: 3px; background: var(--line);
}
.pub.featured {
  border-color: rgba(56, 214, 255, 0.22);
  background:
    linear-gradient(120deg, rgba(56, 214, 255, 0.07), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.pub.featured::before { background: var(--grad); box-shadow: 0 0 10px rgba(56, 214, 255, 0.5); }
.pub-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.45rem; flex-wrap: wrap; }
.year { font-size: 0.8rem; letter-spacing: 0.08em; color: var(--accent); }
.pub-title { margin: 0 0 0.32rem; font-size: 1.02rem; line-height: 1.5; }
.pub-authors { margin: 0 0 0.6rem; font-size: 0.85rem; line-height: 1.65; color: var(--ink-dim); }
.pub-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.doi { font-size: 0.74rem; color: var(--ink-dim); overflow-wrap: anywhere; }
.doi:hover { color: var(--accent); }
.note { font-size: 0.74rem; color: var(--warm); }
.copy {
  margin-left: auto;
  font-size: 0.7rem; padding: 0.28rem 0.7rem; border-radius: var(--r-pill);
  background: rgba(19, 28, 49, 0.9); color: var(--ink-dim);
  border: 1px solid var(--line); cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.copy:hover { color: var(--accent); border-color: var(--accent); }
.copy.copied { color: var(--warm); border-color: rgba(255, 180, 92, 0.42); background: rgba(255, 180, 92, 0.08); }
@media (max-width: 640px), (pointer: coarse) {
  .copy { min-height: 44px; padding: 0.5rem 1.05rem; font-size: 0.76rem; }
}
</style>
