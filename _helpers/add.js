var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
const validTypes = ['String', 'SecureString', 'StringList'];

exports.handler = async (args, AWS) => {
    try {
        spinner.start(`Adding parameter '${args.name}'`);
        if (!_.includes(validTypes, args.type)) {
            throw new Error(`You provided an invalid parameter type. It should be one of these - ${validTypes}`);
        }

        const addParams = {
            Name: args.name,
            Type: args.type,
            Value: args.value,
            Description: args.description ? args.description : '',
            Overwrite: args.f ? true : false
        };
        const ssm = new AWS.SSM();

        const addParamRes = await ssm.putParameter(addParams).promise();
        spinner.succeed(`Parameter '${args.name}' ${args.f ? 'overwritten' : 'added'} successfully`);
    } catch (error) {
        if (error.message.includes('The parameter already exists')) {
            spinner.fail(`Parameter '${args.name}' already exists. Please use -f if you wish to overwrite existing parameter.`);
        } else {
            spinner.fail(error.message ? error.message : error);
        }
    }
};
