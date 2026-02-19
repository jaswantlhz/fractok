import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaWallet, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const { connectWallet, loading: walletLoading } = useWallet();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate("/dashboard");
  };

  const handleWalletConnect = async () => {
    await connectWallet();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] px-4 py-6">

      <div className="w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-500">

        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg hover:scale-105 transition duration-300">
            FA
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-white mt-4">Welcome Back</h1>
          <p className="text-gray-300 text-sm text-center mt-1">Access your fractional assets</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-60"
          >
            {loading ? "Signing in..." : <><FaSignInAlt /> Sign In</>}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-grow h-px bg-white/20" />
          <span className="px-3 text-gray-400 text-sm">Or</span>
          <div className="flex-grow h-px bg-white/20" />
        </div>

        {/* MetaMask Snap Connect */}
        <button
          onClick={handleWalletConnect}
          disabled={walletLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-300 disabled:opacity-60"
        >
          <FaWallet />
          {walletLoading ? "Connecting..." : "Connect with MetaMask + Hedera Snap"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-5">
          New user?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
