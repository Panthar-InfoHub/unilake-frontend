import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Users className="mx-auto h-16 w-16 text-[#914A8C]/30" />
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
          Users
        </h1>
        <p className="text-sm font-semibold text-[#914A8C]/70">
          🚧 Under construction — will be completed soon
        </p>
      </div>
    </div>
  );
}
