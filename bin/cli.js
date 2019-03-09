#!/usr/bin/env node

const fs = require('fs');
const minimist = require('minimist');
const {parseCommands} = require('minimist-subcommand');
const path = require('path');

let ubw;

if (fs.existsSync(path.join(__dirname, '../dist/index.js'))) {
  ubw = require('../dist');
} else {
  require('../setup/ts-node-reigister-for-cli-debug');
  ubw = require('../src');
}

//
// Utils
//

function printErrorMessage(message) {
  const ansiEscapeColorRed = '\x1b[31m';
  const ansiEscapeColorReset = '\x1b[0m';
  process.stderr.write(`${ansiEscapeColorRed}${message}${ansiEscapeColorReset}\n`);
}

function appendConfigFileParser(minimistOptions) {
  return Object.assign({
    boolean: minimistOptions.boolean || [],
    string: (minimistOptions.string || []).concat(['config-file']),
    default: Object.assign({}, {'config-file': ''}, minimistOptions.default || {}),
    alias: Object.assign({}, {c: 'config-file'}, minimistOptions.alias || {}),
  });
}

//
// Executable wrappers that convert CLI arguments to program arguments
//

const commands = {
  'article--new': ({argv, cwd, defaultConfigFilePath}) => {
    const options = minimist(argv, appendConfigFileParser({}));
    const configFilePath = options['config-file']
      ? ubw.cliUtils.toNormalizedAbsolutePath(options['config-file'], cwd)
      : defaultConfigFilePath;
    return ubw.executeArticleNew(configFilePath);
  },
  'compile': ({argv, cwd, defaultConfigFilePath}) => {
    const options = minimist(argv, appendConfigFileParser({}));
    const configFilePath = options['config-file']
      ? ubw.cliUtils.toNormalizedAbsolutePath(options['config-file'], cwd)
      : defaultConfigFilePath;
    return ubw.executeCompile(configFilePath);
  },
  'help': () => {
    return ubw.executeHelp();
  },
  'init': ({argv, cwd}) => {
    const options = minimist(argv);
    const [
      destinationDirPathInput,
    ] = options._;
    const destinationDirPath = ubw.cliUtils.toNormalizedAbsolutePath(destinationDirPathInput, cwd);
    return ubw.executeInit(destinationDirPath);
  },
  'unknown': () => {
    return Promise.resolve({
      exitCode: 1,
      message: 'Unknown subcommand.',
    });
  },
  'version': () => {
    return ubw.executeVersion();
  },
};

//
// main
//

const parsedSubCommands = parseCommands(
  {
    commands: {
      article: {
        commands: {
          new: null,
        },
      },
      compile: null,
      help: null,
      init: null,
      version: null,
    },
  },
  process.argv.slice(2)
);
const commandId = parsedSubCommands.commands.join('--');
const command = commands[commandId] || commands.unknown;
const cwd = process.cwd();

const promise = command({
  argv: parsedSubCommands.argv,
  cwd,
  defaultConfigFilePath: path.join(cwd, ubw.cliUtils.CONFIG_FILE_NAME),
});

promise.then(result => {
  if (result.message) {
    if (result.exitCode === 0) {
      process.stderr.write(`${result.message}\n`);
    } else {
      printErrorMessage(result.message);
    }
  }
  process.exit(result.exitCode);
});
