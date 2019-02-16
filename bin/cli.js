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

const cwd = process.cwd();

const parsedSubCommands = parseCommands(
  {
    commands: {
      article: {
        commands: {
          new: null,
        },
      },
      compile: null,
      init: null,
    },
  },
  process.argv.slice(2)
);
const [subCommand, subSubCommand] = parsedSubCommands.commands;

const defaultConfigFilePath = path.join(cwd, ubw.cliUtils.CONFIG_FILE_NAME);

let promise;

// TODO: Validate args and options
if (subCommand === 'article') {
  if (subSubCommand === 'new') {
    const options = minimist(parsedSubCommands.argv, appendConfigFileParser({}));
    const configFilePath = options['config-file']
      ? ubw.cliUtils.toNormalizedAbsolutePath(options['config-file'], cwd)
      : defaultConfigFilePath;
    promise = ubw.executeArticleNew(configFilePath);
  }
} else if (subCommand === 'init') {
  const options = minimist(parsedSubCommands.argv);
  const [
    destinationDirPathInput,
  ] = options._;
  const destinationDirPath = ubw.cliUtils.toNormalizedAbsolutePath(destinationDirPathInput, cwd);
  promise = ubw.executeInit(destinationDirPath);
} else if (subCommand === 'compile') {
  const options = minimist(parsedSubCommands.argv, appendConfigFileParser({}));
  const configFilePath = options['config-file']
    ? ubw.cliUtils.toNormalizedAbsolutePath(options['config-file'], cwd)
    : defaultConfigFilePath;
  promise = ubw.executeCompile(configFilePath);
}

if (!promise) {
  promise = Promise.resolve({
    exitCode: 1,
    message: 'Unknown subcommand.',
  });
}

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
