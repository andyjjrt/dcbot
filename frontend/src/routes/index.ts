import { createRouter, createWebHistory } from "vue-router";

import Layout from "../page/Layout.vue";
import Home from "../page/Home.vue";
import Callback from "../page/Callback.vue";

const routes = [
  {
    path: "/",
    component: Layout,
    children: [{ path: "/:guildId", name: "Home", component: Home }],
  },
  { path: "/callback", name: "Callback", component: Callback },
];

export const router = createRouter({
  history: createWebHistory(),
  routes, // short for `routes: routes`
});

export default router;
