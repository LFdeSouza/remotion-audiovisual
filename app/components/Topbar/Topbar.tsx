import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "~/hooks/useAuth";
import { LinkIcon, LogOutIcon } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="flex h-14 w-full items-center justify-between px-6 text-white">
      <div className="flex items-end">
        <h1 className="text-2xl font-bold text-blue-600">
          Teleris
          <span className="text-cyan-600">On</span>
        </h1>
        <p className="ml-3 text-xs opacity-70">Laudo audiovisual</p>
      </div>
      <div className="relative">
        <button
          onClick={toggleMenu}
          className="mr-10 text-sm text-white cursor-pointer"
        >
          {user?.name}
        </button>
        <UserMenu isOpen={menuOpen} closeMenu={closeMenu} logout={logout} />
      </div>
    </div>
  );
}

function UserMenu({
  isOpen,
  closeMenu,
  logout,
}: {
  isOpen: boolean;
  closeMenu: () => void;
  logout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (ref.current && !ref.current.contains(target)) {
        closeMenu();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [closeMenu]);

  return (
    <div
      ref={ref}
      className={`${isOpen ? "absolute" : "hidden"} right-0 top-8 z-50 min-w-64 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm`}
    >
      <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-800 cursor-pointer">
        <LinkIcon className="h-4 w-4" />
        <a href="https://app.telerison.com" target="_blank">
          Ir para o Telerison
        </a>
      </button>
      <button
        className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-800 cursor-pointer"
        onClick={logout}
      >
        <LogOutIcon className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
