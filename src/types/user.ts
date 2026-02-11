export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: string | null;
  bio?: string | null;
  jlptLevel?: string | null;
  active: boolean;
  createdAt: string;
}
