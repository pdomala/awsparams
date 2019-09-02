const ora = require('ora');
const fs = require('fs');
const ini = require('ini');
var log = require('./logger').logger;
var spinner = require('./spin').spinner;

// const spinner = new ora({
//     spinner: 'simpleDotsScrolling'
// });

const defaultCredsFile = `${require('os').homedir()}/.aws/credentials`;
const defaultConfigFile = `${require('os').homedir()}/.aws/config`;
const defaultRegion = 'ap-southeast-2';

exports.handler = args => {
    try {
        console.log('');
        spinner.start('Checking for AWS credentials');

        var creds = {};

        credsFile = process.env.AWS_SHARED_CREDENTIALS_FILE ? fs.readdirSync(process.env.AWS_SHARED_CREDENTIALS_FILE, 'utf-8') : fs.readFileSync(defaultCredsFile, 'utf-8');
        profiles = ini.parse(credsFile);
        configFile = process.env.AWS_CONFIG_FILE ? fs.readdirSync(process.env.AWS_CONFIG_FILE, 'utf-8') : fs.readFileSync(defaultConfigFile, 'utf-8');
        configs = ini.parse(configFile);

        if (args.p) {
            if (!profiles[args.p]) {
                throw new Error(`AWS profile ${args.p} not found`);
            }
            
            creds = profiles[args.p];

            if (args.r) {
                creds.region = args.r
            } else if (configs[`profile ${args.p}`]) {
                if (configs[`profile ${args.p}`].region) {
                    creds.region = configs[`profile ${args.p}`].region;
                } else {
                    creds.region = process.env.AWS_DEFAULT_REGION ? process.env.AWS_DEFAULT_REGION : defaultRegion;
                }
            } else {
                creds.region = process.env.AWS_DEFAULT_REGION ? process.env.AWS_DEFAULT_REGION : defaultRegion;
            }

            spinner.succeed(`Using credentials from profile '${args.p}' and region '${creds.region}'`);
            return creds;
        } else if (process.env.AWS_PROFILE) {
            if (!profiles[process.env.AWS_PROFILE]) {
                throw new Error(`AWS profile ${process.env.AWS_PROFILE} not found`);
            }

            creds = profiles[process.env.AWS_PROFILE];
            
            if (args.r) {
                creds.region = args.r
            } else if (configs[`profile ${process.env.AWS_PROFILE}`]) {
                if (configs[`profile ${process.env.AWS_PROFILE}`].region) {
                    creds.region = configs[`profile ${process.env.AWS_PROFILE}`].region;
                } else {
                    creds.region = process.env.AWS_DEFAULT_REGION ? process.env.AWS_DEFAULT_REGION : defaultRegion;
                }
            } else {
                creds.region = process.env.AWS_DEFAULT_REGION ? process.env.AWS_DEFAULT_REGION : defaultRegion;
            }

            spinner.succeed(`Using credentials from profile '${process.env.AWS_PROFILE}' and region '${creds.region}'`);
            return creds;
        } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            const creds = {
                aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
                aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY
            };
            if (process.env.AWS_SESSION_TOKEN) {
                creds.aws_session_token = process.env.AWS_SESSION_TOKEN;
            }
            if (args.r) {
                creds.region = args.r
            } else {
                creds.region = process.env.AWS_DEFAULT_REGION ? process.env.AWS_DEFAULT_REGION : defaultRegion;
            }
            spinner.succeed(`Using AWS access keys from environment variables and region '${creds.region}'`);
            return creds;
        } else {
            throw new Error('AWS Credentials not found. Please use --profile option, AWS_PROFILE env variable, AWS Access Keys');
        }
    } catch (error) {
        spinner.fail(error.message);
    }
};
