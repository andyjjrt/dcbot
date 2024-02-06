<template>
  <div class="h-full w-full flex flex-col">
    <div class="grow overflow-auto">
      <div v-for="track in data.queue" :key="track.id">
        <div class="card card-compact bg-base-100 shadow-lg m-4">
          <div class="card-body grow flex-row items-center gap-3">
            <img :src="track.thumbnail" class="aspect-auto rounded-md shrink-0 h-[4.5rem]" />
            <div class="flex flex-col overflow-hidden grow shrink-1 w-0">
              <a class="text-lg font-semibold truncate block" :href="track.url">{{ track.title }}</a>
              <p class="inline-block min-w-0">
                <a class="font-semibold truncate block" :href="track.channelUrl">
                  {{ track.channel }}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="hero min-h-screen bg-base-200" v-if="data.queue.length === 0">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">Empty Here</h1>
            <p class="py-6">Go to discord and play a song using /play</p>
          </div>
        </div>
      </div>
    </div>
    <div class="shrink-0 h-24 bg-base-200 flex items-center gap-3 p-4" v-if="data.currentPlaying">
      <img :src="data.currentPlaying.thumbnail" class="aspect-auto rounded-md shrink-0 h-[4.5rem]" />
      <div class="flex flex-col overflow-hidden grow shrink-1 w-0">
        <div class="flex gap-2">
          <a class="text-lg font-semibold truncate" :href="data.currentPlaying.url">{{ data.currentPlaying.title }}</a>
          <p class="inline-block min-w-0">
            <a class="font-semibold truncate" :href="data.currentPlaying.channelUrl">
              {{ data.currentPlaying.channel }}
            </a>
          </p>
        </div>
        <div class="flex items-center text-sm gap-2 shrink-0">
          <span>{{ formatTime(progress) }}</span>
          <progress class="progress progress-primary grow" :value="progress" :max="progressTotal"></progress>
          <span>{{ formatTime(progressTotal) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { Socket, io } from "socket.io-client";
import { useTimestamp } from "@vueuse/core";
import { fetchApi } from "../utils/api";

interface TrackMetaData {
  url: string;
  title: string;
  thumbnail: string;
  channel?: string;
  channelUrl?: string;
  id: string;
}

interface Data {
  queue: TrackMetaData[];
  loop: string;
  currentPlaying: TrackMetaData | null;
  startTime: number;
  endTime: number;
}

const initData: Data = {
  queue: [],
  loop: "one",
  currentPlaying: null,
  startTime: -1,
  endTime: -1,
};

const timestamp = useTimestamp({ offset: 0 });
const route = useRoute();
const data = reactive<Data>({ ...initData });
const queueId = ref<string | undefined>(undefined);
const lobbySocket = ref<Socket>(
  io("/lobby", {
    query: {
      guildId: route.params.guildId,
    },
  })
);
const queueSocket = ref<Socket | undefined>(undefined);

const progress = computed(() => timestamp.value - data.startTime);
const progressTotal = computed(() => data.endTime - data.startTime);

const formatTime = computed(() => {
  return (time: number) => {
    const flooredTime = Math.round(time / 1000);
    const minute = Math.floor(flooredTime / 60);
    const second = flooredTime % 60;
    return `${minute < 10 ? "0" : ""}${minute}:${second < 10 ? "0" : ""}${second}`;
  };
});

lobbySocket.value.on("ping", () => {
  if (queueId.value) return;
  fetchApi("/verify", "POST", {
    data: {
      guildId: route.params.guildId,
    },
  })
    .then((res) => {
      queueId.value = res.data.data.queueId;
      console.log(res.data.data.queueId, route.params.guildId)
      queueSocket.value = io("/queue", {
        query: {
          queueId: res.data.data.queueId,
          guildId: route.params.guildId,
        },
      });
      queueSocket.value.on("connect", () => {
        console.log("connected to queue")
      });
      queueSocket.value.on("queue", (res) => {
        Object.assign(data, res);
      });
      queueSocket.value.on("disconnect", () => {
        Object.assign(data, initData);
        queueId.value = undefined;
      });
    })
});

onMounted(() => {
  // socket.emit("queue");
});
</script>
