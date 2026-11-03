import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import { setupChunkReload } from './utils/chunkReload'
import { setupSessionInterceptor } from './utils/sessionInterceptor'

const app = createApp(App)

const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`
}

app.use(createPinia())
app.use(router)

setupSessionInterceptor(router)
setupChunkReload(router)

app.mount('#app')
