import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaCheckCircle } from "react-icons/fa";
import { registerUser } from "../services/api";

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        address: "",
        email: "",
        kyc_proof: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await registerUser(form);
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
                    <h2 className="text-2xl font-semibold text-white mb-2">Registration Successful!</h2>
                    <p className="text-gray-400 text-sm mb-4">Your Hedera account has been created.</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
                        <p className="text-gray-300">
                            <span className="text-gray-500">Hedera Account ID: </span>
                            <span className="font-mono text-indigo-400">{success.hedera_account_id}</span>
                        </p>
                        <p className="text-gray-300">
                            <span className="text-gray-500">User ID: </span>
                            <span className="font-mono text-gray-200">{success.user_id}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] px-4 py-8">
            <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">

                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg mb-3">
                        FA
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Create Account</h1>
                    <p className="text-gray-400 text-sm mt-1 text-center">
                        Register to start investing in fractional assets
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <FaUser className="text-indigo-400" /> Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={form.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <FaEnvelope className="text-indigo-400" /> Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <FaMapMarkerAlt className="text-indigo-400" /> Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            required
                            value={form.address}
                            onChange={handleChange}
                            placeholder="123 Main St, City, Country"
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* KYC Proof */}
                    <div>
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <FaIdCard className="text-indigo-400" /> KYC Proof
                        </label>
                        <input
                            type="text"
                            name="kyc_proof"
                            required
                            value={form.kyc_proof}
                            onChange={handleChange}
                            placeholder="Passport / National ID number"
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-gray-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your KYC document number for identity verification
                        </p>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                    >
                        {loading ? "Creating your account..." : "Register & Create Hedera Account"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-5">
                    Already have an account?{" "}
                    <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
