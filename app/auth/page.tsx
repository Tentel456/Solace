
/*"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RightBlock } from "@/components/auth/right-block";
//import { Auth } from "@/components/auth/auth"

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.assign("/dashboard");
          return;
        }

        setMessage(
          "Регистрация выполнена. Проверь почту, чтобы подтвердить адрес."
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить запрос."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center bg-zinc-950 text-white">
      <div className="relative w-full h-full">
      <RightBlock />
      </div>
      <section className="w-full h-full fixed max-w-md rounded-2xl border border-white/10 bg-black p-7 shadow-2xl sm:p-9">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← На главную
        </Link>

        <div className="mb-8 mt-8">
          <svg width="277" height="95" viewBox="0 0 277 95" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 132.814H67.2245C74.6939 132.814 80.6694 138.79 80.6694 146.259C80.6694 153.729 74.6939 159.704 67.2245 159.704H0C2.4898 193.565 30.8735 219.957 65.2326 219.957H67.7224C75.1918 219.957 81.1673 225.933 81.1673 233.402C81.1673 240.871 75.1918 246.847 67.7224 246.847H65.2326C30.8735 246.847 2.4898 273.239 0 307.1H178.767C213.126 307.1 241.51 280.708 244 246.847H176.776C169.306 246.847 163.331 240.871 163.331 233.402C163.331 225.933 169.306 219.957 176.776 219.957H244C241.51 186.096 213.126 159.704 178.767 159.704H176.278C168.808 159.704 162.833 153.729 162.833 146.259C162.833 138.79 168.808 132.814 176.278 132.814H178.767C213.126 132.814 241.51 106.422 244 72.5613H65.2326C30.8735 72.5613 2.4898 98.9531 0 132.814Z" fill="white"/>
          <path d="M424.322 132.971C422.986 121.688 417.567 112.929 408.066 106.694C398.564 100.458 386.91 97.3405 373.103 97.3405C363.007 97.3405 354.174 98.9736 346.602 102.24C339.105 105.506 333.241 109.997 329.01 115.713C324.853 121.429 322.774 127.924 322.774 135.198C322.774 141.285 324.222 146.519 327.117 150.898C330.086 155.204 333.872 158.804 338.474 161.699C343.076 164.52 347.901 166.858 352.949 168.714C357.997 170.495 362.636 171.943 366.867 173.056L390.028 179.292C395.966 180.851 402.573 183.003 409.847 185.75C417.196 188.496 424.211 192.245 430.892 196.996C437.647 201.672 443.214 207.685 447.594 215.034C451.973 222.383 454.163 231.402 454.163 242.091C454.163 254.414 450.934 265.548 444.476 275.495C438.092 285.442 428.739 293.348 416.417 299.212C404.169 305.076 389.285 308.008 371.767 308.008C355.436 308.008 341.295 305.373 329.344 300.103C317.467 294.832 308.113 287.484 301.284 278.056C294.529 268.629 290.706 257.68 289.815 245.209H318.32C319.063 253.82 321.958 260.946 327.005 266.587C332.127 272.155 338.585 276.312 346.38 279.058C354.248 281.731 362.71 283.067 371.767 283.067C382.307 283.067 391.772 281.359 400.16 277.945C408.548 274.456 415.192 269.631 420.091 263.47C424.99 257.234 427.44 249.96 427.44 241.646C427.44 234.074 425.324 227.913 421.093 223.162C416.862 218.411 411.295 214.551 404.391 211.582C397.488 208.613 390.028 206.015 382.011 203.788L353.951 195.771C336.136 190.649 322.032 183.337 311.639 173.836C301.247 164.334 296.051 151.9 296.051 136.535C296.051 123.767 299.503 112.632 306.406 103.131C313.384 93.5547 322.737 86.1316 334.465 80.8612C346.268 75.5166 359.444 72.8442 373.994 72.8442C388.691 72.8442 401.756 75.4794 413.188 80.7499C424.619 85.946 433.675 93.0722 440.356 102.128C447.111 111.185 450.674 121.466 451.046 132.971H424.322ZM534.127 307.563C518.687 307.563 505.14 303.889 493.485 296.54C481.905 289.191 472.849 278.91 466.317 265.697C459.859 252.484 456.63 237.044 456.63 219.377C456.63 201.561 459.859 186.01 466.317 172.722C472.849 159.435 481.905 149.117 493.485 141.768C505.14 134.419 518.687 130.745 534.127 130.745C549.567 130.745 563.077 134.419 574.657 141.768C586.311 149.117 595.368 159.435 601.826 172.722C608.358 186.01 611.624 201.561 611.624 219.377C611.624 237.044 608.358 252.484 601.826 265.697C595.368 278.91 586.311 289.191 574.657 296.54C563.077 303.889 549.567 307.563 534.127 307.563ZM534.127 283.958C545.855 283.958 555.505 280.951 563.077 274.939C570.649 268.926 576.253 261.02 579.89 251.222C583.528 241.423 585.346 230.808 585.346 219.377C585.346 207.945 583.528 197.293 579.89 187.42C576.253 177.547 570.649 169.567 563.077 163.48C555.505 157.394 545.855 154.35 534.127 154.35C522.398 154.35 512.748 157.394 505.177 163.48C497.605 169.567 492.001 177.547 488.363 187.42C484.726 197.293 482.907 207.945 482.907 219.377C482.907 230.808 484.726 241.423 488.363 251.222C492.001 261.02 497.605 268.926 505.177 274.939C512.748 280.951 522.398 283.958 534.127 283.958ZM646.659 75.962V304H620.382V75.962H646.659ZM713.762 308.008C702.925 308.008 693.089 305.967 684.256 301.884C675.422 297.727 668.407 291.752 663.211 283.958C658.015 276.089 655.417 266.587 655.417 255.453C655.417 245.654 657.347 237.712 661.207 231.625C665.067 225.463 670.226 220.638 676.684 217.15C683.142 213.661 690.268 211.063 698.063 209.355C705.931 207.574 713.837 206.163 721.779 205.124C732.172 203.788 740.597 202.786 747.055 202.118C753.587 201.375 758.338 200.151 761.308 198.443C764.351 196.736 765.873 193.767 765.873 189.536V188.645C765.873 177.659 762.866 169.122 756.854 163.035C750.915 156.948 741.896 153.905 729.796 153.905C717.251 153.905 707.416 156.651 700.29 162.144C693.163 167.637 688.153 173.502 685.258 179.737L660.316 170.829C664.77 160.437 670.708 152.346 678.132 146.556C685.629 140.691 693.794 136.609 702.628 134.308C711.536 131.932 720.295 130.745 728.906 130.745C734.399 130.745 740.708 131.413 747.835 132.749C755.035 134.011 761.976 136.646 768.656 140.654C775.411 144.663 781.016 150.713 785.47 158.804C789.924 166.895 792.151 177.733 792.151 191.317V304H765.873V280.84H764.537C762.755 284.551 759.786 288.523 755.629 292.754C751.472 296.985 745.942 300.585 739.038 303.555C732.135 306.524 723.709 308.008 713.762 308.008ZM717.771 284.403C728.163 284.403 736.923 282.362 744.049 278.279C751.249 274.196 756.668 268.926 760.305 262.468C764.017 256.01 765.873 249.217 765.873 242.091V218.04C764.759 219.377 762.31 220.601 758.524 221.715C754.812 222.754 750.507 223.682 745.608 224.498C740.783 225.241 736.069 225.909 731.467 226.503C726.939 227.022 723.264 227.468 720.443 227.839C713.614 228.73 707.23 230.177 701.292 232.181C695.427 234.111 690.677 237.044 687.039 240.978C683.476 244.838 681.695 250.108 681.695 256.789C681.695 265.919 685.072 272.823 691.827 277.499C698.656 282.102 707.304 284.403 717.771 284.403ZM878.238 307.563C862.204 307.563 848.397 303.777 836.817 296.206C825.237 288.634 816.329 278.205 810.094 264.917C803.859 251.63 800.741 236.45 800.741 219.377C800.741 202.006 803.933 186.678 810.317 173.39C816.775 160.029 825.757 149.599 837.263 142.102C848.843 134.53 862.353 130.745 877.793 130.745C889.818 130.745 900.656 132.971 910.306 137.425C919.956 141.879 927.862 148.115 934.023 156.132C940.184 164.149 944.007 173.502 945.492 184.191H919.214C917.21 176.397 912.756 169.493 905.852 163.48C899.023 157.394 889.818 154.35 878.238 154.35C867.994 154.35 859.012 157.022 851.292 162.367C843.647 167.637 837.671 175.098 833.366 184.748C829.134 194.324 827.019 205.57 827.019 218.486C827.019 231.699 829.097 243.205 833.254 253.003C837.485 262.802 843.424 270.41 851.07 275.829C858.79 281.248 867.846 283.958 878.238 283.958C885.068 283.958 891.266 282.77 896.833 280.395C902.401 278.019 907.114 274.604 910.974 270.151C914.834 265.697 917.581 260.352 919.214 254.117H945.492C944.007 264.212 940.333 273.305 934.468 281.397C928.678 289.414 920.995 295.797 911.42 300.548C901.918 305.225 890.858 307.563 878.238 307.563ZM1024.26 307.563C1007.78 307.563 993.564 303.926 981.612 296.651C969.736 289.302 960.568 279.058 954.11 265.919C947.726 252.706 944.534 237.34 944.534 219.822C944.534 202.303 947.726 186.863 954.11 173.502C960.568 160.066 969.55 149.599 981.056 142.102C992.636 134.53 1006.15 130.745 1021.59 130.745C1030.49 130.745 1039.29 132.229 1047.98 135.198C1056.66 138.168 1064.57 142.993 1071.69 149.673C1078.82 156.28 1084.5 165.039 1088.73 175.951C1092.96 186.863 1095.07 200.299 1095.07 216.259V227.393H963.24V204.679H1068.35C1068.35 195.029 1066.42 186.418 1062.56 178.846C1058.78 171.275 1053.36 165.299 1046.3 160.919C1039.33 156.54 1031.09 154.35 1021.59 154.35C1011.12 154.35 1002.06 156.948 994.417 162.144C986.846 167.266 981.019 173.947 976.936 182.187C972.853 190.426 970.812 199.26 970.812 208.687V223.83C970.812 236.747 973.039 247.696 977.493 256.678C982.021 265.585 988.293 272.378 996.31 277.054C1004.33 281.656 1013.64 283.958 1024.26 283.958C1031.16 283.958 1037.4 282.993 1042.96 281.063C1048.61 279.058 1053.47 276.089 1057.55 272.155C1061.63 268.146 1064.79 263.173 1067.02 257.234L1092.4 264.361C1089.73 272.971 1085.24 280.543 1078.93 287.075C1072.62 293.533 1064.83 298.581 1055.55 302.218C1046.27 305.782 1035.84 307.563 1024.26 307.563Z" fill="white"/>
          </svg>


          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {mode === "login" ? "С возвращением" : "Создать аккаунт"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {mode === "login"
              ? "Войди, чтобы продолжить работу со своими лекциями."
              : "Создай аккаунт, чтобы загружать и изучать видеолекции."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-zinc-300">
              Электронная почта
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-white/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-zinc-300">
              Пароль
            </label>

            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Не менее 8 символов"
              className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-white/30"
            />
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
            className="font-medium text-white underline underline-offset-4"
          >
            {mode === "login" ? "Регистрация" : "Войти"}
          </button>
        </p>
      </section>
    </main>
  );
}
*/



"use client";

import { GrainGradient, LiquidMetal } from "@paper-design/shaders-react";
import { createClient } from "@/lib/supabase/client";
import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";

type AuthMode = "login" | "register";
type MessageType = "success" | "error";

const inputClassName =
  "h-14 w-full min-w-0 rounded-[10px] border border-white/15 bg-white/5 px-5 text-base text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("success");
  const [updatesOptOut, setUpdatesOptOut] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
    setPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    if (mode === "register" && !acceptedTerms) {
      setMessageType("error");
      setMessage(
        "Пожалуйста, подтверди согласие с условиями использования.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              email_updates_opt_out: updatesOptOut,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.assign("/dashboard");
          return;
        }

        setMessageType("success");
        setMessage(
          "Регистрация выполнена. Проверь почту, чтобы подтвердить адрес.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      window.location.assign("/dashboard");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить запрос. Попробуй ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  }

  function showOAuthPlaceholder(provider: "Google" | "Apple") {
    setMessageType("error");
    setMessage(
      `Вход через ${provider} пока не настроен. Используй электронную почту.`,
    );
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#050505] p-3 text-white antialiased [font-synthesis:none]">
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[0.94fr_1.06fr] lg:grid-cols-2 lg:gap-6 lg:overflow-hidden">
        {/* Authentication form */}
        <section className="flex min-h-0 items-start overflow-y-auto rounded-md border border-white/10 bg-[#0a0a0a] px-6 py-8 sm:px-10 sm:py-10 lg:h-full lg:px-10 lg:py-8 xl:px-14">
          <div className="mx-auto w-full max-w-[590px]">
            <Link
              href="/"
              className="inline-flex text-sm text-white/50 transition-colors hover:text-white"
            >
              ← На главную
            </Link>

            <div className="mt-8">
              <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                {mode === "login" ? "С возвращением" : "Создать аккаунт"}
              </h1>

              <p className="mt-3 text-base leading-relaxed text-white/55 sm:text-lg">
                {mode === "login"
                  ? "Войди, чтобы продолжить работу со своими лекциями."
                  : "Создай аккаунт, чтобы загружать и изучать видеолекции."}
              </p>
            </div>

            {/* OAuth placeholders */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <SocialButton
                icon={<GoogleIcon />}
                label="Google"
                onClick={() => showOAuthPlaceholder("Google")}
              />

              <SocialButton
                icon={<AppleIcon />}
                label="Apple"
                onClick={() => showOAuthPlaceholder("Apple")}
              />
            </div>

            <div className="my-8 flex items-center gap-4 text-sm text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              <span>или через электронную почту</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="text-sm text-white/65"
                    >
                      Имя
                    </label>
                    <input
                      id="firstName"
                      name="given-name"
                      type="text"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Твоё имя"
                      disabled={loading}
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="text-sm text-white/65"
                    >
                      Фамилия
                    </label>
                    <input
                      id="lastName"
                      name="family-name"
                      type="text"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Твоя фамилия"
                      disabled={loading}
                      className={inputClassName}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-white/65">
                  Электронная почта
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-white/65">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    mode === "login"
                      ? "Введи пароль"
                      : "Не менее 8 символов"
                  }
                  disabled={loading}
                  className={inputClassName}
                />
              </div>

              {mode === "register" && (
                <div className="space-y-4 pt-2 text-sm leading-5 text-white/55">
                  <CheckboxLine
                    checked={updatesOptOut}
                    onChange={setUpdatesOptOut}
                  >
                    Не отправлять мне письма об обновлениях и новых функциях
                    Solace.
                  </CheckboxLine>

                  <CheckboxLine
                    checked={acceptedTerms}
                    onChange={setAcceptedTerms}
                  >
                    Я соглашаюсь с условиями использования и политикой
                    конфиденциальности.
                  </CheckboxLine>
                </div>
              )}

              {message && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`rounded-[10px] border p-3 text-sm leading-relaxed ${
                    messageType === "error"
                      ? "border-red-500/25 bg-red-500/5 text-red-300"
                      : "border-emerald-500/25 bg-emerald-500/5 text-emerald-300"
                  }`}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-[10px] border border-white/40 bg-white px-4 text-base font-medium text-black transition-colors hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Подождите..."
                  : mode === "login"
                    ? "Войти"
                    : "Создать аккаунт"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              {mode === "login"
                ? "Ещё нет аккаунта?"
                : "Уже есть аккаунт?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-65 disabled:opacity-40"
              >
                {mode === "login" ? "Регистрация" : "Войти"}
              </button>
            </p>
          </div>
        </section>

        {/* Visual panel */}
        <section className="relative isolate flex min-h-[420px] overflow-hidden rounded-md bg-black p-6 text-white sm:min-h-[480px] sm:p-8 lg:h-full lg:min-h-0">
          {/* Background shader */}
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="blob"
            frame={2854.5}
            colors={["#757575", "#9e9e9e", "#212121"]}
            colorBack="#0e0d16"
            className="absolute inset-0 z-0 h-full w-full"
          />

          {/* Centered LiquidMetal layer */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <LiquidMetal
                width={1280}
                height={720}
                image="/auth/Logo.svg"
                colorBack="#00000000"
                colorTint="#ffffff"
                shape={undefined}
                repetition={2}
                softness={0.1}
                shiftRed={0.3}
                shiftBlue={0.3}
                distortion={0.36}
                contour={0.38}
                angle={70}
                speed={1}
                scale={0.6}
                fit="contain"
              />
            </div>
          </div>

          {/* Foreground content */}
          <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col justify-end">
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              aria-disabled="true"
              className="inline-flex h-12 max-w-full cursor-default items-center gap-3 self-start rounded-[10px] border border-white/25 px-5 text-base font-medium text-white/60 backdrop-blur-sm xl:px-6 xl:text-lg"
            >
              <WindowsIcon className="size-5 shrink-0" />
              <span className="truncate whitespace-nowrap">
                Windows app — скоро
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-white/5 px-3 text-sm text-white transition-colors hover:bg-white/10"
    >
      <span className="shrink-0">{icon}</span>
      <span>Продолжить с {label}</span>
    </button>
  );
}

function CheckboxLine({
  children,
  checked,
  onChange,
}: {
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer size-full cursor-pointer appearance-none rounded-[3px] border border-white/30 bg-white/5 checked:border-white checked:bg-white"
        />

        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-black peer-checked:block"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span>{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EB4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 12.54c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.58 1.1-.95 0-2.42-1.07-3.98-1.04-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.16 1.53 12.15 1.01 1.46 2.22 3.1 3.81 3.04 1.53-.06 2.11-.99 3.96-.99s2.37.99 3.99.96c1.65-.03 2.69-1.49 3.69-2.96 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.2-1.23-3.24-4.87ZM14.03 3.66c.84-1.02 1.41-2.43 1.25-3.84-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.71Z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4.7 10.7 3.6v7.7H3V4.7Zm8.8-1.25L21 2.1v9.2h-9.2V3.45ZM3 12.7h7.7v7.7L3 19.3v-6.6Zm8.8 0H21v9.2l-9.2-1.3v-7.9Z" />
    </svg>
  );
}
