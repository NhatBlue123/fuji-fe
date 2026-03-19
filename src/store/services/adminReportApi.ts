import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  CreateSystemReportNotePayload,
  CreateSystemReportPayload,
  ReportCategory,
  ReportPriority,
  SystemReport,
  SystemReportNote,
  SystemReportStatus,
  UpdateSystemReportPayload,
} from "@/types/admin-reports";

// Base query with authentication (mirrors adminJlptApi)
const baseQuery = async (args: any) => {
  const { url, method = "GET", body } =
    typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {};
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, config);
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  const data = await response.json();
  return { data };
};

export const adminReportApi = createApi({
  reducerPath: "adminReportApi",
  baseQuery,
  tagTypes: ["SystemReport", "SystemReportNotes"],
  endpoints: (builder) => ({
    getSystemReports: builder.query<
      PaginatedResponse<SystemReport>,
      {
        category?: ReportCategory;
        status?: SystemReportStatus;
        priority?: ReportPriority;
        search?: string;
        from?: string;
        to?: string;
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: "asc" | "desc";
      }
    >({
      query: (params) => {
        const p = params ?? {};
        const sp = new URLSearchParams();
        if (p.category) sp.set("category", p.category);
        if (p.status) sp.set("status", p.status);
        if (p.priority) sp.set("priority", p.priority);
        if (p.search) sp.set("search", p.search);
        if (p.from) sp.set("from", p.from);
        if (p.to) sp.set("to", p.to);
        sp.set("page", String(p.page ?? 0));
        sp.set("size", String(p.size ?? 20));
        sp.set("sortBy", p.sortBy ?? "createdAt");
        sp.set("sortDir", p.sortDir ?? "desc");
        const qs = sp.toString();
        return `/admin/reports${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (
        response: ApiResponse<PaginatedResponse<SystemReport>>,
      ) => response.data,
      providesTags: ["SystemReport"],
    }),

    getSystemReport: builder.query<SystemReport, number>({
      query: (id) => `/admin/reports/${id}`,
      transformResponse: (response: ApiResponse<SystemReport>) => response.data,
      providesTags: (result, error, id) => [{ type: "SystemReport", id }],
    }),

    createSystemReport: builder.mutation<SystemReport, CreateSystemReportPayload>(
      {
        query: (body) => ({
          url: "/admin/reports",
          method: "POST",
          body,
        }),
        transformResponse: (response: ApiResponse<SystemReport>) => response.data,
        invalidatesTags: ["SystemReport"],
      },
    ),

    updateSystemReport: builder.mutation<
      SystemReport,
      { id: number; data: UpdateSystemReportPayload }
    >({
      query: ({ id, data }) => ({
        url: `/admin/reports/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<SystemReport>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "SystemReport", id },
        "SystemReport",
      ],
    }),

    getSystemReportNotes: builder.query<SystemReportNote[], number>({
      query: (reportId) => `/admin/reports/${reportId}/notes`,
      transformResponse: (response: ApiResponse<SystemReportNote[]>) =>
        response.data,
      providesTags: (result, error, reportId) => [
        { type: "SystemReportNotes", id: reportId },
      ],
    }),

    addSystemReportNote: builder.mutation<
      SystemReportNote,
      { reportId: number; data: CreateSystemReportNotePayload }
    >({
      query: ({ reportId, data }) => ({
        url: `/admin/reports/${reportId}/notes`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<SystemReportNote>) =>
        response.data,
      invalidatesTags: (result, error, { reportId }) => [
        { type: "SystemReportNotes", id: reportId },
      ],
    }),
  }),
});

export const {
  useGetSystemReportsQuery,
  useGetSystemReportQuery,
  useCreateSystemReportMutation,
  useUpdateSystemReportMutation,
  useGetSystemReportNotesQuery,
  useAddSystemReportNoteMutation,
} = adminReportApi;

