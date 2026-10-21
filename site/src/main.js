// ===== main.js — app bootstrap: create app, install plugins and directives, mount =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Installs the hash router and i18n, registers the ink framework directives
// (app.use(inkDirectives), provides v-tuned) and the v-reveal scroll-in directive,
// imports the global design system (styles/main.css), then mounts to #app.
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { reveal } from './directives/reveal'
import inkDirectives from './ink/directives'
import './styles/main.css'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(inkDirectives)
app.directive('reveal', reveal)
app.mount('#app')
