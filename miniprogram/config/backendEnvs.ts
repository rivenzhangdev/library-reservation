export interface MiniProgramBackendEnv {
  key: 'development' | 'test' | 'uat' | 'production';
  label: string;
  baseUrl: string;
  lanBaseUrl?: string;
}

export const PROJECT_BACKEND_ENVS: MiniProgramBackendEnv[] = [
  {
    key: 'development',
    label: '本地',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: '',
  },
  {
    key: 'test',
    label: '测试',
    baseUrl: 'http://localhost:3001',
    lanBaseUrl: '',
  },
  {
    key: 'uat',
    label: 'UAT',
    baseUrl: 'http://localhost:3002',
    lanBaseUrl: '',
  },
  {
    key: 'production',
    label: '线上',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: '',
  },
];
