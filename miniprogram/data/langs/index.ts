// 多语言包统一导出文件
// 按语言维度组织：每个语言一个独立文件，避免过度聚合
import zh from './zh/index';
import en from './en/index';

// 统一导出为嵌套对象，方便按语言访问
const langPacks = {
  zh,
  en,
};

export default langPacks;
