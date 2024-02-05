import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchApi } from "../utils/api";

export const useUserStore = defineStore("user", () => {
  const user = ref({});
  const guilds = ref([]);
  
  const init = async() => {
    return fetchApi("/user", "GET")
    .then((res) => {
      user.value = res.data.user
      guilds.value = res.data.guilds
    })
  }

  return { user, guilds, init };
});

export default useUserStore;
