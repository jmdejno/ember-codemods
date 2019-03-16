#!/usr/bin/env node
import { runTransform } from "codemod-cli";
import * as program from "commander";

program.command("list", "list availabled codemods.", { isDefault: true });


program.runTransform(
  __dirname,
  process.argv[2] /* transform name */,
  process.argv.slice(3) /* paths or globs */
);
