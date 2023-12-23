import Interval from './Interval.js';
import database from '../bot/Database.js';
import bot from '../bot/Bot.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import {RESTJSONErrorCodes} from 'discord.js';
import ErrorEmbed from '../embeds/ErrorEmbed.js';
import logger from '../bot/Logger.js';

export default class UnmuteInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        for (const result of await database.queryAll('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const guild = await GuildWrapper.fetch(result.guildid);

            if (!guild) {
                const wrapper = new GuildWrapper({id: result.guildid});
                await wrapper.deleteData();
            }

            const user = await bot.client.users.fetch(result.userid);
            const member = new MemberWrapper(user, guild);
            try {
                await member.unmute('Temporary mute completed!', bot.client.user);
            }
            catch (e) {
                if (e.code === RESTJSONErrorCodes.MissingPermissions) {
                    await database.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'mute\'',
                        guild.guild.id, user.id);
                    await guild.log(new ErrorEmbed('Missing permissions to unmute user!')
                        .setAuthor({name: await member.displayAvatarURL(), iconURL: await member.displayAvatarURL()})
                        .setFooter({text: user.id})
                        .toMessage(false));
                }
                else {
                    await logger.error(`Failed to unmute user ${user.id} in guild ${guild.guild.id}`, e);
                }
            }
        }
    }
}