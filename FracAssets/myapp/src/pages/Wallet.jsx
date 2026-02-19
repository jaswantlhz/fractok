import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaWallet, FaNetworkWired, FaSync, FaExternalLinkAlt } from "react-icons/fa";
import { useWallet } from "../context/WalletContext";

const Wallet = () => {
  const {
    connected,
    snapInstalled,
    walletAddress,
    hederaAccountId,
    hbarBalance,
    tokenBalances,
    network,
    loading,
    statusMessage,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    checkExistingConnection,
  } = useWallet();

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const handleToggle = () => {
    connected ? disconnectWallet() : connectWallet();
  };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const explorerUrl = hederaAccountId
    ? `https://hashscan.io/testnet/account/${hederaAccountId}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-6 md:px-12 py-10">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Wallet Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            MetaMask Hedera Snap — Testnet
          </p>
        </div>
        <nav className="flex gap-6 mt-4 md:mt-0 text-sm">
          <Link className="text-gray-400 hover:text-white transition" to="/dashboard">Dashboard</Link>
          <Link className="text-gray-400 hover:text-white transition" to="/marketplace">Marketplace</Link>
          <Link className="text-gray-400 hover:text-white transition" to="/portfolio">Portfolio</Link>
          <Link className="text-indigo-400 font-medium" to="/wallet">Wallet</Link>
        </nav>
      </header>

      <div className="max-w-xl mx-auto space-y-4">

        {/* Main Wallet Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center space-y-6">

          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm text-center max-w-xs">
                {statusMessage ?? "Connecting to MetaMask Hedera Snap..."}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-2">
                Make sure MetaMask is installed and unlocked.
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Status Badge */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Connection Status</p>
                <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${connected
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {connected && (
                <div className="space-y-4 text-sm text-left">

                  {/* Network */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                    <FaNetworkWired />
                    <span className="uppercase tracking-wider">{network}</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  </div>

                  {/* EVM Address */}
                  {walletAddress && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">MetaMask Address (EVM)</p>
                      <p className="font-mono text-gray-200 break-all text-xs">{walletAddress}</p>
                    </div>
                  )}

                  {/* Hedera Account */}
                  {hederaAccountId && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">Hedera Account ID</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-indigo-400 text-sm">{hederaAccountId}</p>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-300 transition"
                          >
                            <FaExternalLinkAlt className="text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HBAR Balance */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-500 text-xs">HBAR Balance</p>
                      <button
                        onClick={refreshBalance}
                        className="text-gray-600 hover:text-gray-400 transition"
                        title="Refresh balance"
                      >
                        <FaSync className="text-xs" />
                      </button>
                    </div>
                    <p className="text-2xl font-semibold">
                      {hbarBalance !== null ? `${hbarBalance} ℏ` : "—"}
                    </p>
                  </div>

                  {/* Token Balances */}
                  {tokenBalances && Object.keys(tokenBalances).length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-3">Token Holdings</p>
                      <div className="space-y-2">
                        {Object.entries(tokenBalances).map(([tokenId, bal]) => (
                          <div key={tokenId} className="flex justify-between text-xs">
                            <span className="font-mono text-gray-400">{tokenId}</span>
                            <span className="text-gray-200">{bal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Snap Status */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                    <span className={`w-2 h-2 rounded-full ${snapInstalled ? "bg-green-400" : "bg-gray-600"}`} />
                    Hedera Snap {snapInstalled ? "installed" : "not installed"}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <button
                  onClick={handleToggle}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition ${connected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  <FaWallet className="inline mr-2" />
                  {connected ? "Disconnect Wallet" : "Connect MetaMask + Hedera Snap"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Card */}
        {!connected && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-sm text-gray-400 space-y-2">
            <p className="text-indigo-400 font-medium">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click "Connect MetaMask + Hedera Snap"</li>
              <li>MetaMask will ask to install the Hedera Wallet Snap</li>
              <li>Approve the Snap installation</li>
              <li>Your Hedera Testnet account ID and HBAR balance will appear</li>
              <li>You can now invest in tokenized assets using Hedera tokens</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
