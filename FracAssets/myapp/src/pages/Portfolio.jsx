import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useInvestment } from "../context/InvestmentProvider";

const Portfolio = () => {
  const { portfolio, loading, error, fetchPortfolio } = useInvestment();

  useEffect(() => {
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black">
        <p className="text-gray-400 text-lg animate-pulse">Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-6 md:px-12 py-10">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Portfolio Overview</h1>
          <p className="text-gray-400 mt-1 text-sm">Track your holdings and transaction activity</p>
        </div>
        <nav className="flex gap-6 mt-4 md:mt-0 text-sm">
          <Link className="text-gray-400 hover:text-white transition" to="/dashboard">Dashboard</Link>
          <Link className="text-gray-400 hover:text-white transition" to="/marketplace">Marketplace</Link>
          <Link className="text-indigo-400 font-medium" to="/portfolio">Portfolio</Link>
          <Link className="text-gray-400 hover:text-white transition" to="/wallet">Wallet</Link>
        </nav>
      </header>

      {/* Holdings */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-6">Holdings</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-400 text-sm">No holdings yet. Start investing to build your portfolio.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 text-left">Asset</th>
                  <th className="py-3 text-left">Symbol</th>
                  <th className="py-3 text-left">Fractions</th>
                  <th className="py-3 text-left">Total Cost</th>
                  <th className="py-3 text-left">Token ID</th>
                  <th className="py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 font-medium">{item.asset_name}</td>
                    <td className="py-4 font-mono text-indigo-300">{item.symbol}</td>
                    <td className="py-4">{item.amount}</td>
                    <td className="py-4">${Number(item.total_cost ?? 0).toFixed(2)}</td>
                    <td className="py-4 font-mono text-xs text-gray-400">{item.token_id || "—"}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${item.status === "confirmed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : item.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-400 text-sm">No transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 text-left">Asset</th>
                  <th className="py-3 text-left">Fractions</th>
                  <th className="py-3 text-left">Date</th>
                  <th className="py-3 text-left">Tx / Token ID</th>
                  <th className="py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((tx, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4">{tx.asset_name}</td>
                    <td className="py-4">{tx.amount}</td>
                    <td className="py-4 text-gray-400">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 text-gray-400 font-mono text-xs">
                      {tx.tx_id ? tx.tx_id.slice(0, 14) + "…" : tx.token_id || "—"}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${tx.status === "confirmed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : tx.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
