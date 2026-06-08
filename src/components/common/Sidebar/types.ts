import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  icon: LucideIcon;
  title: string;
  path?: string;
  notifs?: number;
}

export interface OptionProps {
  icon: LucideIcon;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  open: boolean;
  notifs?: number;
}

export interface TitleSectionProps {
  open: boolean;
}

export interface ToggleCloseProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
