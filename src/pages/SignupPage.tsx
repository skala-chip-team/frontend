import { Lock, Mail, ShieldCheck, User } from 'lucide-react';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen overflow-hidden bg-[#F3F5F7]">
      <section className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-[#081028] px-[5%] py-[4%] text-white lg:flex">
        <div className="absolute inset-0 opacity-100">
          <div className="absolute left-[-10%] top-[-8%] h-[42vw] w-[42vw] rounded-full bg-[#EA002C]/35 blur-[140px]" />
          <div className="absolute bottom-[-12%] right-[-8%] h-[34vw] w-[34vw] rounded-full bg-orange-500/25 blur-[140px]" />
          <div className="absolute left-[34%] top-[62%] h-[22vw] w-[22vw] rounded-full bg-[#EA002C]/12 blur-[120px]" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/src/components/common/Sidebar/image.png"
            alt="butterfly background"
            className="
              pointer-events-none
              absolute
              left-[54%]
              top-[50%]
              w-[82%]
              -translate-x-1/2
              -translate-y-1/2
              select-none
              opacity-[0.22]
              mix-blend-lighten
              contrast-125
              saturate-150
              animate-[butterflyFly_12s_ease-in-out_infinite]
            "
          />
        </div>

        <div className="relative z-10">
          <h1 className="text-[1.35rem] font-bold tracking-tight">
            SKALA
          </h1>
        </div>

        <div className="relative z-10 max-w-[42rem] translate-y-[-8%] animate-[fadeUp_0.7s_ease-out]">
          <p className="mb-5 text-[0.75rem] font-semibold tracking-[0.28em] text-[#EA002C]">
            ACCOUNT REGISTRATION
          </p>

          <h2 className="mb-6 text-[3rem] font-bold leading-[1.12] tracking-[-0.04em]">
            운영 계정을 등록하고,
            <br />
            대시보드 접근을 시작합니다.
          </h2>

          <p className="max-w-[34rem] text-[1.02rem] leading-8 text-white/58">
            공정 운영 현황과 장비 상태를 확인할 수 있도록 관리자 계정을
            생성합니다.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/45">
          <ShieldCheck className="h-4 w-4" />
          Authorized access only
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#F7F8FA] px-[6%]">
        <div className="absolute inset-0">
          <div className="absolute right-[-10%] top-[10%] h-[24vw] w-[24vw] rounded-full bg-[#EA002C]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[27.5rem] translate-x-[-4%] animate-[fadeUp_0.6s_ease-out]">
          <div className="rounded-[2rem] border border-gray-200/80 bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-[#EA002C]">
                Create account
              </p>

              <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-gray-900">
                회원가입
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                관리자 계정 생성을 위해 정보를 입력하세요.
              </p>
            </div>

            <form className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  이름
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 transition duration-200 focus-within:border-[#EA002C] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,0,44,0.08)]">
                  <User className="h-4 w-4 text-gray-400" />

                  <input
                    type="text"
                    placeholder="이름을 입력해주세요"
                    className="h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  이메일
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 transition duration-200 focus-within:border-[#EA002C] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,0,44,0.08)]">
                  <Mail className="h-4 w-4 text-gray-400" />

                  <input
                    type="email"
                    placeholder="admin@chipscheduler.com"
                    className="h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  비밀번호
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 transition duration-200 focus-within:border-[#EA002C] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,0,44,0.08)]">
                  <Lock className="h-4 w-4 text-gray-400" />

                  <input
                    type="password"
                    placeholder="비밀번호를 입력해주세요"
                    className="h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  비밀번호 확인
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 transition duration-200 focus-within:border-[#EA002C] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,0,44,0.08)]">
                  <Lock className="h-4 w-4 text-gray-400" />

                  <input
                    type="password"
                    placeholder="비밀번호를 다시 입력해주세요"
                    className="h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-[#EA002C] text-sm font-bold text-white transition duration-200 hover:bg-[#d60028] active:scale-[0.99]"
              >
                회원가입
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            이미 계정이 있으신가요?

            <button
              type="button"
              onClick={() => {
                window.location.href = '/login';
              }}
              className="
                ml-2
                font-semibold
                text-[#EA002C]
                transition
                hover:text-[#d60028]
              "
            >
              로그인
            </button>
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