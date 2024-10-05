<template>
  <div class="flex flex-col gap-2 rounded-r-xl p-3 bg-base-100 overflow-auto">
    <RouterLink to="/">
      <div class="avatar placeholder">
        <div class="bg-neutral text-neutral-content w-12" :class="route.params.guildId ? 'rounded-full' : 'rounded-xl'">
          <img :src="userIconUrl((user as any).id, (user as any).avatar)" />
        </div>
      </div>
    </RouterLink>

    <template v-for="guild in sortedGuild" :key="(guild as any).id">
      <component :is="(guild as any).botExist ? 'router-link': 'span' " :to="'/' + (guild as any).id" disabled>
        <div class="avatar placeholder" v-if="(guild as any).icon === null">
          <div
            class="bg-neutral text-neutral-content w-12"
            :class="route.params.guildId === (guild as any).id ? 'rounded-xl' : 'rounded-full'"
          >
            <span class="text-3xl">{{ (guild as any).name[0] }}</span>
          </div>
        </div>
        <div class="avatar" v-else>
          <div class="w-12" :class="route.params.guildId === (guild as any).id ? 'rounded-xl' : 'rounded-full'">
            <img
              :src="guildIconUrl((guild as any).id, (guild as any).icon)"
              :class="{'grayscale': !(guild as any).botExist}"
            />
          </div>
        </div>
      </component>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "../store/user";

const { guilds, user } = useUserStore();
const route = useRoute();

const sortedGuild = computed(() => {
  return guilds.sort((a: any, b: any) => {
    const _a = a.botExist === true ? 1 : 0;
    const _b = b.botExist === true ? 1 : 0;
    return _b - _a;
  });
});

const guildIconUrl = computed(() => {
  return (guildId: string, guildIcon: string) => `https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.png`;
});

const userIconUrl = computed(() => {
  return (userId: string, userAvatar: string | undefined) => {
    if (!userAvatar) return "https://cdn.discordapp.com/embed/avatars/index.png";
    return `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.${userAvatar.startsWith("a_") ? "gif" : "png"}`;
  };
});
</script>
