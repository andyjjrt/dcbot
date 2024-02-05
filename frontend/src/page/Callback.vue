<template>callback</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const fragment = new URLSearchParams(route.hash.slice(1));
  const [accessToken, tokenType] = [fragment.get("access_token"), fragment.get("token_type")];
  const token = `${tokenType} ${accessToken}`;
  localStorage.setItem("token", token);
  router.push("/");
});
</script>
