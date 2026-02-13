"use server";

import { cookies } from "next/headers";

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("refresh_token");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Logout failed" };
  }
}

export async function getAuthToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    return token?.value || null;
  } catch (error) {
    console.error("Get token error:", error);
    return null;
  }
}
