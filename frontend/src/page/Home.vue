<template>
  <div v-if="layoutMode === 1">
    <div v-if="data.currentPlaying">
      <div class="flex justify-center items-center h-screen w-screen">
        <img
          :src="data.currentPlaying.thumbnail.replace('https://i.ytimg.com', '/ytimg')"
          class="absolute aspect-ratio w-screen"
        />
      </div>
      <div
        class="flex flex-col overflow-hidden gap-1 grow shrink-1 w-screen absolute bottom-0 px-4 py-2 bg-black bg-opacity-40 backdrop-blur-[2px] z-20"
      >
        <div class="flex items-center gap-2">
          <div class="truncate grow">
            <a class="font-semibold">{{ data.currentPlaying.title }}</a>
            <a class="font-semibold">
              {{ data.currentPlaying.channel }}
            </a>
          </div>
        </div>
        <div class="flex items-center text-sm gap-2 shrink-0 w-full">
          <span class="text-xs">{{ formatTime(progress) }}</span>
          <progress class="progress grow" :value="progress" :max="progressTotal"></progress>
          <span class="text-xs">{{ formatTime(progressTotal) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="hero-content text-center h-screen">
      <div class="max-w-md">
        <h1 class="text-4xl font-bold">Empty Here</h1>
        <p class="pt-4 text-sm">Go to discord and play a song using /play</p>
      </div>
    </div>
  </div>
  <div class="h-full w-full flex flex-col" v-else>
    <div class="grow overflow-hidden">
      <div class="h-full overflow-auto">
        <div v-for="track in data.queue" :key="track.id">
          <div class="card card-compact bg-base-100 shadow-lg m-5">
            <div class="card-body grow flex-row items-center gap-3">
              <img
                :src="track.thumbnail.replace('https://i.ytimg.com', '/ytimg')"
                class="aspect-auto rounded-md shrink-0 h-[4.5rem]"
              />
              <div class="flex flex-col overflow-hidden grow shrink-1 w-0">
                <span class="text-lg font-semibold truncate">
                  <a @click="openLink(track.url)" class="cursor-pointer">{{ track.title }}</a>
                </span>
                <span class="font-semibold truncate">
                  <a @click="track.channelUrl ? openLink(track.channelUrl) : null" class="cursor-pointer">{{
                    track.channel
                  }}</a>
                </span>
              </div>
              <!-- <a :href="'/api/song/' + track.ytId" :download="track.title" class="btn text-lg">
                <Icon icon="material-symbols:download-2-rounded" />
              </a> -->
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
      <img
        :src="data.currentPlaying.thumbnail.replace('https://i.ytimg.com', '/ytimg')"
        class="aspect-auto rounded-md shrink-0 h-[4.5rem]"
      />
      <div class="flex flex-col overflow-hidden gap-1 grow shrink-1 w-0">
        <div class="flex items-center gap-2">
          <div class="truncate grow">
            <a class="text-lg font-semibold cursor-pointer" @click="openLink(data.currentPlaying.url)">{{
              data.currentPlaying.title
            }}</a>
            <a
              class="font-semibold cursor-pointer"
              @click="data.currentPlaying.channelUrl ? openLink(data.currentPlaying.channelUrl) : null"
            >
              {{ data.currentPlaying.channel }}
            </a>
          </div>
          <!-- <a
            @click="openLink('/api/song/' + data.currentPlaying.ytId)"
            :download="data.currentPlaying.title"
            class="btn btn-neutral btn-sm"
          >
            <Icon icon="material-symbols:download-2-rounded" />
          </a> -->
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
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { Manager, Socket } from "socket.io-client";
import { useTimestamp } from "@vueuse/core";
import { fetchApi } from "../utils/api";
import { useDiscordStore } from "../store/discord";
import { storeToRefs } from "pinia";

const discordStore = useDiscordStore();
const { auth, discordSdk } = storeToRefs(discordStore);

const props = defineProps<{ guildId: string }>();

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
const data = reactive<Data>({ ...initData });
const queueId = ref<string | undefined>(undefined);
const manager = ref<Manager>(new Manager({ path: "/.proxy/socketio" }));
const layoutMode = ref(0);
const lobbySocket = ref<Socket>(manager.value.socket("/lobby"));
const queueSocket = ref<Socket>(manager.value.socket("/queue"));

const openLink = (url: string) => {
  discordSdk.value.commands.openExternalLink({
    url: url,
  });
};

queueSocket.value.on("queue", (res) => {
  Object.assign(data, res);
  if (data.currentPlaying) {
    discordSdk.value.commands.setActivity({
      activity: {
        type: 2,
        details: data.currentPlaying.title,
        state: data.currentPlaying.channel,
        assets: {
          large_image: data.currentPlaying.thumbnail,
        },
        timestamps: {
          start: data.startTime,
          end: data.endTime,
        },
      },
    });
  }
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
  console.log(auth.value);
  return fetchApi("/verify", "POST", {
    data: {
      guildId: props.guildId,
    },
    headers: {
      Authorization: `Bearer ${auth.value?.access_token}`,
    },
  }).then((res) => {
    queueId.value = res.data.data.queueId;
    queueSocket.value.emit("enter", {
      guildId: props.guildId,
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
    guildId: props.guildId,
  });
  discordSdk.value.subscribe("ACTIVITY_LAYOUT_MODE_UPDATE", (event) => {
    layoutMode.value = event.layout_mode;
  });
});

onUnmounted(() => {
  lobbySocket.value.emit("leave", {
    guildId: props.guildId,
  });
});
</script>
