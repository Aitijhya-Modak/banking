import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useStaffAuthStore } from "../hooks/useStaffAuthStore";

/**
 * Configured Axios client used for API requests.
 * Cookies are included with requests to support authentication sessions.
 */
export const api = axios.create({
  baseURL:
    import.meta.env.API_URL ||
    "https://banking-backend-537108330029.us-central1.run.app/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Extends Axios request configuration with a flag that prevents
 * the same request from triggering token refresh repeatedly.
 */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Indicates whether a token refresh request is currently running. */
let isRefreshing = false;

/**
 * Stores requests that failed while a token refresh was in progress.
 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Resolves or rejects all requests waiting for token refresh completion.
 * @param error - The refresh error, or `null` when refresh succeeds.
 */
const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Handles successful responses and automatically refreshes authentication
 * when a request fails with HTTP 401.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/staff/auth/refresh");

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        useStaffAuthStore.getState().clearAuth();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
