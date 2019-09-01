var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
var moment = require('moment');
const validTypes = ['String', 'SecureString', 'StringList'];
const maxresults = 50;
const paramsTable = require('./table').paramsTable(['Name', 'Type', 'Modified', 'Modified By']);

exports.handler = async (args, AWS) => {
    try {
        if (args._[1]) {
            // Throw if Type is invalid
            if (!_.includes(validTypes, args._[1])) throw new Error('Invalid SSM Parameter Type');
            await _listParams(
                {
                    Filters: [
                        {
                            Key: 'Type',
                            Values: [args._[1]]
                        }
                    ],
                    MaxResults: maxresults
                },
                AWS
            );
        } else {
            await _listParams({ MaxResults: maxresults }, AWS);
        }
    } catch (error) {
        spinner.fail(error);
    }
};

_listParams = async (describeParams, AWS) => {
    const ssm = new AWS.SSM();
    let nextToken = '';
    let ssmParamList = [];
    console.log('');
    spinner.start(`Listing SSM Parameters`);

    try {
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

        // Print Table
        if (ssmParamList.length === 0) {
            spinner.fail('No SSM Parameters Available');
        } else {
            ssmParamList.forEach(ssmParam => {
                paramsTable.push([ssmParam.Name, ssmParam.Type, moment(ssmParam.LastModifiedDate).fromNow(), _.last(ssmParam.LastModifiedUser.split('/'))]);
            });
            spinner.succeed(`Found ${ssmParamList.length} SSM Parameters`);
            console.log(paramsTable.toString());
        }
    } catch (error) {
        spinner.fail(error.message);
    }
};
