// ===== i18n — vue-i18n instance plus language persistence =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// legacy:false (Composition API mode); locale restored from localStorage 'haolab-lang'
// with zh as both default and fallbackLocale. setLang() switches the active locale,
// persists the choice and syncs <html lang>; called by the NavBar language toggle.
import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

const saved = localStorage.getItem('haolab-lang')
const locale = saved === 'en' ? 'en' : 'zh'

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export function setLang(l) {
  i18n.global.locale.value = l
  localStorage.setItem('haolab-lang', l)
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
}

export default i18n
