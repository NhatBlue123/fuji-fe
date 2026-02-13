// User interface - Match với backend UserDTO
export interface User {
  _id: string;
  id?: number | string;
  email: string;
  username: string;
  fullname: string;
  fullName?: string; // Backend returns fullName (camelCase)
  avatar?: string;
  avatarUrl?: string; // Backend returns avatarUrl
  bio?: string;
  phone?: string;
  address?: string;
  gender: string;
  role?: string; // STUDENT, INSTRUCTOR, ADMIN
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  isActive: boolean;
  isAdmin: boolean;
  isOnline: boolean;
  posts: number;
  followers: string[];
  following: string[];
  course?: string;
  lastActiveAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullname: string;
}
export interface AuthResponse {
  success: boolean;
  // Backend trả về key i18n thay vì chuỗi message thô
  messageKey?: string;
  data: {
    accessToken: string;
    user: User;
  } | null;
  timestamp: string;
}

// User Profile API response - Backend trả về user object trực tiếp trong data
export interface UserProfileResponse {
  success: boolean;
  messageKey?: string;
  data: User | null; // ← Trực tiếp User object, không phải { user: User }
  timestamp: string;
}

// Auth state types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Đánh dấu auth đã được khởi tạo
}

// Component Props
export interface AuthFormProps {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  isModal?: boolean;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export interface AuthPageProps {
  defaultMode?: "login" | "register";
}
