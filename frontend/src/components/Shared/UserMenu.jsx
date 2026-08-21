import { useState } from "react";
import { handleLogout } from "../../utils/auth";

export default function UserMenu({ profile, isDemoMode = false }) {
  const [open, setOpen] = useState(false);
  const userName =
    profile?.nombre?.trim() ||
    profile?.email?.split("@")[0] ||
    "Usuario";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-3 rounded-full bg-white px-3 pl-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/25 transition-all dark:bg-[#1a2e1f] dark:border-[#334155]"
      >
        <span className="max-w-40 truncate text-sm font-medium text-gray-700">
          Hola, {userName}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {initial}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-lg dark:bg-[#1a2e1f] dark:border-[#334155]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#334155]">
            <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
            {profile?.email && (
              <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleLogout(isDemoMode)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span className="text-base">↪</span>
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}
