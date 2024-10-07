import { defineStore } from "pinia";
import { ref, onMounted, reactive } from "vue";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { fetchApi } from "../utils/api";

interface Auth {
  access_token: string;
  user: {
    username: string;
    discriminator: string;
    id: string;
    public_flags: number;
    avatar?: string | null | undefined;
    global_name?: string | null | undefined;
  };
  scopes: (
    | -1
    | "identify"
    | "email"
    | "connections"
    | "guilds"
    | "guilds.join"
    | "guilds.members.read"
    | "guilds.channels.read"
    | "gdm.join"
    | "bot"
    | "rpc"
    | "rpc.notifications.read"
    | "rpc.voice.read"
    | "rpc.voice.write"
    | "rpc.video.read"
    | "rpc.video.write"
    | "rpc.screenshare.read"
    | "rpc.screenshare.write"
    | "rpc.activities.write"
    | "webhook.incoming"
    | "messages.read"
    | "applications.builds.upload"
    | "applications.builds.read"
    | "applications.commands"
    | "applications.commands.permissions.update"
    | "applications.commands.update"
    | "applications.store.update"
    | "applications.entitlements"
    | "activities.read"
    | "activities.write"
    | "relationships.read"
    | "relationships.write"
    | "voice"
    | "dm_channels.read"
    | "role_connections.write"
    | "presences.read"
    | "presences.write"
    | "openid"
    | "dm_channels.messages.read"
    | "dm_channels.messages.write"
    | "gateway.connect"
    | "account.global_name.update"
    | "payment_sources.country_code"
    | "sdk.social_layer"
  )[];
  expires: string;
  application: {
    id: string;
    description: string;
    name: string;
    icon?: string | null | undefined;
    rpc_origins?: string[] | undefined;
  };
}

export const useDiscordStore = defineStore("discord", () => {
  const auth = ref<Auth | null>(null);
  const isReady = ref(false);
  const discordSdk = reactive(new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID));

  async function setupDiscordSdk() {
    await discordSdk.ready();

    const { code } = await discordSdk.commands.authorize({
      client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds", "rpc.activities.write"],
    });

    // Retrieve an access_token from your activity's server
    const response = await fetchApi("/token", "POST", {
      data: {
        code,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { access_token } = response.data;

    // Authenticate with Discord client (using the access_token)
    auth.value = await discordSdk.commands.authenticate({
      access_token,
    });

    if (auth.value == null) {
      throw new Error("Authenticate command failed");
    }
  }

  onMounted(() => {
    setupDiscordSdk().finally(() => {
      isReady.value = true;
      console.log(auth.value);
    });
  });

  return {
    auth,
    isReady,
    discordSdk,
  };
});

export default useDiscordStore;
