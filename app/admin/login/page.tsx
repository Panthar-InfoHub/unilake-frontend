"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/hooks/useAuth";

type OAuthProvider = "Google" | "Facebook";

interface LoginState {
    redirectingTo: OAuthProvider | null;
    error: string | null;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// ── Google Icon ────────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
    );
}

// ── Facebook Icon ──────────────────────────────────────────────────────────────
function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

// ── SocialButton ───────────────────────────────────────────────────────────────
interface SocialButtonProps {
    provider: OAuthProvider;
    isRedirecting: boolean;
    redirectingTo: OAuthProvider | null;
    onClick: (provider: OAuthProvider) => void;
}

function SocialButton({ provider, isRedirecting, redirectingTo, onClick }: SocialButtonProps) {
    const isThisLoading = redirectingTo === provider;
    const isDisabled = isRedirecting;

    const baseClass =
        "w-full h-12 rounded-xl border-[3px] border-[#3F3C95] flex items-center justify-center gap-3 font-bold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFAF00] focus-visible:ring-offset-2";

    const googleClass = `${baseClass} bg-white text-gray-800 shadow-[3px_3px_0px_0px_#3F3C95]
        ${!isDisabled
            ? "cursor-pointer hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#3F3C95]"
            : "cursor-not-allowed opacity-70"
        }`;

    const facebookClass = `${baseClass} bg-[#1877F2] text-white shadow-[3px_3px_0px_0px_#3F3C95]
        ${!isDisabled
            ? "cursor-pointer hover:bg-[#166fe5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#3F3C95]"
            : "cursor-not-allowed opacity-70"
        }`;

    return (
        <button
            id={`btn-admin-login-${provider.toLowerCase()}`}
            type="button"
            onClick={() => onClick(provider)}
            disabled={isDisabled}
            aria-label={`Continue with ${provider}`}
            aria-busy={isThisLoading}
            aria-disabled={isDisabled}
            className={provider === "Google" ? googleClass : facebookClass}
        >
            {isThisLoading ? (
                <Spinner />
            ) : provider === "Google" ? (
                <GoogleIcon />
            ) : (
                <FacebookIcon />
            )}
            <span>
                {isThisLoading ? `Redirecting to ${provider}…` : `Continue with ${provider}`}
            </span>
        </button>
    );
}

// ── LoadingScreen ──────────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#3F3C95] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg
                    className="animate-spin h-10 w-10 text-[#FFAF00]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-[#FFAF00] font-bold text-lg">Checking authentication status…</p>
            </div>
        </div>
    );
}

// ── AdminLoginPage ────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
    const { user, loading, isAuthenticated, login, loginWithEmail } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [state, setState] = useState<LoginState>({
        redirectingTo: null,
        error: null,
    });

    const isRedirecting = state.redirectingTo !== null || isSubmitting;

    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            if (user.email === "devranjeetq@gmail.com") {
                router.replace("/admin/dashboard");
            } else {
                router.replace("/");
            }
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return null;
    }

    // Google/Facebook Social Login
    async function handleSocialLogin(provider: OAuthProvider): Promise<void> {
        if (isRedirecting) return;

        setState({ redirectingTo: provider, error: null });

        try {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const callbackURL = `${origin}/admin/login`;
            await login(provider, callbackURL);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unable to initiate social login. Please try again.";
            setState({
                redirectingTo: null,
                error: errorMessage,
            });
        }
    }

    // Email/Password Login
    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        if (isRedirecting) return;
        if (!email.trim() || !password.trim()) {
            setState({ redirectingTo: null, error: "Please enter both email and password." });
            return;
        }

        setIsSubmitting(true);
        setState({ redirectingTo: null, error: null });

        try {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const callbackURL = `${origin}/admin/login`;
            await loginWithEmail(email, password, callbackURL);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Invalid email or password. Please try again.";
            setState({
                redirectingTo: null,
                error: errorMessage,
            });
            setIsSubmitting(false);
        }
    }

    return (
        <main
            className="min-h-screen flex flex-col bg-[#3F3C95] relative overflow-hidden font-poppins select-none"
            role="main"
        >
            {/* Top Banner */}
            <div
                className="w-full bg-[#FFAF00] pt-6 pb-2 text-center text-xs sm:text-sm md:text-base font-extrabold text-[#3F3C95] tracking-wide px-4 z-10 uppercase border-b-[3px] border-white shadow-[0_4px_0px_0px_rgba(255,255,255,0.1)]"
                aria-label="System status banner"
            >
                UniLake Admin Portal - Security & Management Interface
            </div>

            {/* SVG Wave Divider */}
            <div className="w-full h-8 relative z-10 bg-[#3F3C95]">
                <div
                    className="absolute top-0 left-0 w-full h-8"
                    aria-hidden="true"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 20' width='60' height='20'%3E%3Cpath d='M 0 0 L 60 0 C 45 20, 15 20, 0 0 Z' fill='%23ffaf00'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "repeat-x",
                        backgroundSize: "60px 100%",
                    }}
                />
            </div>

            {/* Comic Decorations */}
            <div
                className="absolute left-0 top-[40%] -translate-y-1/2 w-[80px] sm:w-[120px] md:w-[150px] lg:w-[190px] z-0 pointer-events-none opacity-40"
                aria-hidden="true"
            >
                <Image
                    src="/assets/login_page/loginAnimation.png"
                    alt=""
                    width={200}
                    height={200}
                    style={{ width: "100%", height: "auto" }}
                    priority
                />
            </div>

            <div
                className="absolute right-0 bottom-0 w-[100px] sm:w-[140px] md:w-[180px] lg:w-[250px] z-0 pointer-events-none opacity-40"
                aria-hidden="true"
            >
                <Image
                    src="/assets/login_page/loginAnimation2.png"
                    alt=""
                    width={250}
                    height={250}
                    style={{ width: "100%", height: "auto" }}
                    priority
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6 z-10">
                <div
                    className="bg-white rounded-[32px] p-8 md:p-10 w-[95%] max-w-[460px] border-[3px] border-[#FFAF00] shadow-[6px_6px_0px_0px_#FFAF00]"
                    role="region"
                    aria-label="Admin Login options"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="flex flex-col items-center gap-2">
                            <Image
                                src="/assets/login_page/UnilakeLogo.png"
                                alt="UniLake"
                                width={180}
                                height={54}
                                style={{ width: "180px", height: "auto" }}
                                priority
                            />
                            <span className="text-[#3F3C95] font-black text-[10px] uppercase tracking-widest bg-[#FFAF00] border-2 border-[#3F3C95] px-3 py-0.5 rounded-full shadow-[2px_2px_0px_0px_#3F3C95]">
                                Admin Portal
                            </span>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center space-y-1 mb-6">
                        <h1 className="text-xl font-black text-[#3F3C95] tracking-wide uppercase">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 text-xs font-semibold">
                            Enter credentials or authenticate with OAuth to continue.
                        </p>
                    </div>

                    {/* Error Message */}
                    {state.error && (
                        <div
                            role="alert"
                            className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-semibold text-center"
                        >
                            {state.error}
                        </div>
                    )}

                    {/* Email/Password Login Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#3F3C95] uppercase tracking-wider block">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isRedirecting}
                                placeholder="name@domain.com"
                                className="w-full h-12 rounded-xl border-[3px] border-[#3F3C95] px-4 font-semibold text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAF00] disabled:opacity-60 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#3F3C95] uppercase tracking-wider block">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isRedirecting}
                                placeholder="••••••••"
                                className="w-full h-12 rounded-xl border-[3px] border-[#3F3C95] px-4 font-semibold text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAF00] disabled:opacity-60 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isRedirecting}
                            className="w-full h-12 bg-[#FFAF00] text-[#3F3C95] font-black border-[3px] border-[#3F3C95] rounded-xl shadow-[3px_3px_0px_0px_#3F3C95] hover:bg-[#ffba24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#3F3C95] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner />
                                    <span>Signing In…</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-[2px] bg-gray-200" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            or continue with
                        </span>
                        <div className="flex-1 h-[2px] bg-gray-200" />
                    </div>

                    {/* Social Auth Buttons */}
                    <div className="flex flex-col gap-3" role="group" aria-label="OAuth options">
                        <SocialButton
                            provider="Google"
                            isRedirecting={isRedirecting}
                            redirectingTo={state.redirectingTo}
                            onClick={handleSocialLogin}
                        />
                        <SocialButton
                            provider="Facebook"
                            isRedirecting={isRedirecting}
                            redirectingTo={state.redirectingTo}
                            onClick={handleSocialLogin}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
