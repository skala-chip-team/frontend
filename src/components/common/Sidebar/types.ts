import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  icon: LucideIcon;
  title: string;
  notifs?: number;
}

export interface OptionProps {
  icon: LucideIcon;
  title: string;
  selected: string;
  setSelected: (title: string) => void;
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
