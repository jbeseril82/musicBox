# ModBot
[![Discord](https://img.shields.io/discord/826482655893127248?style=plastic)](https://discord.gg/zYYhgPtmxw)
[![GitHub](https://img.shields.io/github/license/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/blob/master/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/commits/)

---
ModBot is a moderation bot that is mainly used in the [Aternos Discord](https://chat.aternos.org).

### Features
- Moderation commands (ban, kick, mute, softban, strike)
- Import strikes, tempmutes and tempbans from Vortex 
- Auto moderation (Discord invites, linkcooldown)
- Find articles from your Zendesk helpcenter and videos from a Youtube playlist
- Lock (all or specific) channels
- Log message edits and deletions
- Autoresponses
- Bad word filters

### Add ModBot to your server
By adding the bot to your server you agree to our [privacy policy](https://aternos.gmbh/en/modbot/privacy). <br>
Invite: [click me](https://discordapp.com/oauth2/authorize?client_id=790967448111153153&scope=bot&permissions=268446806)

If you need help with the commands use `!help` to list them and `!help <command>` to get more information about a single command.

We also have a [Discord Server](https://discord.gg/zYYhgPtmxw). <br>
**Please note: ModBot is a side project for us. We don't earn any money with it and primarily develop it for use on our own servers. We can't help with every problem and won't add features that we don't need.**

### Getting Started
- You can view the settings with `!settings`
- To set up a log channel use `!logchannel <#channel>`
- To add moderator roles use `!modrole add <@role>`
- You can import strikes, mutes and bans from Vortex using `!import`
- If you want to configure a Youtube playlist, you can use `!playlist <url>`
- You can also add a Zendesk help center, using `!helpcenter <url>` to enable the `!article` command.

### Support
You can view the usage of commands with the help command.<br>
If you think you found a bug in ModBot then please create an [issue](https://github.com/aternosorg/modbot/issues). <br>
For security vulnerabilities send a mail to [security@aternos.org](mailto://security@aternos.org).

### Self Hosting
Requirements: [Node.js](https://nodejs.org/en/download/) (v16.6.0+), a [MySQL](https://dev.mysql.com/downloads/mysql/) database
1. Download the code and run `npm install`
2. Create a [Discord application](https://discordapp.com/developers/applications/).
   You also have to enable the SERVER MEMBERS intent.
   The bot needs this to reassign the muted role when a muted user joins your server
3. Add a bot to the application and copy the auth token
4. Create an API key in the [Google Cloud Console](https://console.cloud.google.com/) for the Youtube Data API v3
5. Copy the example.config.json to config.json, and configure it
6. Start the index.js file
7. To invite the bot to your server replace `ID` with the client ID of your application https://discordapp.com/oauth2/authorize?client_id=ID&scope=bot&permissions=268446806 and open the link

### Contributing
If you want to contribute you need to [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repository, then add your changes to your fork and then create a [pull request](https://github.com/aternosorg/modbot/compare). 
We recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js.
