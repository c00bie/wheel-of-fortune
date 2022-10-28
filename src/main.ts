import { createApp } from 'vue'
import App from './App.vue'
import { createVuestic } from 'vuestic-ui'
import { createPinia } from 'pinia'
import i18n from './i18n'
import 'vuestic-ui/css'

createApp(App).use(createVuestic()).use(createPinia()).use(i18n).mount('#app')