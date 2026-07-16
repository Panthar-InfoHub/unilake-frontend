"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole } from "@/app/types/auth";

// ── LoadingScreen ──────────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#B096FF] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg
                    className="animate-spin h-10 w-10 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-white font-bold text-lg">Loading your storybook…</p>
            </div>
        </div>
    );
}

// ── RoleBadge ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${
                role === UserRole.ADMIN
                    ? "bg-[#FFAF00] border-[#3F3C95] text-[#3F3C95]"
                    : "bg-[#B096FF] border-[#3F3C95] text-white"
            }`}
        >
            {role}
        </span>
    );
}

// ── DashboardPage ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user, loading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (user && user.email === "devranjeetq@gmail.com") {
            router.replace("/admin/dashboard");
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading) return <LoadingScreen />;
    if (!user) return null;

    return (
        <main className="min-h-screen bg-[#B096FF] relative overflow-hidden font-poppins" role="main">
            {/* Header */}
            <header className="w-full bg-white border-b-[3px] border-[#3F3C95] px-6 py-4 flex items-center justify-between shadow-[0_4px_0px_0px_#3F3C95] z-10 relative">
                <Image
                    src="/assets/login_page/UnilakeLogo.png"
                    alt="UniLake"
                    width={140}
                    height={42}
                    style={{ height: "auto" }}
                    priority
                />
                <div className="flex items-center gap-4">
                    {user.role === UserRole.ADMIN && (
                        <button
                            onClick={() => router.push("/admin")}
                            className="px-4 py-2 text-sm font-bold bg-[#FFAF00] border-[2px] border-[#3F3C95] rounded-xl shadow-[3px_3px_0px_0px_#3F3C95] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#3F3C95] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#3F3C95] transition-all duration-150 cursor-pointer"
                        >
                            Admin Panel
                        </button>
                    )}
                    <button
                        id="btn-logout"
                        onClick={logout}
                        className="px-4 py-2 text-sm font-bold text-white bg-[#3F3C95] border-[2px] border-[#3F3C95] rounded-xl shadow-[3px_3px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all duration-150 cursor-pointer"
                        aria-label="Log out"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex items-center justify-center p-8 min-h-[calc(100vh-80px)]">
                <div className="bg-white rounded-[32px] p-10 w-full max-w-lg border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] text-center space-y-6">
                    {/* Avatar */}
                    <div className="flex justify-center">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={user.name}
                                width={80}
                                height={80}
                                className="rounded-full border-[3px] border-[#3F3C95]"
                            />
                        ) : (
                            <div
                                className="w-20 h-20 rounded-full bg-[#B096FF] border-[3px] border-[#3F3C95] flex items-center justify-center text-2xl font-black text-white"
                                aria-hidden="true"
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-[#3F3C95] uppercase tracking-wide">
                            Welcome back!
                        </h1>
                        <p className="text-xl font-bold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                        <div className="flex justify-center pt-1">
                            <RoleBadge role={user.role} />
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 font-medium">
                        Your personalized storybooks are waiting for you. Start creating magical stories!
                    </p>
                </div>
            </div>
        </main>
    );
}
