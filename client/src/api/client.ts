import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly Refresh Token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-Memory Access Token Store (XSS-safe: never stored in localStorage)
let accessToken: string | null = null;
let logoutCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const registerLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

// 1. Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Refresh Token Rotation (RTR) on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid infinite refresh loops for auth endpoints
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Safely extract a clear, human-readable Vietnamese error message from any API error
 * Eliminates raw developer jargon like "Request failed with status code 401"
 */
export const getErrorMessage = (
  err: any,
  fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'
): string => {
  if (!err) return fallback;

  // 1. Direct message from server response
  const serverMsg =
    err.response?.data?.message ||
    err.response?.data?.error?.message;

  if (serverMsg && typeof serverMsg === 'string' && serverMsg.trim()) {
    return serverMsg.trim();
  }

  // 2. HTTP status code fallbacks (Vietnamese, zero jargon)
  const status = err.response?.status;
  if (status === 401) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
  }
  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (status === 404) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }
  if (status === 409) {
    return 'Dữ liệu đã tồn tại hoặc xảy ra xung đột.';
  }
  if (status === 423) {
    return 'Tài khoản đang bị tạm khóa để bảo vệ an toàn.';
  }
  if (status === 429) {
    return 'Bạn thao tác quá nhanh. Vui lòng chờ trong giây lát.';
  }
  if (status && status >= 500) {
    return 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.';
  }

  // 3. Network connection issues
  if (err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
  }

  // 4. Suppress raw Axios error messages (e.g. "Request failed with status code ...")
  if (
    typeof err.message === 'string' &&
    !err.message.includes('status code') &&
    !err.message.includes('AxiosError') &&
    !err.message.includes('Network Error')
  ) {
    return err.message;
  }

  return fallback;
};
