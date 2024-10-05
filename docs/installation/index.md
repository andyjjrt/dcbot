---
outline: deep
---

# Installation

## Requirement

- `Nodejs` >= 18
- `Python`, latest is recommanded
- Node package manager, `pnpm` is recommanded
- `ffmpeg`
- `ffprobe`
- `py-dlp`

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

for `.env` format, refer to [Environment Variables](/installation/env)
