const _ = require("lodash");

/**
 * 根據指定格式生成程式碼
 * @param {Object} Obj {key: value}
 * @param {string} format 輸出格式: 'js' | 'json'
 * @return {string}
 */
const genCodeByObj = (Obj = {}, format = 'js') => {
  let code = "";

  // 防呆機制：如果格式不正確，預設使用 js
  const validFormats = ['js', 'json'];
  const outputFormat = validFormats.includes(format) ? format : 'js';

  switch (outputFormat) {
    case 'json':
      // 純 JSON 格式
      code = JSON.stringify(Obj, undefined, 2);
      break;
    case 'js':
    default:
      // JavaScript 模組格式 (預設)
      code = `export default ${JSON.stringify(Obj, undefined, 2)};\n`;
      break;
  }

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
