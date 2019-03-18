import { JSCodeshift } from "jscodeshift";
import { Component } from "../../utils/component";
const { getParser } = require("codemod-cli").jscodeshift;
const { getOptions } = require("codemod-cli");

module.exports = function transformer(file: any, api: any) {
  const j = getParser(api) as JSCodeshift;
  const options = getOptions();

  const root = j(file.source);
  const component = Component.build(j, root);
  component.rebuild();
  return root.toSource();
};
