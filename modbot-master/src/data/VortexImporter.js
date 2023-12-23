const {Client, Snowflake, MessageEmbed} = require('discord.js');
const Moderation = require('../Moderation');
const TypeChecker = require('../config/TypeChecker');
const Importer = require('./Importer');

class VortexImporter extends Importer {
    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempmutes;

    /**
     * key: userid
     * value: strike count
     * @type {Object}
     */
    strikes;

    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempbans;

    /**
     * @param {Client} bot
     * @param {Snowflake} guildID
     * @param {Object} data JSON exported data from vortex
     * @param {Object} data.tempmutes
     * @param {Object} data.strikes
     * @param {Object} data.tempbans
     */
    constructor(bot, guildID, data) {
        super();
        this.bot = bot;
        this.guildID = guildID;
        this.tempmutes = data.tempmutes;
        this.strikes = data.strikes;
        this.tempbans = data.tempbans;
    }

    /**
     * @param {Object} object
     * @return {{id: Snowflake, value: Number}[]}
     */
    keyValueArray(object) {
        const result = [];
        const ids = Object.keys(object);
        for (const id of ids) {
            result.push({id, value: object[id]});
        }
        return result;
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     */
    checkAllTypes() {
        Object.keys(this.tempbans).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.tempbans).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
        Object.keys(this.tempmutes).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.tempmutes).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
        Object.keys(this.strikes).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.strikes).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
    }

    async import() {
        return Promise.all([
            this._importTempmutes(),
            this._importStrikes(),
            this._importTempbans()
        ]);
    }
    
    async _importTempmutes() {
        const mutes = this.keyValueArray(this.tempmutes).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(mutes.map(m => this._timedModeration(m, 'mute')));
    }

    async _importStrikes() {
        const strikes = this.keyValueArray(this.strikes).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(strikes.map(m => this._strike(m)));
    }

    async _importTempbans() {
        const bans = this.keyValueArray(this.tempbans).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(bans.map(m => this._timedModeration(m, 'ban')));
    }

    /**
     * @param moderation
     * @param {String} type
     * @return {Moderation}
     */
    _timedModeration(moderation, type) {
        return new Moderation({
            guildid: this.guildID,
            userid: /** @type {Snowflake}*/ moderation.id,
            action: type,
            expireTime: /** @type {Number}*/ moderation.value,
            reason: /** @type {String} */'Imported from Vortex',
            moderator: this.bot.user.id
        });
    }

    /**
     * @param moderation
     * @return {Moderation}
     * @private
     */
    _strike(moderation) {
        return new Moderation({
            guildid: this.guildID,
            userid: /** @type {Snowflake}*/ moderation.id,
            value: moderation.value,
            action: 'strike',
            reason: /** @type {String} */'Imported from Vortex',
            moderator: this.bot.user.id
        });
    }

    generateEmbed() {
        return new MessageEmbed()
            .setTitle('Imported Data')
            .addField('Mutes', Object.keys(this.tempmutes).length.toString(), true)
            .addField('Strikes', Object.keys(this.strikes).length.toString(), true)
            .addField('Bans', Object.keys(this.tempbans).length.toString(), true);
    }
}

module.exports = VortexImporter;
