import {bold} from 'discord.js';
import LineEmbed from './LineEmbed.js';

export default class KeyValueEmbed extends LineEmbed {
    /**
     * add a line
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addPair(name, value) {
        return this.addLine(bold(name) + ': ' + value);
    }

    /**
     * add a list of values
     * @param {string} name
     * @param {Iterable<string|number>} list
     * @return {KeyValueEmbed}
     */
    addList(name, list) {
        this.addLine(bold(name) + ':');
        for (const item of list) {
            this.addLine('- ' + item);
        }
        return this;
    }

    /**
     * add a list of values or a short enumeration for lists with up to 3 items
     * @param {string} name
     * @param {Array<string|number>} list
     * @return {KeyValueEmbed}
     */
    addListOrShortList(name, list) {
        if (list.length > 3) {
            return this.addList(name, list);
        }
        return this.addPair(name, list.join(', '));
    }

    /**
     * @param {*} condition
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addPairIf(condition, name, value) {
        if (condition) {
            this.addPair(name, value);
        }
        return this;
    }
}