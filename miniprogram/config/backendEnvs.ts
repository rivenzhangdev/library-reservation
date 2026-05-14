/**
 * 小程序后端环境配置
 * 仅在当前小程序项目内维护。
 * 建议保持 key 稳定（development/test/uat/production）。
 * 生产构建（release）会隐藏环境切换入口。
 */
export interface MiniProgramBackendEnv {
  key: 'development' | 'test' | 'uat' | 'production';
  label: string;
  baseUrl: string;
  lanBaseUrl?: string;
  isProd: boolean;
}

export const PROJECT_BACKEND_ENVS: MiniProgramBackendEnv[] = [
  {
    key: 'development',
    label: '本地开发',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: 'http://192.168.18.60:3000',
    isProd: false,
  },
  {
    key: 'test',
    label: '测试环境',
    baseUrl: 'http://localhost:3001',
    lanBaseUrl: 'http://192.168.18.60:3001',
    isProd: false,
  },
  {
    key: 'uat',
    label: 'UAT 预发布',
    baseUrl: 'http://localhost:3002',
    lanBaseUrl: 'http://192.168.18.60:3002',
    isProd: false,
  },
  {
    key: 'production',
    label: '线上生产',
    baseUrl: 'http://localhost:3003',
    lanBaseUrl: 'http://172.25.69.158:3003',
    isProd: true,
  },
];
