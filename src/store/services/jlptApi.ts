import { baseApi } from "./baseApi";

export const jlptApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPublishedTests: builder.query<any, any>({
            query: (params) => ({
                url: "/jlpt-tests/published",
                params,
            }),
            providesTags: ["JLPTTests"],
        }),
        getTestById: builder.query<any, number>({
            query: (id) => `/jlpt-tests/${id}`,
            providesTags: (result, error, id) => [{ type: "JLPTTests", id }],
        }),
        submitTest: builder.mutation<any, any>({
            query: (body) => ({
                url: "/jlpt-tests/submit",
                method: "POST",
                body,
            }),
            invalidatesTags: ["JLPTAttempts"],
        }),
        getMyAttempts: builder.query<any, void>({
            query: () => "/jlpt-tests/my-attempts",
            providesTags: ["JLPTAttempts"],
        }),
        getAttemptById: builder.query<any, number>({
            query: (id) => `/jlpt-tests/attempts/${id}`,
            providesTags: (result, error, id) => [{ type: "JLPTAttempts", id }],
        }),
    }),
});

export const {
    useGetPublishedTestsQuery,
    useGetTestByIdQuery,
    useSubmitTestMutation,
    useGetMyAttemptsQuery,
    useGetAttemptByIdQuery,
} = jlptApi;
