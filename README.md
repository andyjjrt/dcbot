# dcbot

A simple dc song bot

## Requirement

- Nodejs >= 18
- Python, latest is recommanded
- Node package manager, `pnpm` is recommanded
- ffmpeg
- ffprobe
- py-dlp

## `.env` format

```
# Discord setting
TOKEN=<TOKEN>
CLIENT_ID=<CLIENT_ID>

# YT API
YT_API_KEY=<YT_API_KEY>

# Data setting
MUSIC_DIR=<MUSIC_DIR>
DB_DIR=<DB_DIR>
HOWHOW_DIR=<HOWHOW_DIR>

# ELK Seetting
# ELK_INDEX=
# ELK_HOST=
# ELK_APIKEY=
# ELK_CERT=

# OLLAMA Setting
OLLAMA_MODEL=llama3.1
# OLLAMA_URL=http://127.0.0.1:8080

# Server setting
PORT=3010
WEBSITE_URL=<WEBSITE_URL>
```

## Installation

```sh
pnpm install
```

## Build

```sh
pnpm run build
```

## Serve

```sh
pnpm start
```

or use `pm2 start dist/index.js`

## Development

```sh
pnpm run dev
```