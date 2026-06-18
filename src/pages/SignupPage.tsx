import { useState, type FormEvent } from 'react';

import { Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import InputBox from '@/components/common/InputBox/InputBox';
import { login, signup } from '@apis/index';
import { useAuthStore } from '@/stores';
import { getApiErrorMessage } from '@/utils';
// 나비 배경 — import해서 번들(빌드 시 해시 URL). '/src/...' 직접 경로는 dev에서만 동작.
import butterflyBg from '@/components/common/Sidebar/image.png';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const signupMutation = useMutation({
    // 가입 후 응답엔 토큰이 없으므로, 같은 계정으로 바로 로그인까지 진행한다.
    mutationFn: async () => {
      await signup({ username, email, password });
      return login({ email, password });
    },
    onSuccess: (loginData) => {
      setAuth(loginData.accessToken, { username: loginData.username, role: loginData.role });
      navigate('/dashboard', { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!username || !email || !password) return;
    if (password !== confirm) {
      setValidationError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setValidationError(null);
    if (!signupMutation.isPending) signupMutation.mutate();
  };

  const errorMessage = validationError
    ? validationError
    : signupMutation.isError
      ? getApiErrorMessage(signupMutation.error, '회원가입에 실패했습니다. 입력값을 확인해주세요.')
      : null;

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
          <h1 className="text-[1.35rem] font-bold tracking-tight">
            SKALA
          </h1>
        </div>

        <div className="relative z-10 max-w-[42rem] translate-y-[-8%] animate-[fadeUp_0.7s_ease-out]">
          <p className="mb-5 text-[0.75rem] font-semibold tracking-[0.28em] text-primary-500">
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

      <section className="relative flex min-h-screen flex-1 items-center justify-center bg-secondary-navy px-5 py-10 sm:px-[6%] lg:min-h-0 lg:bg-surface-100 lg:py-0">
        {/* 모바일: 어두운 나비 배경 */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute left-[-20%] top-[-10%] h-[80vw] w-[80vw] rounded-full bg-primary-500/30 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-15%] h-[60vw] w-[60vw] rounded-full bg-secondary-orange/20 blur-[120px]" />
          <img
            src={butterflyBg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 w-[175%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.32] mix-blend-lighten contrast-125 saturate-150 animate-[butterflyFly_12s_ease-in-out_infinite]"
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
              ACCOUNT REGISTRATION
            </p>
            <h1 className="mb-3 text-[1.8rem] font-bold leading-[1.2] tracking-[-0.03em] text-white">
              운영 계정을 등록하고,
              <br />
              대시보드 접근을 시작합니다.
            </h1>
            <p className="mx-auto max-w-[22rem] text-sm leading-6 text-white/55">
              공정 운영 현황과 장비 상태를 확인할 수 있도록 관리자 계정을 생성합니다.
            </p>
          </div>

          <div className="rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur sm:p-10 lg:shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-primary-500">
                Create account
              </p>

              <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-gray-900">
                회원가입
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                관리자 계정 생성을 위해 정보를 입력하세요.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <InputBox
                label="이름"
                icon={User}
                type="text"
                autoComplete="username"
                placeholder="이름을 입력해주세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

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
                autoComplete="new-password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <InputBox
                label="비밀번호 확인"
                icon={Lock}
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="h-12 w-full rounded-2xl bg-primary-500 text-sm font-bold text-white transition duration-200 hover:bg-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signupMutation.isPending ? '가입 중…' : '회원가입'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/45 lg:text-gray-400">
            이미 계정이 있으신가요?

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="
                ml-2
                font-semibold
                text-primary-500
                transition
                hover:text-primary-600
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
