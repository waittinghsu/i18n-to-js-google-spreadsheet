const fs = require("fs");
const path = require("path");
const _ = require("lodash");

module.exports = function genCode(interfaceList) {
  let code = "";
  // code = `/* eslint-disable */\n`;
  code += `export default {`;
  // todo 物件版本 key唯一
  // _.forEach(interfaceList, (value, key) => {
  //   code += `  '${key}': \`${value}\`,\n`;
  // });
  // todo 陣列版本 全塞
  _.forEach(interfaceList, (value, index) => {
    const spacing = index === 0 ? "\n" : "";
    code += `${spacing}  '${value.key}': \`${value.text}\`,\n`;
  });
  code += `};\n`;
  return code;
};
