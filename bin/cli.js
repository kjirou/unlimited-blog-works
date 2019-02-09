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
const options = minimist(parsedSubCommands.argv);

let promise;

// TODO: Validate args and options
if (subCommand === 'article') {
  if (subSubCommand === 'new') {
    const [
      configsFilePathInput,
    ] = options._;
    const configsFilePath = ubw.cliUtils.toNormalizedAbsolutePath(configsFilePathInput);
    promise = ubw.executeArticleNew(configsFilePath);
  }
} else if (subCommand === 'init') {
  const [
    destinationDirPathInput,
  ] = options._;
  const destinationDirPath = ubw.cliUtils.toNormalizedAbsolutePath(destinationDirPathInput);
  promise = ubw.executeInit(destinationDirPath);
} else if (subCommand === 'compile') {
  const [
    configsFilePathInput,
  ] = options._;
  const configsFilePath = ubw.cliUtils.toNormalizedAbsolutePath(configsFilePathInput);
  promise = ubw.executeCompile(configsFilePath);
} else {
  promise = Promise.resolve({
    exitCode: 1,
    message: 'Unknown subcommand.',
  });
}

promise.then(result => {
  if (result.message) {
    if (result.exitCode === 0) {
      process.stdout.write(`${result.message}\n`);
    } else {
      printErrorMessage(result.message);
    }
  }
  process.exit(result.exitCode);
});
