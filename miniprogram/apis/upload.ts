import { createApi } from '../utils/helpers';

const uploadApi = createApi('/api/uploads');

export const uploadDataUrl = (dataUrl: string) =>
  uploadApi.post(
    '',
    { dataUrl },
    {
      showLoading: true,
      loadingTitle: '上传中...',
    }
  );

export default {
  uploadDataUrl,
};
