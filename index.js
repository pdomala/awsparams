#!/usr/bin/env node
const yargs = require('yargs');
const log = require('./_helpers/logger').logger;
const AWS = require('aws-sdk');
const { version } = require('./package.json');

// Command line arguments
const args = yargs
    .version(version)
    .usage('Usage: $0 <command> [options]')
    .demandCommand(1, 'You need at least one command before moving on')

    .command('list [type]', 'List all SSM Paramaters', {})
    .example('$0 list <String | SecureString | StringList>')

    .command('search <searchString>', 'Search SSM Parameters without values', {})
    .example('$0 search <searchString>')

    .command('get <searchString>', 'Get values of SSM Parameters matching search string', {})
    .example('$0 get <searchString>')

    .command('get-raw <searchString>', 'Get raw values of  SSM Parameters matching search string', {})
    .example('$0 get-value <searchString>')

    .command('add <name> <value> <type> [description]', 'Add SSM Parameter')
    .example('$0 add <myparameter> <myvalue> <String/SecureString/StringList> ["This is my description"]')

    .command('update <name> <value> [type] [description]', 'Update existing SSM Parameter')
    .example('$0 update <myparameter> <myvalue> [String/SecureString/StringList] ["This is my description"]')

    .command('delete <names>', 'Delete existing SSM Parameter/s. Use comma separated string to delete multiple values')
    .example('$0 delete <myparameter>')

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
            case 'get-raw':
                const getraw = require('./_helpers/get-raw');
                getraw.handler(args, AWS);
                break;
            case 'add':
                const add = require('./_helpers/add');
                add.handler(args, AWS);
                break;
            case 'update':
                const update = require('./_helpers/update');
                update.handler(args, AWS);
                break;
            case 'delete':
                const del = require('./_helpers/delete');
                del.handler(args, AWS);
                break;
            default:
                log.error(`Command - ${command} not defined.`);
                yargs.showHelp();
        }
    }
} catch (error) {
    log.error(error.message);
}
