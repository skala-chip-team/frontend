export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}
