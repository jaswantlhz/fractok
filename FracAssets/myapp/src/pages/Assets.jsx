import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { useInvestment } from "../context/InvestmentProvider";

const Assets = () => {
  const { assets = [], loading, error, fetchAssets, invest } = useInvestment();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [shares, setShares] = useState("");

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvest = (asset) => {
    setSelectedAsset(asset);
  };

  const closeModal = () => {
    setSelectedAsset(null);
    setShares("");
  };

  const price = selectedAsset ? Number(selectedAsset.price) : 0;
  const available = selectedAsset ? Number(selectedAsset.available) : 0;
  const enteredShares = Number(shares) || 0;
  const totalCost = enteredShares * price;

  const isInvalid = enteredShares <= 0 || enteredShares > available;

  const confirmInvest = async () => {
    if (isInvalid) return;
    await invest(selectedAsset.id, enteredShares);
    closeModal();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading assets...
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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Asset Marketplace
        </h1>

        <nav className="flex flex-wrap gap-4 text-sm text-gray-400">
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/assets" className="text-indigo-400">Assets</Link>
          <Link to="/portfolio" className="hover:text-white">Portfolio</Link>
          <Link to="/wallet" className="hover:text-white">Wallet</Link>
        </nav>
      </header>

      {/* Search */}
      <div className="relative mb-8 w-full sm:max-w-md">
        <FaSearch className="absolute left-3 top-3 text-gray-500" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{asset.name}</h3>
              <p className="text-sm text-gray-400">Symbol: {asset.symbol}</p>
              <p className="text-sm text-gray-400">Price: ${asset.price}</p>
              <p className="text-sm text-gray-400">
                Available: {asset.available} shares
              </p>
            </div>

            <button
              onClick={() => handleInvest(asset)}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 transition py-2.5 rounded-xl text-sm font-medium w-full"
            >
              Invest
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">

          <div className="bg-gray-950 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 animate-slideUp">

            <h2 className="text-xl font-semibold mb-4">
              Invest in {selectedAsset.name}
            </h2>

            <div className="text-sm text-gray-400 space-y-1 mb-5">
              <p>Price per share: ${price}</p>
              <p>Available shares: {available}</p>
            </div>

            <input
              type="number"
              placeholder="Enter number of shares"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {enteredShares > 0 && (
              <div className="text-indigo-400 text-sm mb-4">
                Total Investment: ${totalCost.toFixed(2)}
              </div>
            )}

            {enteredShares > available && (
              <div className="text-red-500 text-sm mb-4">
                Cannot exceed available shares.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-4 py-2 border border-gray-700 rounded-xl text-sm"
              >
                Cancel
              </button>

              <button
                disabled={isInvalid}
                onClick={confirmInvest}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm transition ${
                  isInvalid
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Confirm Investment
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
