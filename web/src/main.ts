import { createApp } from 'vue'
import '@syvora/ui/style.css'
import './style.css'
import App from './App.vue'
import router from './router/index'

createApp(App).use(router).mount('#app')
