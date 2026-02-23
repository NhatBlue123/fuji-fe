
export interface AuthUser {
  id: number;
  username: string;
  email: string;

  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  gender?: string | null;
  phone?: string | null;

  jlptLevel?: "N5" | "N4" | "N3" | "N2" | "N1" | null;

  active: boolean;
  createdAt: string;
}
