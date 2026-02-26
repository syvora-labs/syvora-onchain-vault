import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import ForumView from "../views/ForumView.vue";
import UserProfileView from "../views/UserProfileView.vue";

export default createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: "/", component: HomeView },
        { path: "/profile", component: ProfileView },
        { path: "/forum", component: ForumView },
        { path: "/u/:username", component: UserProfileView },
    ],
});
