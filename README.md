# Quackity For QDucks

Custom QDucks Discord bot. `/updserver` previews or applies the complete public QDucks community and private company HQ without duplicating or deleting manual content.

## Phone setup

1. In Discord Developer Portal, create an application named **Quackity For QDucks**, open **Bot**, and create/reset its token.
2. Under OAuth2 URL Generator select `bot` and `applications.commands`, then temporarily select `Administrator`. Open the generated link and add it to QDucks HQ.
   In the Bot page, enable **Server Members Intent** and **Message Content Intent** for welcome messages and message logs.
3. In your host's Secrets/environment settings add `DISCORD_TOKEN`. Optionally add `DISCORD_GUILD_ID` for instant command registration and `OWNER_USER_ID`.
4. Install dependencies with `npm install`, then start with `npm start`.
5. In Discord run `/updserver` first. This is a dry run.
6. If the preview is correct, run `/updserver confirm:true`.

Keep the token secret. Never paste it into chat, code, screenshots, or GitHub. Quackity never deletes server resources automatically.
