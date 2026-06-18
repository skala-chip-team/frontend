import { useState, type FormEvent } from 'react';

import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import InputBox from '@/components/common/InputBox/InputBox';
import { login } from '@apis/index';
import { useAuthStore } from '@/stores';
import { getApiErrorMessage } from '@/utils';
// 나비 배경 — 반드시 import해서 번들(빌드 시 해시 URL). '/src/...' 직접 경로는 dev에서만 동작.
import butterflyBg from '@/components/common/Sidebar/image.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.accessToken, { username: data.username, role: data.role });
      navigate('/dashboard', { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password || loginMutation.isPending) return;
    loginMutation.mutate();
  };

  return (
    <main className="flex min-h-screen bg-surface-50">
      <section className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-secondary-navy px-[5%] py-[4%] text-white lg:flex">
        <div className="absolute inset-0 opacity-100">
          <div className="absolute left-[-10%] top-[-8%] h-[42vw] w-[42vw] rounded-full bg-primary-500/35 blur-[140px]" />
          <div className="absolute bottom-[-12%] right-[-8%] h-[34vw] w-[34vw] rounded-full bg-secondary-orange/25 blur-[140px]" />
          <div className="absolute left-[34%] top-[62%] h-[22vw] w-[22vw] rounded-full bg-primary-500/12 blur-[120px]" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <img
            src={butterflyBg}
            alt="butterfly background"
            className="pointer-events-none absolute left-[54%] top-[50%] w-[82%] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.22] mix-blend-lighten contrast-125 saturate-150 animate-[butterflyFly_12s_ease-in-out_infinite]"
          />
        </div>

        <div className="relative z-10">
          <h1 className="text-[1.35rem] font-bold tracking-tight">SKALA</h1>
        </div>

        <div className="relative z-10 max-w-[42rem] translate-y-[-8%] animate-[fadeUp_0.7s_ease-out]">
          <p className="mb-5 text-[0.75rem] font-semibold tracking-[0.28em] text-primary-500">
            PRODUCTION CONTROL
          </p>

          <h2 className="mb-6 text-[3rem] font-bold leading-[1.12] tracking-[-0.04em]">
            오늘의 공정 상태를
            <br />
            가장 먼저 확인합니다.
          </h2>

          <p className="max-w-[34rem] text-[1.02rem] leading-8 text-white/58">
            생산량, 장비 상태, Queue 적체와 지연 위험을 하나의 화면에서
            확인하고 운영 판단에 필요한 신호를 빠르게 파악합니다.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/45">
          <ShieldCheck className="h-4 w-4" />
          Authorized access only
        </div>
      </section>

      <section className="relative flex min-h-screen flex-1 items-center justify-center bg-secondary-navy px-5 py-10 sm:px-[6%] lg:min-h-0 lg:bg-surface-100 lg:py-0">
        {/* 모바일: 어두운 나비 배경 */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute left-[-20%] top-[-10%] h-[80vw] w-[80vw] rounded-full bg-primary-500/30 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-15%] h-[60vw] w-[60vw] rounded-full bg-secondary-orange/20 blur-[120px]" />
          <img
            src={butterflyBg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-[64%] top-[42%] w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.42] mix-blend-lighten contrast-125 saturate-150 animate-[butterflyFly_12s_ease-in-out_infinite]"
          />
        </div>
        {/* 데스크톱: 밝은 글로우 */}
        <div className="absolute inset-0 hidden overflow-hidden lg:block">
          <div className="absolute right-[-10%] top-[10%] h-[24vw] w-[24vw] rounded-full bg-primary-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[27.5rem] animate-[fadeUp_0.6s_ease-out] lg:-translate-x-[4%]">
          {/* 모바일 전용 히어로 문구 (데스크톱은 좌측 패널에 표시) */}
          <div className="mb-8 text-center lg:hidden">
            <p className="mb-3 text-[0.8rem] font-bold tracking-tight text-white/80">SKALA</p>
            <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.28em] text-primary-400">
              PRODUCTION CONTROL
            </p>
            <h1 className="mb-3 text-[1.8rem] font-bold leading-[1.2] tracking-[-0.03em] text-white">
              오늘의 공정 상태를
              <br />
              가장 먼저 확인합니다.
            </h1>
            <p className="mx-auto max-w-[22rem] text-sm leading-6 text-white/55">
              생산량, 장비 상태, Queue 적체와 지연 위험을 하나의 화면에서 확인하고 운영 판단에
              필요한 신호를 빠르게 파악합니다.
            </p>
          </div>

          <div className="rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur sm:p-10 lg:shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-primary-500">
                Sign in
              </p>

              <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-gray-900">
                로그인
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                공정 운영 대시보드에 접근하려면 계정 정보를 입력하세요.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <InputBox
                label="이메일"
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="admin@chipscheduler.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <InputBox
                label="비밀번호"
                icon={Lock}
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {loginMutation.isError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {getApiErrorMessage(
                    loginMutation.error,
                    '로그인에 실패했습니다. 이메일·비밀번호를 확인해주세요.'
                  )}
                </p>
              ) : null}

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary-500"
                  />
                  아이디 저장
                </label>

                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="font-medium text-gray-500 transition hover:text-primary-500"
                >
                  회원가입
                </button>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="h-12 w-full rounded-2xl bg-primary-500 text-sm font-bold text-white transition duration-200 hover:bg-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginMutation.isPending ? '로그인 중…' : '로그인'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/45 lg:text-gray-400">
            © 2026 SKALA. All rights reserved.
          </p>
        </div>
      </section>

      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes butterflyFly {
            0% {
              transform:
                translate(-50%, -50%)
                rotate(-6deg)
                scale(1);
            }

            15% {
              transform:
                translate(-43%, -57%)
                rotate(4deg)
                scale(1.05);
            }

            30% {
              transform:
                translate(-58%, -46%)
                rotate(-2deg)
                scale(1.08);
            }

            45% {
              transform:
                translate(-46%, -60%)
                rotate(7deg)
                scale(1.04);
            }

            60% {
              transform:
                translate(-61%, -48%)
                rotate(-5deg)
                scale(1.1);
            }

            75% {
              transform:
                translate(-48%, -56%)
                rotate(3deg)
                scale(1.06);
            }

            90% {
              transform:
                translate(-56%, -44%)
                rotate(-4deg)
                scale(1.03);
            }

            100% {
              transform:
                translate(-50%, -50%)
                rotate(-6deg)
                scale(1);
            }
          }
        `}
      </style>
    </main>
  );
}
