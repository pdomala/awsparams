#!/usr/bin/env node
const yargs = require('yargs');
const log = require('./_helpers/logger').logger;
const AWS = require('aws-sdk');

// Command line arguments
const args = yargs
    .version('0.0.1')
    .usage('Usage: aws-params-cli <command> [options]')
    .demandCommand(1, 'You need at least one command before moving on')
    .command(['list'], 'List all SSM Paramaters', {})
    .example('$0 list <String | SecureString | StringList>')
    .command(['search'], 'Search SSM Parameters', {})
    .example('$0 search <search-string>')
    .command(['get'], 'Get values of  SSM Parameters', {})
    .example('$0 get <search-string>')
    .example('$0 get value <search-string>')
    .option('p', { alias: 'profile', describe: 'AWS profile name' })
    .option('r', { alias: 'region', describe: 'AWS region' })
    .help('h')
    .alias('h', 'help').argv;

try {
    // Checking AWS Credentials
    const getCreds = require('./_helpers/getcreds');
    creds = getCreds.handler(args);

    if (creds) {
        AWS.config.accessKeyId = creds.aws_access_key_id;
        AWS.config.secretAccessKey = creds.aws_secret_access_key;
        if (creds.aws_session_token) {
            AWS.config.sessionToken = creds.aws_session_token;
        }
        AWS.config.region = creds.region;

        //  Switch case for commands which executes respective module
        const command = args._[0];
        switch (command) {
            case 'list':
                const list = require('./_helpers/list');
                list.handler(args, AWS);
                break;
            case 'search':
                const search = require('./_helpers/search');
                search.handler(args, AWS);
                break;
            case 'get':
                const get = require('./_helpers/get');
                get.handler(args, AWS);
                break;
            default:
                log.error(`Command - ${command} not defined.`);
                yargs.showHelp();
        }
    }
} catch (error) {
    log.error(error.message);
}
