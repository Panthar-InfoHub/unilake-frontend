"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/hooks/useAuth";
import { 
    LayoutDashboard, 
    BookOpen, 
    Users, 
    Settings, 
    LogOut, 
    Shield, 
    Activity, 
    Database 
} from "lucide-react";

const ADMIN_EMAIL = "devranjeetq@gmail.com";

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
                <p className="text-[#FFAF00] font-bold text-lg">Loading Admin Session…</p>
            </div>
        </div>
    );
}

// ── AdminDashboardPage ─────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { user, loading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            router.replace("/admin/login");
            return;
        }
        if (user && user.email !== ADMIN_EMAIL) {
            router.replace("/");
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated || !user || user.email !== ADMIN_EMAIL) {
        return null;
    }

    async function handleLogout() {
        setIsSigningOut(true);
        try {
            await logout("/admin/login");
        } catch {
            setIsSigningOut(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F8E7D2] font-poppins flex text-[#3F3C95] select-none">
            {/* ── Sidebar Placeholder ── */}
            <aside 
                className="w-64 bg-white border-r-[3px] border-[#3F3C95] flex flex-col justify-between h-screen fixed left-0 top-0 z-20"
                aria-label="Admin navigation"
            >
                <div>
                    {/* Logo Section */}
                    <div className="p-6 border-b-[3px] border-[#3F3C95] flex flex-col items-start gap-1">
                        <Image
                            src="/assets/login_page/UnilakeLogo.png"
                            alt="UniLake"
                            width={140}
                            height={42}
                            style={{ height: "auto" }}
                            priority
                        />
                        <span className="text-[10px] font-black text-white bg-[#3F3C95] border-2 border-white px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_#FFAF00] uppercase tracking-widest mt-1">
                            Console
                        </span>
                    </div>

                    {/* Navigation Items (Placeholders) */}
                    <nav className="p-4 space-y-2">
                        <div 
                            className="flex items-center gap-3 px-4 py-3 bg-[#FFAF00] border-[2px] border-[#3F3C95] rounded-xl shadow-[3px_3px_0px_0px_#3F3C95] font-black text-sm transition-all cursor-pointer"
                        >
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </div>
                        
                        <div 
                            className="flex items-center gap-3 px-4 py-3 text-gray-400 border-[2px] border-transparent font-bold text-sm cursor-not-allowed hover:bg-gray-50 hover:rounded-xl transition-all"
                            title="Stories feature is coming soon"
                        >
                            <BookOpen size={20} />
                            <span>Stories (Soon)</span>
                        </div>

                        <div 
                            className="flex items-center gap-3 px-4 py-3 text-gray-400 border-[2px] border-transparent font-bold text-sm cursor-not-allowed hover:bg-gray-50 hover:rounded-xl transition-all"
                            title="Users feature is coming soon"
                        >
                            <Users size={20} />
                            <span>Users (Soon)</span>
                        </div>

                        <div 
                            className="flex items-center gap-3 px-4 py-3 text-gray-400 border-[2px] border-transparent font-bold text-sm cursor-not-allowed hover:bg-gray-50 hover:rounded-xl transition-all"
                            title="Settings feature is coming soon"
                        >
                            <Settings size={20} />
                            <span>Settings (Soon)</span>
                        </div>
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t-[3px] border-[#3F3C95]">
                    <button
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-[2px] border-[#3F3C95] hover:bg-red-100 hover:text-red-700 rounded-xl shadow-[3px_3px_0px_0px_#3F3C95] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#3F3C95] disabled:opacity-75 transition-all font-bold text-sm cursor-pointer"
                    >
                        <LogOut size={18} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Layout Wrapper ── */}
            <div className="flex-1 pl-64 flex flex-col min-h-screen">
                {/* ── Top Navigation Placeholder ── */}
                <header 
                    className="h-20 bg-[#FFAF00] border-b-[3px] border-[#3F3C95] flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10 shadow-[0_4px_0px_0px_rgba(63,60,149,0.15)]"
                >
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-lg">
                        <Shield size={22} className="text-[#3F3C95]" />
                        <span>Admin Console</span>
                    </div>

                    {/* Quick profile info */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none">{user.name}</p>
                            <p className="text-[10px] font-semibold text-[#3F3C95]/80 leading-none mt-1">
                                {user.email}
                            </p>
                        </div>
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-[#3F3C95]"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-white border-2 border-[#3F3C95] rounded-full flex items-center justify-center font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </header>

                {/* ── Main Scrollable Content ── */}
                <main className="pt-28 p-8 flex-1 flex flex-col gap-6">
                    {/* Welcome Card */}
                    <section 
                        className="bg-white border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] rounded-[24px] p-8 max-w-4xl"
                        role="region"
                        aria-label="Welcome area"
                    >
                        <h1 className="text-2xl font-black uppercase tracking-wide">
                            Welcome to the Dashboard!
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 mt-1">
                            You are logged in as the Administrator of UniLake. Use the console to manage resources.
                        </p>

                        <hr className="my-6 border-[#3F3C95]/20" />

                        {/* User Profile Section */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name}
                                    width={80}
                                    height={80}
                                    className="rounded-full border-[3px] border-[#3F3C95] shadow-[4px_4px_0px_0px_#3F3C95]"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-[#FFAF00] border-[3px] border-[#3F3C95] rounded-full flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_#3F3C95]">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="space-y-2 text-center sm:text-left flex-1">
                                <h2 className="text-xl font-bold">{user.name}</h2>
                                <p className="text-sm text-gray-500 font-semibold">{user.email}</p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 bg-[#FFAF00] border-[#3F3C95] text-[#3F3C95] shadow-[2px_2px_0px_0px_#3F3C95]">
                                        Administrator
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 bg-green-100 border-green-500 text-green-700">
                                        Session Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stats & Status Placeholder Widgets */}
                    <section 
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
                        aria-label="Overview metrics"
                    >
                        {/* Widget 1: System Status */}
                        <div className="bg-white border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] rounded-[24px] p-6 flex flex-col justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 border-2 border-[#3F3C95] rounded-xl text-green-700">
                                    <Activity size={20} />
                                </div>
                                <h3 className="font-bold text-sm uppercase">Auth Provider</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-black">Better Auth</p>
                                <p className="text-xs text-gray-400 font-semibold mt-1">Production cookies enabled</p>
                            </div>
                        </div>

                        {/* Widget 2: Security Scope */}
                        <div className="bg-white border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] rounded-[24px] p-6 flex flex-col justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#FFAF00] border-2 border-[#3F3C95] rounded-xl text-[#3F3C95]">
                                    <Shield size={20} />
                                </div>
                                <h3 className="font-bold text-sm uppercase">Access Guard</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-black">Active</p>
                                <p className="text-xs text-gray-400 font-semibold mt-1">devranjeetq@gmail.com only</p>
                            </div>
                        </div>

                        {/* Widget 3: RBAC Status */}
                        <div className="bg-white border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] rounded-[24px] p-6 flex flex-col justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 border-2 border-[#3F3C95] rounded-xl text-blue-700">
                                    <Database size={20} />
                                </div>
                                <h3 className="font-bold text-sm uppercase">Verification Mode</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-black">Frontend-Enforced</p>
                                <p className="text-xs text-gray-400 font-semibold mt-1">Bypasses database role query</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
