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
TOKEN=******
CLIENT_ID=******
MUSIC_DIR=******
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
