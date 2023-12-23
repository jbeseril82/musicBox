const SubCommand = require('./SubCommand');

/**
 * @class
 * @classdesc Change the configuration
 * @abstract
 */
class SetConfigCommand extends SubCommand {
    static description = 'Reconfigure this option.';

    static names = ['set'];
}

module.exports = SetConfigCommand;