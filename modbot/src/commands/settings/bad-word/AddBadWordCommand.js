import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import Confirmation from '../../../database/Confirmation.js';
import {parseTime, timeAfter} from '../../../util/timeutils.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';
import AddAutoResponseCommand from '../auto-response/AddAutoResponseCommand.js';
import BadWord from '../../../database/BadWord.js';
import {SELECT_MENU_OPTIONS_LIMIT} from '../../../util/apiLimits.js';

export default class AddBadWordCommand extends AddAutoResponseCommand {

    buildOptions(builder) {
        super.buildOptions(builder);
        builder.addStringOption(option => option
            .setName('punishment')
            .setDescription('Punishment Type')
            .setChoices(
                {
                    name: 'None [default]',
                    value: 'none'
                }, {
                    name: 'Ban user',
                    value: 'ban'
                }, {
                    name: 'Kick user',
                    value: 'kick'
                }, {
                    name: 'Mute user',
                    value: 'mute'
                }, {
                    name: 'Softban user',
                    value: 'softban'
                }, {
                    name: 'Strike user',
                    value: 'strike'
                }, {
                    name: 'Send direct message',
                    value: 'DM'
                }
            )
        );
        return builder;
    }

    async execute(interaction) {
        const global = interaction.options.getBoolean('global') ?? false,
            type = interaction.options.getString('type') ?? 'include',
            punishment = interaction.options.getString('punishment') ?? 'none';

        const confirmation = new Confirmation({global, punishment, type}, timeAfter('1 hour'));
        const modal = new ModalBuilder()
            .setTitle(`Create new Bad-word of type ${type}`)
            .setCustomId(`bad-word:add:${await confirmation.save()}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('trigger')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(BadWord.getTriggerPlaceholder(type))
                            .setLabel('Trigger')
                            .setMinLength(1)
                            .setMaxLength(4000),
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('response')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Hi there :wave:')
                            .setLabel('Response')
                            .setMinLength(1)
                            .setMaxLength(4000)
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('priority')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('0')
                            .setLabel('Priority')
                            .setMinLength(1)
                            .setMaxLength(10)
                    )
            );

        if (['ban', 'mute'].includes(punishment)) {
            modal.addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('duration')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Punishment duration')
                            .setLabel('duration')
                            .setMinLength(2)
                            .setMaxLength(4000)
                    )
            );
        }

        await interaction.showModal(modal);
    }

    async executeModal(interaction) {
        const confirmationId = interaction.customId.split(':')[2];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.reply(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        let trigger, response = null, duration = null, priority = 0;
        for (let component of interaction.components) {
            component = component.components[0];
            if (component.customId === 'trigger') {
                trigger = component.value;
            }
            else if (component.customId === 'response') {
                response = component.value?.substring?.(0, 4000);
            }
            else if (component.customId === 'duration') {
                duration = parseTime(component.value) || null;
            }
            else if (component.customId === 'priority') {
                priority = parseInt(component.value) || 0;
            }
        }

        if (confirmation.data.global) {
            await confirmation.delete();
            await this.create(
                interaction,
                confirmation.data.global,
                [],
                confirmation.data.type,
                trigger,
                response,
                confirmation.data.punishment,
                duration,
                priority,
            );
        }
        else {
            confirmation.data.trigger = trigger;
            confirmation.data.response = response;
            confirmation.data.duration = duration;
            confirmation.data.priority = priority;
            confirmation.expires = timeAfter('30 min');

            await interaction.reply({
                ephemeral: true,
                content: 'Select channels for the bad-word',
                components: [
                    /** @type {ActionRowBuilder} */
                    new ActionRowBuilder().addComponents(/** @type {*} */new ChannelSelectMenuBuilder()
                        .addChannelTypes(/** @type {*} */[
                            ChannelType.GuildText,
                            ChannelType.GuildForum,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildStageVoice,
                        ])
                        .setMinValues(1)
                        .setMaxValues(SELECT_MENU_OPTIONS_LIMIT)
                        .setCustomId(`bad-word:add:${await confirmation.save()}`)
                    ),
                ]
            });
        }
    }

    async executeSelectMenu(interaction) {
        const confirmationId = interaction.customId.split(':')[2];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.update(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        await this.create(
            interaction,
            confirmation.data.global,
            interaction.values,
            confirmation.data.type,
            confirmation.data.trigger,
            confirmation.data.response,
            confirmation.data.punishment,
            confirmation.data.duration,
            confirmation.data.priority,
        );
    }

    /**
     * create the bad word
     * @param {import('discord.js').Interaction} interaction
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]} channels
     * @param {string} type
     * @param {string} trigger
     * @param {string} response
     * @param {string} punishment
     * @param {?number} duration
     * @param {number} priority
     * @return {Promise<*>}
     */
    async create(interaction, global, channels, type, trigger, response, punishment, duration, priority) {
        const result = await BadWord.new(interaction.guild.id, global, channels, type,
            trigger, response, punishment, duration, priority);
        if (!result.success) {
            return interaction.reply(ErrorEmbed.message(result.message));
        }

        await interaction.reply(result.badWord
            .embed('Added new bad-word', colors.RED)
            .toMessage()
        );
    }

    getDescription() {
        return 'Add a new bad-word';
    }

    getName() {
        return 'add';
    }
}