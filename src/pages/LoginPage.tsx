import { Lock, Mail, ShieldCheck } from 'lucide-react';
import InputBox from '@/components/common/InputBox/InputBox';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen overflow-hidden bg-surface-50">
      <section className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-secondary-navy px-[5%] py-[4%] text-white lg:flex">
        <div className="absolute inset-0 opacity-100">
          <div className="absolute left-[-10%] top-[-8%] h-[42vw] w-[42vw] rounded-full bg-primary-500/35 blur-[140px]" />
          <div className="absolute bottom-[-12%] right-[-8%] h-[34vw] w-[34vw] rounded-full bg-secondary-orange/25 blur-[140px]" />
          <div className="absolute left-[34%] top-[62%] h-[22vw] w-[22vw] rounded-full bg-primary-500/12 blur-[120px]" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/src/components/common/Sidebar/image.png"
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

      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface-100 px-[6%]">
        <div className="absolute inset-0">
          <div className="absolute right-[-10%] top-[10%] h-[24vw] w-[24vw] rounded-full bg-primary-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[27.5rem] translate-x-[-4%] animate-[fadeUp_0.6s_ease-out]">
          <div className="mb-8 lg:hidden">
            <h1 className="text-xl font-bold text-secondary-navy">chipScheduler</h1>
            <p className="text-sm text-gray-500">Operations Dashboard</p>
          </div>

          <div className="rounded-[2rem] border border-gray-200/80 bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
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

            <form className="space-y-5">
              <InputBox
                label="이메일"
                icon={Mail}
                type="email"
                placeholder="admin@chipscheduler.com"
              />

              <InputBox
                label="비밀번호"
                icon={Lock}
                type="password"
                placeholder="비밀번호를 입력해주세요"
              />

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
                  onClick={() => {
                    window.location.href = '/signup';
                  }}
                  className="font-medium text-gray-500 transition hover:text-primary-500"
                >
                  회원가입
                </button>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-primary-500 text-sm font-bold text-white transition duration-200 hover:bg-primary-600 active:scale-[0.99]"
              >
                로그인
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
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
