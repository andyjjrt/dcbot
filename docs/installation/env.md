---
outline: deep
---

# Environment Variables

Add following variables in your `.env`

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

## Require variables

- `TOKEN`: Discord Token, can be obtained in [developer portal](https://discord.com/developers/).
- `CLIENT_ID`: Discord Client ID, can be obtained in [developer portal](https://discord.com/developers/).
- `MUSIC_DIR`: Directory to store downloaded music, use absolute path.
- `DB_DIR`: Directory to store user data and config, use absolute path.
- `PORT`: Web sever port.
- `WEBSITE_URL`: Web server url, show in queue message.

## Optional varialbes
- Some of the deatures can't use without them, but the bot will still work
  - `HOWHOW_DIR`: Directory to store how-how source.
    > Please ensure `HOWHOW_DIR` has a `result` sub-folder. Please download all mp3 files in [here](https://github.com/EarlySpringCommitee/HowHow-parser/tree/master/result/mp3)
  - `OLLAMA_MODEL`: Default ollama model to use.
  - `OLLAMA_MODEL`: If your ollama is on other mechine, you can define it here.
- Optional variables:
  - `ELK_INDEX`
  - `ELK_HOST`
  - `ELK_APIKEY`
  - `ELK_CERT`