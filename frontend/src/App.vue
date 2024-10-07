<template>
  <Home :guildId="discordSdk.guildId || ''" v-if="isReady && auth" />
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useDiscordStore } from "./store/discord";
import Home from "./page/Home.vue";
import { storeToRefs } from "pinia";

const discordStore = useDiscordStore();
const { isReady, auth } = storeToRefs(discordStore)
const { discordSdk } = discordStore

watch(isReady, (val) => {
  if (val) {
    discordSdk.commands.setActivity({
      activity: {
        type: 2,
        details: "Details",
        state: "Playing",
      },
    });
  }
});
</script>