<template>
  <div class="flex flex-col gap-2 rounded-r-xl p-3 bg-base-100 overflow-auto">
    <template v-for="guild in sortedGuild" :key="(guild as any).id">
      <component :is="(guild as any).botExist ? 'router-link': 'span' " :to="'/' + (guild as any).id" disabled>
        <div class="avatar placeholder" v-if="(guild as any).icon === null">
          <div class="bg-neutral text-neutral-content rounded-xl w-16">
            <span class="text-3xl">{{ (guild as any).name[0] }}</span>
          </div>
        </div>
        <div class="avatar" v-else>
          <div class="w-16 rounded-xl">
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
import { useUserStore } from "../store/user";

const { guilds } = useUserStore();

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
</script>
