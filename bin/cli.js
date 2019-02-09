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

function exitWithErrorMessage(message) {
  const ansiEscapeColorRed = '\x1b[31m';
  const ansiEscapeColorReset = '\x1b[0m';
  process.stderr.write(`${ansiEscapeColorRed}${message}${ansiEscapeColorReset}\n`);
  process.exit(1);
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

// TODO: Validate args and options
if (subCommand === 'article') {
  if (subSubCommand === 'new') {
    const [
      configsFilePathInput,
    ] = options._;
    const configsFilePath = ubw.cliUtils.toNormalizedAbsolutePath(configsFilePathInput);
    const output = ubw.executeArticleNew(configsFilePath);
    process.stdout.write(output);
    process.exit();
  }
} else if (subCommand === 'init') {
  const [
    destinationDirPathInput,
  ] = options._;
  const destinationDirPath = ubw.cliUtils.toNormalizedAbsolutePath(destinationDirPathInput);
  const output = ubw.executeInit(destinationDirPath);
  process.stdout.write(output);
  process.exit();
} else if (subCommand === 'compile') {
  const [
    configsFilePathInput,
  ] = options._;
  const configsFilePath = ubw.cliUtils.toNormalizedAbsolutePath(configsFilePathInput);
  const output = ubw.executeCompile(configsFilePath);
  process.stdout.write(output);
  process.exit();
} else {
  exitWithErrorMessage('Unknown subcommand.');
}
