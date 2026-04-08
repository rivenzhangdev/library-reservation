export function readLocalImageAsDataUrl(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        const mimeType = mimeTypeMap[ext] || 'image/jpeg';
        resolve(`data:${mimeType};base64,${res.data}`);
      },
      fail: reject,
    });
  });
}
