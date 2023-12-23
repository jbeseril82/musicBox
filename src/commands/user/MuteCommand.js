import {
    ActionRowBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import {formatTime, parseTime} from '../../util/timeutils.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT, TIMEOUT_DURATION_LIMIT} from '../../util/apiLimits.js';
import UserCommand from './UserCommand.js';
import Confirmation from '../../database/Confirmation.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import UserActionEmbed from '../../embeds/UserActionEmbed.js';
import config from '../../bot/Config.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';

export default class MuteCommand extends UserCommand {


    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to mute')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Mute reason')
                .setRequired(false)
                .setAutocomplete(true)
        );
        builder.addStringOption(option =>
            option.setName('duration')
                .setDescription('Mute duration')
                .setRequired(false)
                .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.mute(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            parseTime(interaction.options.getString('duration')),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?number} duration
     * @return {Promise<void>}
     */
    async mute(interaction, member, reason, duration) {
        await deferReplyOnce(interaction);
        reason = reason || 'No reason provided';

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, duration})) {
            return;
        }

        if (!duration || duration > TIMEOUT_DURATION_LIMIT) {
            const role = await member.getMutedRole();
            if (!role) {
                await replyOrEdit(interaction, ErrorEmbed
                    .message(`Timeouts longer than ${formatTime(TIMEOUT_DURATION_LIMIT)} require a valid muted role! Use /muted-role to configure it.`));
                return;
            }


            const me = await interaction.guild.members.fetchMe();
            if (me.roles.highest.comparePositionTo(role) <= 0) {
                await replyOrEdit(interaction, ErrorEmbed.message('I can\'t manage the muted role. Please move my highest role above it.'));
                return;
            }
        }

        await member.mute(reason, interaction.user, duration);
        await replyOrEdit(interaction,
            new UserActionEmbed(member.user, reason, 'muted', colors.ORANGE, config.data.emoji.mute, duration)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<{reason: ?string, duration: ?number, user: import('discord.js').Snowflake}>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.mute(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.duration,
            );
            return;
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * prompt user for mute reason and duration
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Mute ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`mute:${member.user.id}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Duration')
                        .setCustomId('duration')
                        .setStyle(TextInputStyle.Short)),
            ));
    }

    async executeModal(interaction) {
        let reason, duration;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'duration') {
                    duration = parseTime(component.value);
                }
            }
        }

        await this.mute(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
            duration
        );
    }

    getDescription() {
        return 'Mute a user';
    }

    getName() {
        return 'mute';
    }
}