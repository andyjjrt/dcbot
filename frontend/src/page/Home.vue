<template>
  <div class="h-full w-full flex flex-col">
    <div class="grow overflow-hidden">
      <div class="h-full overflow-auto">
        <div v-for="track in data.queue" :key="track.id">
          <div class="card card-compact bg-base-100 shadow-lg m-5">
            <div class="card-body grow flex-row items-center gap-3">
              <img :src="track.thumbnail" class="aspect-auto rounded-md shrink-0 h-[4.5rem]" />
              <div class="flex flex-col overflow-hidden grow shrink-1 w-0">
                <span class="text-lg font-semibold truncate">
                  <a :href="track.url">{{ track.title }}</a>
                </span>
                <span class="font-semibold truncate">
                  <a :href="track.channelUrl">{{ track.channel }}</a>
                </span>
              </div>
              <a :href="'/api/song/' + track.ytId" :download="track.title" class="btn text-lg">
                <Icon icon="material-symbols:download-2-rounded" />
              </a>
            </div>
          </div>
        </div>
        <div class="hero h-full bg-base-300" v-if="data.queue.length === 0">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">Empty Here</h1>
              <p class="py-6">Go to discord and play a song using /play</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="shrink-0 h-24 bg-base-200 flex items-center gap-3 p-4" v-if="data.currentPlaying">
      <img :src="data.currentPlaying.thumbnail" class="aspect-auto rounded-md shrink-0 h-[4.5rem]" />
      <div class="flex flex-col overflow-hidden gap-1 grow shrink-1 w-0">
        <div class="flex items-center gap-2">
          <div class="truncate grow">
            <a class="text-lg font-semibold" :href="data.currentPlaying.url">{{ data.currentPlaying.title }}</a>
            <a class="font-semibold" :href="data.currentPlaying.channelUrl">
              {{ data.currentPlaying.channel }}
            </a>
          </div>
          <a :href="'/api/song/' + data.currentPlaying.ytId" :download="data.currentPlaying.title" class="btn btn-neutral btn-sm">
            <Icon icon="material-symbols:download-2-rounded" />
          </a>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Manager, Socket } from "socket.io-client";
import { useTimestamp } from "@vueuse/core";
import { fetchApi } from "../utils/api";
import { Icon } from "@iconify/vue";

interface TrackMetaData {
  url: string;
  title: string;
  thumbnail: string;
  channel?: string;
  channelUrl?: string;
  id: string;
  ytId: string;
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
const manager = ref<Manager>(new Manager());
const lobbySocket = ref<Socket>(manager.value.socket("/lobby"));
const queueSocket = ref<Socket>(manager.value.socket("/queue"));

queueSocket.value.on("queue", (res) => {
  Object.assign(data, res);
});
queueSocket.value.on("disconnect", () => {
  Object.assign(data, initData);
  queueId.value = undefined;
});

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

const initQueueSocket = async () => {
  return fetchApi("/verify", "POST", {
    data: {
      guildId: route.params.guildId,
    },
  }).then((res) => {
    queueId.value = res.data.data.queueId;
    queueSocket.value.emit("enter", {
      guildId: route.params.guildId,
      queueId: res.data.data.queueId,
    });
  });
};

lobbySocket.value.on("ping", () => {
  if (queueId.value) return;
  initQueueSocket();
});

onMounted(() => {
  lobbySocket.value.emit("enter", {
    guildId: route.params.guildId,
  });
});

onUnmounted(() => {
  lobbySocket.value.emit("leave", {
    guildId: route.params.guildId,
  });
});

watch(
  () => route.params.guildId,
  (value, oldValue) => {
    lobbySocket.value.emit("leave", {
      guildId: oldValue,
    });
    lobbySocket.value.emit("enter", {
      guildId: value,
    });
  }
);
</script>
