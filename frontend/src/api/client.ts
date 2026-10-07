import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_ORIGIN
  ? `https://${import.meta.env.VITE_API_ORIGIN}/api/v1`
  : (import.meta.env.VITE_API_BASE_URL ?? "/api/v1");

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_KEY = "rra_access";
const REFRESH_KEY = "rra_refresh";

export const tokenStore = {
  get access() {
    return sessionStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return sessionStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    sessionStorage.setItem(ACCESS_KEY, access);
    sessionStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  refreshing ??= axios
    .post(`${BASE_URL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const { accessToken, refreshToken: next } = res.data.data;
      tokenStore.set(accessToken, next ?? refreshToken);
      return accessToken as string;
    })
    .catch(() => {
      tokenStore.clear();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !isAuthCall && !original._retry) {
      original._retry = true;
      const fresh = await refreshAccessToken();
      if (fresh) {
        original.headers.Authorization = `Bearer ${fresh}`;
        return api.request(original);
      }
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: { field: string; message: string }[];

  constructor(code: string, message: string, status: number, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (body?.errorCode) {
      return new ApiError(body.errorCode, body.message, error.response?.status ?? 0, body.errors ?? []);
    }
    if (!error.response) {
      return new ApiError("NETWORK_ERROR", "Cannot reach the server. Check your connection.", 0);
    }
    return new ApiError("UNKNOWN", "Something went wrong.", error.response.status);
  }
  return new ApiError("UNKNOWN", error instanceof Error ? error.message : "Something went wrong.", 0);
}

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
