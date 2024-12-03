import type { Opts } from "minimist";
import minimist from "minimist";
import type { CommandSchema } from "minimist-subcommand";
import { parseCommands } from "minimist-subcommand";
import path from "path";

import type { CommandResult } from "./index";
import {
  cliUtils,
  executeArticleNew,
  executeCompile,
  executeHelp,
  executeInit,
  executeNow,
  executeVersion,
} from "./index";

export const printErrorMessage = (message: string): void => {
  const ansiEscapeColorRed = "\x1b[31m";
  const ansiEscapeColorReset = "\x1b[0m";
  process.stderr.write(
    `${ansiEscapeColorRed}${message}${ansiEscapeColorReset}\n`,
  );
};

export const appendConfigFileParser = (minimistOptions: Opts): Opts => {
  return {
    boolean: minimistOptions.boolean || [],
    string:
      typeof minimistOptions.string === "string"
        ? [minimistOptions.string, "config-file"]
        : [...(minimistOptions.string || []), "config-file"],
    default: {
      ...(minimistOptions.default || {}),
      "config-file": "",
    },
    alias: {
      ...(minimistOptions.alias || {}),
      c: "config-file",
    },
  };
};

type Command = (params: {
  cwd: string;
  defaultConfigFilePath: string;
  subCommandArgv: string[];
}) => Promise<CommandResult>;

const commandList: Record<string, Command> = {
  "article::new": ({ subCommandArgv, cwd, defaultConfigFilePath }) => {
    const options = minimist(subCommandArgv, appendConfigFileParser({}));
    const configFilePath = options["config-file"]
      ? cliUtils.toNormalizedAbsolutePath(options["config-file"], cwd)
      : defaultConfigFilePath;
    return executeArticleNew(configFilePath);
  },
  compile: ({ subCommandArgv, cwd, defaultConfigFilePath }) => {
    const options = minimist(subCommandArgv, appendConfigFileParser({}));
    const configFilePath = options["config-file"]
      ? cliUtils.toNormalizedAbsolutePath(options["config-file"], cwd)
      : defaultConfigFilePath;
    return executeCompile(configFilePath);
  },
  help: () => {
    return executeHelp();
  },
  init: ({ subCommandArgv, cwd }) => {
    const options = minimist(subCommandArgv);
    const [destinationDirPathInput] = options._;
    if (!destinationDirPathInput) {
      return Promise.resolve({
        exitCode: 1,
        message: "Destination directory path is required.",
      });
    }
    const destinationDirPath = cliUtils.toNormalizedAbsolutePath(
      destinationDirPathInput,
      cwd,
    );
    return executeInit(destinationDirPath);
  },
  now: ({ subCommandArgv, cwd, defaultConfigFilePath }) => {
    const options = minimist(subCommandArgv);
    const configFilePath = options["config-file"]
      ? cliUtils.toNormalizedAbsolutePath(options["config-file"], cwd)
      : defaultConfigFilePath;
    return executeNow(configFilePath);
  },
  unknown: () => {
    return Promise.resolve({
      exitCode: 1,
      message: "Unknown subcommand.",
    });
  },
  version: () => {
    return executeVersion();
  },
};

const determineCommand = (
  argv: string[],
): { command: Command; subCommandArgv: string[] } => {
  const schema: CommandSchema = {
    commands: {
      article: {
        commands: {
          new: null,
        },
      },
      compile: null,
      help: null,
      init: null,
      now: null,
      version: null,
    },
  };
  const parsedSubCommands = parseCommands(schema, argv.slice(2));
  const commandId = parsedSubCommands.commands.join("::");
  return {
    command: commandList[commandId] || commandList.unknown,
    subCommandArgv: parsedSubCommands.argv,
  };
};

export const runCli = async () => {
  const { command, subCommandArgv } = determineCommand(process.argv);
  const cwd = process.cwd();
  const result = await command({
    cwd,
    defaultConfigFilePath: path.join(cwd, cliUtils.CONFIG_FILE_NAME),
    subCommandArgv,
  });
  if (result.message) {
    if (result.exitCode === 0) {
      process.stderr.write(`${result.message}\n`);
    } else {
      printErrorMessage(result.message);
    }
  }
  process.exit(result.exitCode);
};
