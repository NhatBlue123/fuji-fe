import { baseApi } from "./baseApi";

export const adminJlptApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllTests: builder.query<any, void>({
            query: () => "/admin/jlpt-tests",
            providesTags: ["AdminJLPTTests"],
        }),
        createTest: builder.mutation<any, any>({
            query: (body) => ({
                url: "/admin/jlpt-tests",
                method: "POST",
                body,
            }),
            invalidatesTags: ["AdminJLPTTests"],
        }),
        updateTest: builder.mutation<any, { id: number; body: any }>({
            query: ({ id, body }) => ({
                url: `/admin/jlpt-tests/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "AdminJLPTTests", id },
                "AdminJLPTTests",
            ],
        }),
        deleteTest: builder.mutation<any, number>({
            query: (id) => ({
                url: `/admin/jlpt-tests/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AdminJLPTTests"],
        }),
        getTestForEdit: builder.query<any, number>({
            query: (id) => `/admin/jlpt-tests/${id}`,
            providesTags: (result, error, id) => [{ type: "AdminJLPTTests", id }],
        }),
    }),
});

export const {
    useGetAllTestsQuery,
    useCreateTestMutation,
    useUpdateTestMutation,
    useDeleteTestMutation,
    useGetTestForEditQuery,
} = adminJlptApi;
