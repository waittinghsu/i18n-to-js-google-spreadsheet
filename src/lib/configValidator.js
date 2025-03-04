// i18nConfigValidator.js
class ConfigValidationError extends Error {
  constructor(message, missingFields) {
    super(message);
    this.name = 'ConfigValidationError';
    this.missingFields = missingFields;
  }
}

const CONFIG_RULES = {
  GOOGLE_SHEET: {
    requiredFields: ['excelProjectToken', 'useApiKey', 'sheet'],
  },
  LOCAL: {
    requiredFields: ['sourceFilePath', 'distFolder', 'sheet'],
  },
};

function checkI18nConfig(config, mode = 'LOCAL') {
  // 驗證模式是否存在
  if (!CONFIG_RULES[mode]) {
    throw new ConfigValidationError(`不支持的配置模式：${mode}`);
  }

  // 檢查缺失欄位
  const requiredFields = CONFIG_RULES[mode].requiredFields;
  const missingFields = requiredFields.filter(field =>
    config[field] === undefined ||
			config[field] === null ||
			(typeof config[field] === 'string' && config[field].trim() === '') ||
			(Array.isArray(config[field]) && config[field].length === 0) ||
			(typeof config[field] === 'object' && Object.keys(config[field]).length === 0),
  );

  // 如果有缺失欄位，拋出錯誤
  if (missingFields.length > 0) {
    throw new ConfigValidationError(`${mode} 模式配置缺少必要欄位`, missingFields);
  }
}

module.exports = {
  checkI18nConfig,
  ConfigValidationError,
  CONFIG_RULES,
};
