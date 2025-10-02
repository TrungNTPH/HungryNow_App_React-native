import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { appInfors } from '../constants/appInfors';
import { getToken } from '../utils/authToken';

const axiosClient = axios.create({
  baseURL: appInfors.BASE_URL,
});

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers.Accept = 'application/json';
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<any>) => {
    if (error.response) {
      const data = error.response.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors)
          ? data.errors.map((e: any) => e?.msg || e?.message || e).join(', ')
          : undefined) ||
        (typeof data === 'string' ? data : undefined);

      error.message = serverMsg || error.message || 'Something went wrong.';
      return Promise.reject(error);
    }
    if (error.request) {
      error.message = 'No response from server. Check your network.';
      return Promise.reject(error);
    }
    error.message =
      'Request setup error: ' + (error.message || 'Unknown error');
    return Promise.reject(error);
  },
);

export default axiosClient;