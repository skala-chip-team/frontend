import { NotificationBell } from './NotificationBell';
import { UserInfo } from './UserInfo';

export function Header() {
  return (
    <header className="relative z-30 flex h-16 items-center justify-end gap-3 px-6">
      <NotificationBell />
      <UserInfo />
    </header>
  );
}
