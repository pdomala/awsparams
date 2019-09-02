var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
const validTypes = ['String', 'SecureString', 'StringList'];

exports.handler = async (args, AWS) => {
    try {
        spinner.start(`Updating parameter '${args.name}'`);
        
        if (args.type && !_.includes(validTypes, args.type)) {
            throw new Error(`You provided an invalid parameter type. It should be one of these - ${validTypes}`);
        }

        const ssm = new AWS.SSM();

        const getParamRes = await ssm.getParameter({Name: args.name}).promise();

        const updateParams = {
            Name: args.name,
            Type: args.type ? args.type : getParamRes.Parameter.Type,
            Value: args.value,
            Description: args.description ? args.description : getParamRes.Parameter.Type,
            Overwrite: true
        };

        await ssm.putParameter(updateParams).promise();
        spinner.succeed(`Parameter '${args.name}' updated successfully`);
    } catch (error) {
        spinner.fail(error.message ? error.message : `Parameter '${args.name}' does not exist`);
    }
};
