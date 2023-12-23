const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member');
const util = require('../../util');

class UnbanCommand extends ModerationCommand {

    static description = 'Unban a user';

    static names = ['unban'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'unban',
        done: 'unbanned',
    };

    async executePunishment(target) {
        const member = new Member(target, this.source.getGuild());

        if (!await member.isBanned(this.database)) {
            await this.sendError(`**${util.escapeFormatting(target.tag)}** isn't banned here!`);
            return false;
        }

        await member.unban(this.database, this.reason, this.source.getUser());
        return true;
    }
}

module.exports = UnbanCommand;
