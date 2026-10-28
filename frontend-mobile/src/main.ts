import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import { useAuthStore } from './stores/auth.store'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import './theme/variables.css'

const pinia = createPinia()
const app = createApp(App)

app.use(IonicVue)
app.use(pinia) // Inyectamos Pinia antes de usar cualquier store

const initApp = async () => {
  const authStore = useAuthStore()

  // Espera a que el backend responda si hay sesión activa
  await authStore.checkSession()

  // Inyecta el router solo cuando currentRole ya está definido
  app.use(router)

  router.isReady().then(() => {
    app.mount('#app')
  })
}

initApp()