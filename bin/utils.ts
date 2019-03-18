import * as fs from "fs";
import * as inquirer from "inquirer";
import { promisify } from "util";
import { PathPrompt } from "inquirer-path";
import { resolve } from "path";

const readdir = promisify(fs.readdir);

/**
 * List available codemods to run.
 */
export async function getAvailableCodemods(): Promise<string[]> {
  const items = await readdir(resolve(__dirname, "../transforms"));
  return items.filter(item => !item.startsWith("."));
}

/**
 *
 * @param choices
 */
export async function promptForTransform(choices: string[]) {
  choices = choices || (await getAvailableCodemods());
  const prompt = inquirer.createPromptModule();
  return prompt([
    {
      type: "list",
      name: "transform",
      message: "Select transform to run",
      choices
    }
  ]).then((result: any) => result.transform);
}

export async function promptForPaths() {
  const prompt = inquirer.createPromptModule();
  prompt.registerPrompt("path", PathPrompt);
  return prompt([
    {
      type: "path",
      name: "paths",
      message: "Run transform on paths/globs (comma/space separated):"
    }
  ]).then((result: any) => result.paths.trim());
}
