<template>
  <div class="w-full h-full">
    <div class="w-full h-full flex justify-center items-center" v-if="!loading">
      <span class="loading loading-spinner text-primary loading-lg" v-if="loading === undefined"></span>
      <a class="btn btn-primary normal-case" :href="loginUrl" v-else> Discord Login </a>
    </div>
    <div class="w-full h-full flex bg-base-300" v-else>
      <LeftNav />
      <div class="grow">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import LeftNav from "../components/LeftNav.vue";
import { useUserStore } from "../store/user";

const { init } = useUserStore();
const loading = ref<boolean | undefined>(undefined);

const loginUrl = computed(() => {
  return `https://discord.com/api/oauth2/authorize?client_id=${
    import.meta.env.VITE_DISCORD_CLIENTID
  }&response_type=token&redirect_uri=${encodeURI(window.location.origin)}%2Fcallback&scope=identify+guilds`;
});

onMounted(() => {
  init()
    .then(() => {
      loading.value = true;
    })
    .catch((error) => {
      loading.value = false;
      console.log(error);
    });
});
</script>
