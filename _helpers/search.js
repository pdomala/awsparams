var log = require('./logger').logger;
var spinner = require('./spin').spinner;
var _ = require('lodash');
var moment = require('moment');
const maxresults = 50;
const paramsTable = require('./table').paramsTable(['Name', 'Type', 'Modified', 'Modified By']);

exports.handler = async (args, AWS) => {
  try {
    if (args._[1]) {
      console.log('');
      spinner.start(`Searching for "${args._[1]}"`);
      await _searchParams({ MaxResults: maxresults }, args._[1], AWS);
    } else {
      throw 'Search string not found.';
    }
  } catch (error) {
    log.error(error);
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
    spinner.succeed(`Found ${ssmParamList.length} parameters matching "${searchString}"`);
    ssmParamList.forEach(ssmParam => {
      paramsTable.push([ssmParam.Name, ssmParam.Type, moment(ssmParam.LastModifiedDate).fromNow(), _.last(ssmParam.LastModifiedUser.split('/'))]);
    });
    console.log('');
    console.log(paramsTable.toString());
  }
};
