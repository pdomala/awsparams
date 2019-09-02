var log = require('./logger').logger;
var spinner = require('./spin').spinner;

exports.handler = async (args, AWS) => {
    try {
        spinner.start(`Deleting parameter/s '${args.names}'`);

        const names = args.names.split(',');
        const deleteParams = {
            Names: names
        };
        const ssm = new AWS.SSM();

        const deleteParamsRes = await ssm.deleteParameters(deleteParams).promise();

        if (deleteParamsRes.InvalidParameters.length > 0) {
            spinner.warn(`Parameter/s '${deleteParamsRes.InvalidParameters}' are not found.`)
        }
        if (deleteParamsRes.DeletedParameters.length > 0) {
            spinner.succeed(`Parameter/s '${deleteParamsRes.DeletedParameters}' deleted successfully.`)
        }
    } catch (error) {
        spinner.fail(error.message ? error.message : error);
    }
};
