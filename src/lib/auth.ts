"use server";

import { cookies } from "next/headers";

export async function logout() {
  try {
    cookies().delete("auth_token");
    cookies().delete("refresh_token");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Logout failed" };
  }
}

export async function getAuthToken() {
  try {
    const token = cookies().get("auth_token");
    return token?.value || null;
  } catch (error) {
    console.error("Get token error:", error);
    return null;
  }
}
