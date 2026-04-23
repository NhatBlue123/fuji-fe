import { baseApi } from './baseApi';

export interface SystemErrorSummary {
  total24h: number;
  unresolved: number;
  countByLevel: Record<string, number>;
}

export interface SystemErrorLogNote {
  id: number;
  authorId: number;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface SystemErrorLog {
  id: number;
  createdAt: string;
  level: string;
  service: string;
  messageShort: string;
  messageFull: string;
  stackTrace: string;
  requestId: string;
  userId?: number;
  bookingId?: number;
  roomId?: number;
  path: string;
  method: string;
  statusCode: number;
  resolved: boolean;
  resolvedAt?: string;
  resolvedById?: number;
  resolvedByName?: string;
  resolutionNote?: string;
  notes: SystemErrorLogNote[];
  requestBody?: string | Record<string, unknown>;
  environment?: string;
  userAgent?: string;
}

export interface SystemErrorFilters {
  from?: string;
  to?: string;
  level?: string;
  service?: string;
  keyword?: string;
  userId?: number;
  bookingId?: number;
  roomId?: number;
  requestId?: string;
  resolved?: boolean;
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/**
 * API service quản lý lỗi hệ thống cho Admin.
 * Cung cấp các phương thức truy vấn danh sách lỗi, chi tiết lỗi và các hành động xử lý (resolve, add note).
 */
export const adminSystemErrorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Lấy danh sách lỗi có phân trang và bộ lọc
    getSystemErrorLogs: build.query<{ data: { content: SystemErrorLog[]; totalElements: number; totalPages: number; number: number; last: boolean } }, SystemErrorFilters>({
      query: (filters: SystemErrorFilters) => ({
        url: '/admin/system-errors',
        params: filters,
      }),
      providesTags: ['SystemError'],
    }),
    // Lấy thông tin tổng hợp cho Dashboard (số lượng lỗi 24h, lỗi chưa xử lý)
    getSystemErrorSummary: build.query<{ data: SystemErrorSummary }, void>({
      query: () => '/admin/system-errors/summary',
      providesTags: ['SystemErrorSummary'],
    }),
    // Lấy chi tiết một lỗi cụ thể kèm stack trace và ghi chú timeline
    getSystemErrorDetail: build.query<{ data: SystemErrorLog }, number>({
      query: (id: number) => `/admin/system-errors/${id}`,
      providesTags: (_result, _error, id: number) => [{ type: 'SystemError', id }],
    }),
    // Đánh dấu lỗi đã được giải quyết
    resolveSystemError: build.mutation<{ data: SystemErrorLog }, { id: number; note: string }>({
      query: ({ id, note }: { id: number; note: string }) => ({
        url: `/admin/system-errors/${id}/resolve`,
        method: 'PATCH',
        body: { note },
      }),
      invalidatesTags: ['SystemError', 'SystemErrorSummary'],
    }),
    // Thêm ghi chú mới vào tiến trình điều tra lỗi
    addSystemErrorNote: build.mutation<{ data: SystemErrorLogNote }, { id: number; note: string }>({
      query: ({ id, note }: { id: number; note: string }) => ({
        url: `/admin/system-errors/${id}/note`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['SystemError'],
    }),
  }),
});

export const {
  useGetSystemErrorLogsQuery,
  useGetSystemErrorSummaryQuery,
  useGetSystemErrorDetailQuery,
  useResolveSystemErrorMutation,
  useAddSystemErrorNoteMutation,
} = adminSystemErrorApi;
