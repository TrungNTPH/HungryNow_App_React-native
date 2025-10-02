import axiosClient from './axiosClient';

export interface UploadImageResponse {
  message: string;
  imageUrl: string;
}

/**
 * Upload image to server
 * @param fileUri
 */
export const uploadApi = {
  uploadImage: async (fileUri: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);
    const res = await axiosClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res;
  },
};
