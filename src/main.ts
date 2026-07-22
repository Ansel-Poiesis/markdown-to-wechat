import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { shouldReloadAfterPreloadError } from './utils/preloadRecovery'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (shouldReloadAfterPreloadError(sessionStorage)) window.location.reload()
})

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
