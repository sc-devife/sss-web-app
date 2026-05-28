import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
// import AppToast from "../services/toastService";
import { BASE_URL } from "../constants/baseUrl";
import storageService from "../services/localStorage";
// Import your types from your store file
import type { RootState, AppStore } from "../app/store"; 

let storeRef: AppStore | undefined;
let isSessionHandled = false;

export const injectStore = (_store: AppStore): void => {
  storeRef = _store;
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const state = storeRef?.getState() as RootState;
      const token = (state as any)?.auth?.token;
      const resetToken = storageService.getItem("resetToken");

      if (resetToken && config.url?.includes("/auth/reset-password")) {
        config.headers.Authorization = `Bearer ${resetToken}`;
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Request interceptor error:", err);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url;
    const status = error.response?.status;

    if (status === 401) {
      if (requestUrl?.includes("/auth/login")) {
        return Promise.reject(error);
      }
      if (!isSessionHandled) {
        isSessionHandled = true;
        // AppToast.showError("Session expired. Please login again.");
        
        // Use your actual action creator if available, 
        // or keep the manual object dispatch
        storeRef?.dispatch({ type: "auth/logOutUser" });

        setTimeout(() => {
          isSessionHandled = false;
        }, 500);
      }
    } else if (status === 402) {
      storeRef?.dispatch({ type: "auth/subsCriptionExpired" });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;