export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type SSEEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; items?: unknown[]; mode?: string; options?: string[] }
  | { type: 'error'; message?: string };
