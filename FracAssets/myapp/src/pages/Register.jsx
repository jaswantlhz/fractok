import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useWallet } from "../context/WalletContext";
import { useNavigate } from "react-router-dom";
import { syncUser } from "../services/api";
import { FaWallet, FaUserCircle, FaCheckCircle, FaArrowRight } from "react-icons/fa";

const Register = () => {
    const { loginWithRedirect, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const { connectWallet, connected, walletAddress, hederaAccountId, loading: walletLoading } = useWallet();
    const navigate = useNavigate();

    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    // Auto-sync when both authenticated and connected
    useEffect(() => {
        const performSync = async () => {
            if (isAuthenticated && connected && hederaAccountId && !syncing) {
                try {
                    setSyncing(true);
                    const token = await getAccessTokenSilently();
                    await syncUser(token, {
                        wallet_address: walletAddress,
                        hedera_account_id: hederaAccountId
                    });
                    // Success - Redirect to Dashboard after a short delay
                    setTimeout(() => navigate("/dashboard"), 1000);
                } catch (err) {
                    console.error("Sync failed:", err);
                    setError("Failed to sync profile. Please try again.");
                    setSyncing(false);
                }
            }
        };
        performSync();
    }, [isAuthenticated, connected, hederaAccountId, getAccessTokenSilently, navigate, syncing, walletAddress]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] px-4 py-8">
            <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg mb-4">
                        FA
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Welcome to FracAssets</h1>
                    <p className="text-gray-400 text-sm mt-2 text-center">
                        Secure Identity & Asset Management
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-4">

                    {/* Step 1: Identity */}
                    <div className={`p-4 rounded-xl border transition-all ${isAuthenticated
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-white/5 border-white/10"
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            {isAuthenticated ? (
                                <FaCheckCircle className="text-emerald-400 text-xl" />
                            ) : (
                                <FaUserCircle className="text-indigo-400 text-xl" />
                            )}
                            <h3 className="text-white font-medium">1. Identity Verification</h3>
                        </div>
                        {isAuthenticated ? (
                            <p className="text-sm text-gray-400 ml-8">Verified as <span className="text-white">{user.email}</span></p>
                        ) : (
                            <button
                                onClick={() => loginWithRedirect()}
                                className="w-full mt-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
                            >
                                Login with Auth0
                            </button>
                        )}
                    </div>

                    {/* Step 2: Wallet */}
                    <div className={`p-4 rounded-xl border transition-all ${connected
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : isAuthenticated ? "bg-white/5 border-white/10" : "opacity-50 pointer-events-none"
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            {connected ? (
                                <FaCheckCircle className="text-emerald-400 text-xl" />
                            ) : (
                                <FaWallet className="text-purple-400 text-xl" />
                            )}
                            <h3 className="text-white font-medium">2. Connect Wallet</h3>
                        </div>
                        {connected ? (
                            <div className="ml-8">
                                <p className="text-sm text-gray-400">Wallet: <span className="font-mono text-white">{walletAddress?.slice(0, 6)}...</span></p>
                                {hederaAccountId && <p className="text-sm text-gray-400">Hedera: <span className="font-mono text-indigo-300">{hederaAccountId}</span></p>}
                            </div>
                        ) : (
                            <button
                                onClick={connectWallet}
                                disabled={!isAuthenticated || walletLoading}
                                className="w-full mt-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition disabled:opacity-50"
                            >
                                {walletLoading ? "Connecting..." : "Connect MetaMask"}
                            </button>
                        )}
                    </div>

                    {/* Step 3: Finish */}
                    {isAuthenticated && connected && (
                        <div className="mt-6 text-center">
                            {syncing ? (
                                <p className="text-indigo-400 animate-pulse">Syncing profile...</p>
                            ) : (
                                <p className="text-gray-400">Redirecting...</p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Register;
