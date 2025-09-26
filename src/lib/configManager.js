const fs = require('fs');
const path = require('path');

/**
 * 配置檔管理器
 * 處理多種配置檔案格式的載入和建立
 */
class ConfigManager {
  constructor(loadPath = process.cwd()) {
    this.loadPath = loadPath;
    this.configFiles = [
      'i18n-to-js.config.js',
      'i18n-to-js.config.cjs',
      'i18n-to-js.config.mjs',
      'i18n-to-js.config.json'
    ];
  }

  /**
   * 尋找現有的配置檔案
   * @returns {string|null} 配置檔案路徑或 null
   */
  findExistingConfig() {
    for (const configFile of this.configFiles) {
      const testPath = path.resolve(this.loadPath, configFile);
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }
    return null;
  }

  /**
   * 檢測專案類型（ESM 或 CommonJS）
   * @returns {boolean} true 為 ESM，false 為 CommonJS
   */
  detectProjectType() {
    const packageJsonPath = path.resolve(this.loadPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.type === 'module';
      } catch (error) {
        console.warn('⚠️  讀取 package.json 失敗，預設使用 CommonJS');
      }
    }
    return false;
  }

  /**
   * 建立預設配置檔案
   * @returns {string} 建立的配置檔案路徑
   */
  createDefaultConfig() {
    const isESM = this.detectProjectType();

    // 根據專案類型決定配置檔案格式
    const configFileName = isESM ? 'i18n-to-js.config.cjs' : 'i18n-to-js.config.js';
    const configFilePath = path.resolve(this.loadPath, configFileName);

    console.log(`🔧 自動建立配置檔案：${configFileName}`);
    console.log(`📦 檢測到專案類型：${isESM ? 'ESM' : 'CommonJS'}`);

    // 讀取預設配置模板
    const defaultConfigPath = path.resolve(__dirname, 'config.js');

    try {
      fs.copyFileSync(defaultConfigPath, configFilePath);
      console.log(`✅ 已自動建立配置檔：${configFileName}`);
      console.log('⚠️  請編輯配置檔並填入正確的 API Key 和檔案路徑');
      return configFilePath;
    } catch (error) {
      console.error('❌ 建立配置檔失敗:', error.message);
      throw error;
    }
  }

  /**
   * 載入配置檔案
   * @param {string} configFilePath 配置檔案路徑
   * @returns {Object} 配置物件
   */
  loadConfig(configFilePath) {
    try {
      const ext = path.extname(configFilePath);

      switch (ext) {
        case '.json':
          return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

        case '.mjs':
          // ES module 動態載入 (需要特殊處理)
          throw new Error('暫不支援 .mjs 檔案，請使用 .cjs 或 .js 格式');

        case '.js':
        case '.cjs':
        default:
          // 清除 require 緩存，確保每次都載入最新配置
          delete require.cache[require.resolve(configFilePath)];
          return require(configFilePath);
      }
    } catch (error) {
      console.error('❌ 載入配置檔失敗:', error.message);
      console.error('📝 請檢查配置檔語法是否正確');
      throw error;
    }
  }

  /**
   * 獲取配置（主要入口）
   * @returns {Object} 配置物件
   */
  getConfig() {
    // 1. 尋找現有配置檔
    let configFilePath = this.findExistingConfig();

    // 2. 如果沒有找到，建立預設配置檔
    if (!configFilePath) {
      console.log('📄 找不到配置檔案');
      configFilePath = this.createDefaultConfig();
    }

    // 3. 載入並返回配置
    console.log(`📖 載入配置檔：${path.basename(configFilePath)}`);
    return this.loadConfig(configFilePath);
  }
}

module.exports = ConfigManager;
