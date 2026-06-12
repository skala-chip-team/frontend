import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores';

import { Avatar } from './Avatar';

export function UserInfo() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const name = user?.username ?? '사용자';
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-2 px-1">
      <Avatar alt={name} fallback={initial} />
      <div className="flex flex-col leading-tight">
        <span className="text-label-1 text-gray-900">{name}</span>
        {user?.role ? <span className="text-label-3 text-gray-400">{user.role}</span> : null}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="로그아웃"
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-black/5 hover:text-gray-600"
      >
        <LogOut className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
