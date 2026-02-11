// import { baseApi } from "../baseApi";
// import { User } from "@/types/user";

// export const userApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     getMe: builder.query<User, void>({
//       query: () => "/users/me",

//       transformResponse: (res: any): User => ({
//         id: res.id,
//         username: res.username,
//         email: res.email,

//         fullName: res.fullName,
//         avatarUrl: res.avatarUrl,
//         bio: res.bio,
//         gender: res.gender,
//         phone: res.phone,

//         jlptLevel: res.jlptLevel,
//         active: res.active,
//         createdAt: res.createdAt,
//       }),
//     }),
//   }),
// });

// export const { useGetMeQuery } = userApi;
