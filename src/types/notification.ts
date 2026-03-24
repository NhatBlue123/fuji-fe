export enum NotificationType {
  course = "course",
  system = "system",
  reminder = "reminder",
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  linkUrl?: string;
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  content: Notification[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
