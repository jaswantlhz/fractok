import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCoins, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/assets", label: "Assets" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/tokenize", label: "Tokenize" },
  { to: "/wallet", label: "Wallet" },
];

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { connected, hederaAccountId, hbarBalance, connectWallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const shortId = hederaAccountId
    ? hederaAccountId.length > 12
      ? `${hederaAccountId.slice(0, 8)}...`
      : hederaAccountId
    : null;

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 text-white font-semibold text-lg">
            <FaCoins className="text-indigo-400" />
            FracAssets
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`transition ${location.pathname === to
                    ? "text-indigo-400 font-medium"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right: Wallet + Logout */}
          <div className="hidden md:flex items-center gap-3">
            {connected && hederaAccountId ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-mono text-gray-300">{shortId}</span>
                {hbarBalance !== null && (
                  <span className="text-gray-500">{hbarBalance} ℏ</span>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
              >
                Connect Wallet
              </button>
            )}
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-white/10 px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm transition ${location.pathname === to
                  ? "text-indigo-400 font-medium"
                  : "text-gray-400 hover:text-white"
                }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {!connected && (
              <button
                onClick={() => { connectWallet(); setMenuOpen(false); }}
                className="text-sm text-left text-indigo-400 hover:text-indigo-300"
              >
                Connect Wallet
              </button>
            )}
            <button
              onClick={logout}
              className="text-sm text-left text-gray-500 hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
