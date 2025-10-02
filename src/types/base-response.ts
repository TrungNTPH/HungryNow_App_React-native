export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends BaseResponse<T> {
  pagination: Pagination;
}
