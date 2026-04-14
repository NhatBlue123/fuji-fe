import { aiBaseApi } from "../aiBaseApi";

export interface RagIngestResponse {
  ok: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export const adminAiRagApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    ingestCoursesRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/ingest-courses",
        method: "POST",
      }),
    }),
    ingestWebGuideRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/ingest-web-guide",
        method: "POST",
      }),
    }),
  }),
});

export const { useIngestCoursesRagMutation, useIngestWebGuideRagMutation } =
  adminAiRagApi;
