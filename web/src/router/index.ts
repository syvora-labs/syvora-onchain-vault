import { createRouter, createWebHistory } from 'vue-router'
import HomeView    from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',        component: HomeView },
    { path: '/profile', component: ProfileView },
  ],
})
