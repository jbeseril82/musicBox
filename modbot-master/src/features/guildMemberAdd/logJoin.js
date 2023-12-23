const Log = require('../../Log');
const {MessageEmbed, GuildMember} = require('discord.js');
const util = require('../../util');

/**
 * @param options
 * @param {GuildMember} member
 * @return {Promise<void>}
 */
exports.event = async (options, member) => {
    let description = `**ID:** ${member.id}\n` +
        `**Created Account:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n`;
    await Log.joinLog(member.guild.id, '', new MessageEmbed()
        .setTitle(`${member.user.tag} joined this server`)
        .setColor(util.color.green)
        .setThumbnail(member.user.avatarURL())
        .setDescription(description)
        .setTimestamp()
        .setFooter(`Now at ${member.guild.memberCount} members`)
    );
};
