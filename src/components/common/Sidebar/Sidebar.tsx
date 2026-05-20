import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Activity,
  Lightbulb,
  Boxes,
  ChevronsRight,
  Settings,
  HelpCircle,
} from 'lucide-react';
import type { MenuItem, OptionProps, TitleSectionProps, ToggleCloseProps } from './types';

const MAIN_MENU: MenuItem[] = [
  { icon: Home, title: '대시보드' },
  { icon: Activity, title: '장비 모니터링' },
  { icon: Lightbulb, title: '재조정 제안 관리' },
  { icon: Boxes, title: 'UNIT 관리' },
];

const ACCOUNT_MENU: MenuItem[] = [
  { icon: Settings, title: '설정' },
  { icon: HelpCircle, title: '도움말 및 지원' },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState('대시보드');

  const navigate = useNavigate();

  const handleMenuClick = (title: string) => {
    setSelected(title);

    switch (title) {
      case '대시보드':
        navigate('/');
        break;
      case '재조정 제안 관리':
        navigate('/reschedule');
        break;
      default:
        break;
    }
  };

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 overflow-hidden border-r border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <TitleSection open={open} />

      <div className="mb-8 space-y-1">
        {MAIN_MENU.map((item) => (
          <Option
            key={item.title}
            icon={item.icon}
            title={item.title}
            notifs={item.notifs}
            selected={selected}
            onClick={handleMenuClick}
            open={open}
          />
        ))}
      </div>

      {open && (
        <div className="space-y-1 border-t border-gray-200 pt-4">
          <div className="px-3 py-2 text-label-3 uppercase tracking-wide text-gray-500">
            계정
          </div>

          {ACCOUNT_MENU.map((item) => (
            <Option
              key={item.title}
              icon={item.icon}
              title={item.title}
              selected={selected}
              onClick={handleMenuClick}
              open={open}
            />
          ))}
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
}

function Option({ icon: Icon, title, selected, onClick, open, notifs }: OptionProps) {
  const isSelected = selected === title;

  return (
    <button
      type="button"
      onClick={() => onClick(title)}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? 'border-l-2 border-[#EA002C] bg-[#FFEAD6] text-gray-900 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && <span className="whitespace-nowrap text-label-1">{title}</span>}

      {notifs !== undefined && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE200] text-label-3 text-gray-900">
          {notifs}
        </span>
      )}
    </button>
  );
}

function TitleSection({ open }: TitleSectionProps) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex items-center gap-3 p-2">
        <Logo />

        {open && (
          <span className="whitespace-nowrap text-subtitle-2 text-gray-900">
            chipScheduler
          </span>
        )}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
      <svg
        width="20"
        height="auto"
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-white"
      >
        <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
        <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
      </svg>
    </div>
  );
}

function ToggleClose({ open, setOpen }: ToggleCloseProps) {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>

        {open && <span className="whitespace-nowrap text-label-1 text-gray-600">Hide</span>}
      </div>
    </button>
  );
}