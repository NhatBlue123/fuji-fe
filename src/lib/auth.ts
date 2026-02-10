"use server";

import { cookies } from "next/headers";

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refreshToken"); // HttpOnly cookie set by backend
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Logout failed" };
  }
}

export async function getAuthToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    return token?.value || null;
  } catch (error) {
    console.error("Get token error:", error);
    return null;
  }
}
