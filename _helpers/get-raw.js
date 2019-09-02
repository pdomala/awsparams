var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
const maxresults = 50;
const paramsTable = require('./table').paramsTable(['Name', 'Type', 'Value']);

exports.handler = async (args, AWS) => {
    try {
        try {
            console.log('');
            spinner.start(`Retrieving values for params matching '${args.searchString}'`);
            await _getParams({ MaxResults: maxresults }, args, AWS);
        } catch (error) {
            spinner.fail(error.message ? error.message : error);
        }
    } catch (error) {
        spinner.fail(error.message ? error.message : error);
    }
};

_getParams = async (describeParams, args, AWS) => {
    const ssm = new AWS.SSM();
    let nextToken = '';
    let ssmParamNames = [];

    do {
        if (nextToken === '') {
            const describeRes = await ssm.describeParameters(describeParams).promise();
            nextToken = describeRes.NextToken;
            ssmParamNames = _.concat(ssmParamNames, describeRes.Parameters.map(x => x.Name));
        } else {
            describeParams.NextToken = nextToken;
            const describeRes = await ssm.describeParameters(describeParams).promise();
            nextToken = describeRes.NextToken;
            ssmParamNames = _.concat(ssmParamNames, describeRes.Parameters.map(x => x.Name));
        }
    } while (nextToken);

    ssmParamNames = ssmParamNames.filter(x => _.includes(x, args.searchString));

    // Print Raw
    if (ssmParamNames.length === 0) {
        spinner.fail(`No parameters found matching "${args.searchString}"`);
    } else if (ssmParamNames.length > 10) {
        spinner.fail(`More than 10 parameters were found matching "${args.searchString}". Please narrow down your search`);
    } else {
        const getParams = {
            Names: ssmParamNames,
            WithDecryption: true
        };
        const getRes = await ssm.getParameters(getParams).promise();
        
        getRes.Parameters.forEach(x => {
            console.log('');
            console.log(x.Name);
            console.log(x.Value);
            console.log('');
        });
        spinner.succeed(`Found ${getRes.Parameters.length} parameters matching "${args.searchString}"`);
    }
};
