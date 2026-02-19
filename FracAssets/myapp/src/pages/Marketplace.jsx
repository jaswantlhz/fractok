import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaBuilding, FaPaintBrush, FaOilCan, FaBolt, FaFilter } from "react-icons/fa";
import { useInvestment } from "../context/InvestmentProvider";
import { useWallet } from "../context/WalletContext";
import { transferToken, associateToken } from "../services/hederaService";

const CATEGORIES = ["All", "Real Estate", "Art", "Commodities", "Infrastructure", "Crypto"];

const CATEGORY_ICONS = {
    "Real Estate": <FaBuilding />,
    "Art": <FaPaintBrush />,
    "Commodities": <FaOilCan />,
    "Infrastructure": <FaBolt />,
    "Crypto": <FaBolt />,
};

const CATEGORY_COLORS = {
    "Real Estate": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    "Art": "text-pink-400 bg-pink-400/10 border-pink-400/20",
    "Commodities": "text-orange-400 bg-orange-400/10 border-orange-400/20",
    "Infrastructure": "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    "Crypto": "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
};

const Marketplace = () => {
    const { assets = [], loading, error, fetchAssets, invest } = useInvestment();
    const { connected, hederaAccountId } = useWallet();

    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategory] = useState("All");
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [shares, setShares] = useState("");
    const [txStatus, setTxStatus] = useState(null); // null | "loading" | "success" | "error"
    const [txMessage, setTxMessage] = useState("");

    useEffect(() => {
        fetchAssets();
    }, []);

    const filtered = assets.filter((a) => {
        const matchSearch =
            a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = category === "All" || a.category === category;
        return matchSearch && matchCat;
    });

    const openModal = (asset) => {
        setSelectedAsset(asset);
        setShares("");
        setTxStatus(null);
        setTxMessage("");
    };

    const closeModal = () => {
        setSelectedAsset(null);
        setTxStatus(null);
    };

    const price = selectedAsset ? Number(selectedAsset.price) : 0;
    const available = selectedAsset ? Number(selectedAsset.available) : 0;
    const enteredShares = Number(shares) || 0;
    const totalCost = enteredShares * price;
    const isInvalid = enteredShares <= 0 || enteredShares > available;

    const confirmInvest = async () => {
        if (isInvalid) return;
        setTxStatus("loading");
        setTxMessage("Processing investment...");

        try {
            // If asset has a Hedera token ID and wallet is connected, use Snap transfer
            if (selectedAsset.tokenId && connected && hederaAccountId) {
                setTxMessage("Associating token with your account...");
                try {
                    await associateToken(selectedAsset.tokenId);
                } catch (e) {
                    // May already be associated — ignore TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT
                    if (!e?.message?.includes("ALREADY_ASSOCIATED")) {
                        console.warn("Associate warning:", e.message);
                    }
                }

                setTxMessage("Signing transfer on Hedera...");
                await transferToken(selectedAsset.tokenId, hederaAccountId, enteredShares);
            }

            // Always record in backend
            await invest(selectedAsset.id, enteredShares);

            setTxStatus("success");
            setTxMessage(`Successfully purchased ${enteredShares} fraction(s) of ${selectedAsset.name}!`);
        } catch (err) {
            setTxStatus("error");
            setTxMessage(err?.message ?? "Investment failed. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-black text-gray-400">
                Loading marketplace...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white px-4 sm:px-8 py-6">

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                        Asset Marketplace
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Invest in tokenized real-world assets on Hedera Testnet
                    </p>
                </div>

                <nav className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
                    <Link to="/marketplace" className="text-indigo-400 font-medium">Marketplace</Link>
                    <Link to="/portfolio" className="hover:text-white transition">Portfolio</Link>
                    <Link to="/wallet" className="hover:text-white transition">Wallet</Link>
                </nav>
            </header>

            {/* Wallet Warning */}
            {!connected && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-3">
                    <span>⚠️</span>
                    <span>
                        Connect your MetaMask wallet to invest using Hedera tokens.{" "}
                        <Link to="/wallet" className="underline hover:text-amber-300">Connect now →</Link>
                    </span>
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 sm:max-w-md">
                    <FaSearch className="absolute left-3 top-3.5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <FaFilter className="text-gray-500 text-sm" />
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${category === cat
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset Grid */}
            {filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-20">
                    No assets found matching your criteria.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((asset) => (
                        <div
                            key={asset.id}
                            className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition group"
                        >
                            <div className="space-y-3">
                                {/* Category badge */}
                                {asset.category && (
                                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${CATEGORY_COLORS[asset.category] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                                        {CATEGORY_ICONS[asset.category]}
                                        {asset.category}
                                    </span>
                                )}

                                <h3 className="text-lg font-semibold group-hover:text-indigo-300 transition">
                                    {asset.name}
                                </h3>

                                {asset.description && (
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                        {asset.description}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-white/5 rounded-lg p-2.5">
                                        <p className="text-gray-500 text-xs">Symbol</p>
                                        <p className="font-mono font-medium">{asset.symbol}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2.5">
                                        <p className="text-gray-500 text-xs">Price / Fraction</p>
                                        <p className="font-medium">${Number(asset.price).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2.5">
                                        <p className="text-gray-500 text-xs">Available</p>
                                        <p className="font-medium">{Number(asset.available).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2.5">
                                        <p className="text-gray-500 text-xs">Total Supply</p>
                                        <p className="font-medium">{asset.totalSupply ? Number(asset.totalSupply).toLocaleString() : "—"}</p>
                                    </div>
                                </div>

                                {asset.tokenId && (
                                    <p className="text-xs text-gray-600 font-mono truncate">
                                        Token: {asset.tokenId}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => openModal(asset)}
                                className="mt-5 bg-indigo-600 hover:bg-indigo-700 transition py-2.5 rounded-xl text-sm font-medium w-full"
                            >
                                Invest
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Investment Modal */}
            {selectedAsset && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
                    <div className="bg-gray-950 border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8">

                        <h2 className="text-xl font-semibold mb-1">
                            Invest in {selectedAsset.name}
                        </h2>
                        <p className="text-xs text-gray-500 mb-5">
                            {selectedAsset.category} · {selectedAsset.symbol}
                        </p>

                        <div className="text-sm text-gray-400 space-y-1 mb-5 bg-white/5 rounded-xl p-4">
                            <p>Price per fraction: <span className="text-white">${price.toLocaleString()}</span></p>
                            <p>Available fractions: <span className="text-white">{available.toLocaleString()}</span></p>
                            {selectedAsset.tokenId && (
                                <p className="font-mono text-xs text-gray-600">Token ID: {selectedAsset.tokenId}</p>
                            )}
                        </div>

                        {txStatus === null && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Number of fractions"
                                    value={shares}
                                    onChange={(e) => setShares(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                {enteredShares > 0 && (
                                    <div className="text-indigo-400 text-sm mb-3">
                                        Total: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                                {enteredShares > available && (
                                    <div className="text-red-500 text-sm mb-3">Cannot exceed available fractions.</div>
                                )}
                            </>
                        )}

                        {txStatus === "loading" && (
                            <div className="text-center py-4">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">{txMessage}</p>
                            </div>
                        )}

                        {txStatus === "success" && (
                            <div className="text-center py-4">
                                <div className="text-emerald-400 text-4xl mb-2">✓</div>
                                <p className="text-emerald-400 text-sm">{txMessage}</p>
                            </div>
                        )}

                        {txStatus === "error" && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
                                <p className="text-red-400 text-sm">{txMessage}</p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                                onClick={closeModal}
                                className="w-full sm:w-auto px-4 py-2 border border-gray-700 rounded-xl text-sm hover:border-gray-500 transition"
                            >
                                {txStatus === "success" ? "Close" : "Cancel"}
                            </button>

                            {txStatus === null && (
                                <button
                                    disabled={isInvalid}
                                    onClick={confirmInvest}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm transition ${isInvalid
                                            ? "bg-gray-700 cursor-not-allowed"
                                            : "bg-indigo-600 hover:bg-indigo-700"
                                        }`}
                                >
                                    Confirm Investment
                                </button>
                            )}

                            {txStatus === "error" && (
                                <button
                                    onClick={() => { setTxStatus(null); setTxMessage(""); }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 transition"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketplace;
