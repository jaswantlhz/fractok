import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCoins, FaBuilding, FaPaintBrush, FaOilCan, FaBolt, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { tokenizeAsset } from "../services/api";

const TOKEN_TYPES = ["FUNGIBLE_COMMON", "NON_FUNGIBLE_UNIQUE"];
const SUPPLY_TYPES = ["FINITE", "INFINITE"];
const CATEGORIES = ["Real Estate", "Art", "Commodities", "Infrastructure", "Crypto"];

const CATEGORY_ICONS = {
    "Real Estate": <FaBuilding />,
    "Art": <FaPaintBrush />,
    "Commodities": <FaOilCan />,
    "Infrastructure": <FaBolt />,
    "Crypto": <FaCoins />,
};

const TokenizeAsset = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        symbol: "",
        description: "",
        category: "Real Estate",
        decimals: 0,
        initial_supply: 1000,
        max_supply: 10000,
        token_type: "FUNGIBLE_COMMON",
        supply_type: "FINITE",
        freeze_default: false,
        admin_key: "",
        supply_key: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await tokenizeAsset(token, form);
            // Python API returns {status:"error", message:"..."} with HTTP 200 on SDK failures
            if (!result || result.status === "error") {
                throw new Error(result?.message || "Token creation failed");
            }
            setSuccess(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] px-4">
                <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-emerald-400 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Asset Tokenized!</h2>
                    <p className="text-gray-400 text-sm mb-4">Your asset has been tokenized on Hedera Testnet.</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
                        <p className="text-gray-300">
                            <span className="text-gray-500">Token ID: </span>
                            <span className="font-mono text-indigo-400">{success.token_id}</span>
                        </p>
                        <p className="text-gray-300">
                            <span className="text-gray-500">Name: </span>
                            <span className="text-gray-200">{success.name}</span>
                        </p>
                        <p className="text-gray-300">
                            <span className="text-gray-500">Symbol: </span>
                            <span className="font-mono text-gray-200">{success.symbol}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/marketplace")}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
                        >
                            View Marketplace
                        </button>
                        <button
                            onClick={() => { setSuccess(null); setForm({ ...form, name: "", symbol: "" }); }}
                            className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition"
                        >
                            Tokenize Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] text-white px-4 sm:px-8 py-8">

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-3">
                        <FaCoins className="text-indigo-400" />
                        Tokenize an Asset
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Create a Hedera token representing a real-world asset
                    </p>
                </div>
                <nav className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
                    <Link to="/marketplace" className="hover:text-white transition">Marketplace</Link>
                    <Link to="/tokenize" className="text-indigo-400 font-medium">Tokenize</Link>
                </nav>
            </header>

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Basic Info */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-200">Asset Information</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Token Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Manhattan Office Tower"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Symbol *</label>
                                <input
                                    type="text"
                                    name="symbol"
                                    required
                                    value={form.symbol}
                                    onChange={handleChange}
                                    placeholder="e.g. MOT"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe the asset..."
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, category: cat }))}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.category === cat
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                                            }`}
                                    >
                                        {CATEGORY_ICONS[cat]} {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Token Config */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-200">Token Configuration</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Decimals</label>
                                <input
                                    type="number"
                                    name="decimals"
                                    min={0}
                                    max={18}
                                    value={form.decimals}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Initial Supply</label>
                                <input
                                    type="number"
                                    name="initial_supply"
                                    min={1}
                                    value={form.initial_supply}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Max Supply</label>
                                <input
                                    type="number"
                                    name="max_supply"
                                    min={1}
                                    value={form.max_supply}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Token Type</label>
                                <select
                                    name="token_type"
                                    value={form.token_type}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {TOKEN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Supply Type</label>
                                <select
                                    name="supply_type"
                                    value={form.supply_type}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {SUPPLY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="freeze_default"
                                checked={form.freeze_default}
                                onChange={handleChange}
                                className="w-4 h-4 rounded accent-indigo-500"
                            />
                            <span className="text-sm text-gray-400">Freeze by default</span>
                        </label>
                    </div>

                    {/* Keys (Optional) */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-200">
                            Keys <span className="text-sm font-normal text-gray-500">(Optional)</span>
                        </h2>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Admin Key (private key hex)</label>
                            <input
                                type="text"
                                name="admin_key"
                                value={form.admin_key}
                                onChange={handleChange}
                                placeholder="0x..."
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Supply Key (private key hex)</label>
                            <input
                                type="text"
                                name="supply_key"
                                value={form.supply_key}
                                onChange={handleChange}
                                placeholder="0x..."
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 text-sm"
                    >
                        {loading ? "Creating token on Hedera..." : "Tokenize Asset on Hedera Testnet"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TokenizeAsset;
