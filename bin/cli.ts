#!/usr/bin/env node
import * as codemodCli from "codemod-cli";
import * as program from "commander";
import { resolve, extname } from "path";
import chalk from "chalk";
import {
  getAvailableCodemods,
  promptForPaths,
  promptForTransform
} from "./utils";

let transformPath: string;
if (extname(__filename) === ".ts") {
  transformPath = resolve(__dirname, "../build/transforms");
} else {
  transformPath = resolve(__dirname, "../transforms");
}

program
  .command("list")
  .description("list availabled codemods.")
  .alias("l")
  .action(listTransforms);

program
  .command("run [transform] [...paths]")
  .description("Run transform on files.")
  .alias("r")
  .action(runCodemod);

program.command("*", "run codemod.").action(runCodemod);
program.parse(process.argv);

async function runCodemod(transform: string, ...paths: string[]) {
  paths = paths.filter(p => typeof p === "string");
  const transforms = await getAvailableCodemods();
  if (!transforms.includes(transform)) {
    console.log(chalk.yellowBright("Specified transform does not exist."));
    transform = await promptForTransform(transforms);
  }
  if (!paths.length) {
    const pathsString = await promptForPaths();
    if (pathsString) {
      paths = pathsString
        .split(",")
        .reduce(
          (acc: string[], next: string) => acc.concat(next.split(" ")),
          []
        )
        .filter(Boolean);
    }
  }
  if (transform && paths.length) {
    console.log(
      chalk.whiteBright("Running transform"),
      chalk.yellowBright(transform),
      chalk.whiteBright("on:")
    );
    paths.forEach(p => console.log(chalk.green(p)));
    codemodCli.runTransform(transformPath, transform, paths);
  } else {
    console.log(chalk.redBright("Must provide a <transform> and <...paths>!"));
    process.exit(1);
  }
}

async function listTransforms() {
  const transform = await getAvailableCodemods();
  console.log(chalk.green("Available transforms:"));
  transform.forEach(p => console.log(`- ${p}`));
}
