import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ApiClient {
  private static client = axios.create({
    baseURL: "",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string; message?: string } | undefined)?.error ??
          (err.response?.data as { error?: string; message?: string } | undefined)?.message ??
          "Request failed";
        throw new ApiError(message, err.response?.status ?? 500);
      }
      throw new ApiError("Something went wrong", 500);
    }
  }

  static get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ method: "GET", url, params });
  }

  static post<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: "POST", url, data });
  }

  static patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: "PATCH", url, data });
  }

  static put<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: "PUT", url, data });
  }

  static delete<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ method: "DELETE", url, params });
  }
}
