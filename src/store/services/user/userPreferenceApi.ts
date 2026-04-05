import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";

export interface UserPreference {
  id: number;
  courseUpdates: boolean;
  newMessages: boolean;
  examReminders: boolean;
  systemAlerts: boolean;
  emailDigest: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const userPreferenceApi = createApi({
  reducerPath: "userPreferenceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["UserPreference"],
  endpoints: (builder) => ({
    getMePreferences: builder.query<UserPreference, void>({
      query: () => "/users/me/preferences",
      transformResponse: (response: ApiResponse<UserPreference>) => response.data,
      providesTags: ["UserPreference"],
    }),
    updateMePreferences: builder.mutation<UserPreference, Partial<UserPreference>>({
      query: (prefs) => ({
        url: "/users/me/preferences",
        method: "PUT",
        body: prefs,
      }),
      transformResponse: (response: ApiResponse<UserPreference>) => response.data,
      invalidatesTags: ["UserPreference"],
    }),
  }),
});

export const {
  useGetMePreferencesQuery,
  useUpdateMePreferencesMutation,
} = userPreferenceApi;
