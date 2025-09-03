declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      CLIENT_ORIGIN?: string;
    }
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode: number;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
