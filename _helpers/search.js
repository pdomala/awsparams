var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
var moment = require('moment');
const maxresults = 50;
const paramsTable = require('./table').paramsTable(['Name', 'Type', 'Modified', 'Modified By']);

exports.handler = async (args, AWS) => {
    try {
        console.log('');
        spinner.start(`Searching for '${args.searchString}'`);
        await _searchParams({ MaxResults: maxresults }, args.searchString, AWS);
    } catch (error) {
        spinner.fail(error.message ? error.message : error);
    }
};

_searchParams = async (describeParams, searchString, AWS) => {
    const ssm = new AWS.SSM();
    let nextToken = '';
    let ssmParamList = [];

    do {
        if (nextToken === '') {
            const describeRes = await ssm.describeParameters(describeParams).promise();
            nextToken = describeRes.NextToken;
            ssmParamList = _.concat(ssmParamList, describeRes.Parameters);
        } else {
            describeParams.NextToken = nextToken;
            const describeRes = await ssm.describeParameters(describeParams).promise();
            nextToken = describeRes.NextToken;
            ssmParamList = _.concat(ssmParamList, describeRes.Parameters);
        }
    } while (nextToken);

    ssmParamList = ssmParamList.filter(ssmParam => {
        if (_.includes(ssmParam.Name, searchString) || _.includes(_.last(ssmParam.LastModifiedUser.split('/')), searchString)) {
            return true;
        }
        return false;
    });

    // Print Table
    if (ssmParamList.length === 0) {
        spinner.fail(`No parameters found matching "${searchString}"`);
    } else {
        ssmParamList.forEach(ssmParam => {
            paramsTable.push([ssmParam.Name, ssmParam.Type, moment(ssmParam.LastModifiedDate).fromNow(), _.last(ssmParam.LastModifiedUser.split('/'))]);
        });
        console.log('');
        console.log(paramsTable.toString());
        spinner.succeed(`Found ${ssmParamList.length} parameters matching "${searchString}"`);
    }
};
