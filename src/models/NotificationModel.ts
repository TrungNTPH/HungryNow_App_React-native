import { UserModel } from './UserModel';

export type NotificationType = 'personal' | 'system';
export type NotificationStatus = 'read' | 'unread';
export type UserRole = 'user' | 'admin' | 'employee';

export interface NotificationModel {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: UserModel;
  targetRoles: UserRole[];
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}
