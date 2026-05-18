import { Avatar } from './Avatar';

const USER_NAME = 'Jisung';
const USER_AVATAR = 'https://i.pravatar.cc/64?img=12';

export function UserInfo() {
  return (
    <div className="flex items-center gap-2 px-1">
      <Avatar src={USER_AVATAR} alt={USER_NAME} fallback="J" />
      <span className="text-label-1 text-gray-900">{USER_NAME}</span>
    </div>
  );
}
