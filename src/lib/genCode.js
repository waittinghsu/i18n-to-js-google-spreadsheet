const _ = require("lodash");

/**
 *
 * @param {Object} Obj {key: value}
 * @return {string}
 */
const genCodeByObj = (Obj = {}) => {
  let code = "";
  // code = `/* eslint-disable */\n`;
  code += `export default ${JSON.stringify(Obj, undefined, 2)};\n`;
 // console.log(code)
  return code;
};

/**
 *
 * @param {Array<Object>} interfaceList [{key: '', text: ''}]
 * @return {string}
 */
const genCodeByArrayObj = (interfaceList) => {
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

module.exports = { genCodeByArrayObj, genCodeByObj };
