module.exports = {
	mode: 'LOCAL', // 模式: 'LOCAL' 讀取本地Excel | 'GOOGLE_SHEET' 使用Google API
	excelProjectToken: 'YOUR_GOOGLE_SHEET_TOKEN', // Google Sheet 專案 token
	useApiKey: 'YOUR_GOOGLE_API_KEY', // Google API key
	sheet: [], // 選擇excel表內sheet，空陣列表示處理所有sheet
	distFolder: 'src/i18n/lang', // 檔案輸出資料夾
	sourceFilePath: 'src/i18n/i18nLanguageDictionary.xlsx', // mode = LOCAL 時需要配置 讀取的檔案位置
	outputFormat: 'js', // 輸出格式: 'js' JavaScript模組 | 'json' 純JSON檔案
};
