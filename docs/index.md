---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Rosetta"
  text: "Best discord bot"
  image:
    src: /rosetta.png
    alt: VitePress
  actions:
    - theme: brand
      text: Invite to your server
      link: https://discord.com/oauth2/authorize?client_id=1091392369296937073
    - theme: alt
      text: Host your own one
      link: /installation

features:
  - title: 🎷 Fully featured music bot
    details: Support Youtube, Youtube Music, and even Spotify!
  - title: 🎼 Beautiful queue page
    details: Track current playing song on web, and later in Embed Activities
  - title: 🦙 Ollama support
    details: Chat with latest model
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}

image {
  border-radius: 10px
}
</style>
