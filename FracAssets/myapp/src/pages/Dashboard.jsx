import React, { useState, useEffect } from "react";
import {
  FaDollarSign,
  FaChartLine,
  FaLayerGroup,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPortfolio } from "../services/api";

const Dashboard = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState({
    totalInvested: "$0",
    portfolioValue: "$0",
    profitLoss: "Profit",
    activeAssets: 0,
    walletStatus: "Connected",
  });

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const data = await getPortfolio(token);

        let totalInvested = 0;

        data.forEach((item) => {
          // total_cost is amount * price_per_unit, stored in MongoDB
          totalInvested += Number(item.total_cost ?? 0);
        });

        setOverview({
          totalInvested: `$${totalInvested.toFixed(2)}`,
          portfolioValue: `$${totalInvested.toFixed(2)}`, // no live price feed yet
          profitLoss: "—",
          activeAssets: data.length,
          walletStatus: "Connected",
        });

        const formattedTransactions = data.map((item, index) => ({
          _id: index,
          assetName: item.asset_name,
          fractions: item.amount,
          date: item.created_at || new Date().toISOString(),
          amount: Number(item.total_cost ?? 0).toFixed(2),
          status: item.status,
          type: "Buy",
        }));

        setTransactions(formattedTransactions);
      } catch (err) {
        setError(err.message || "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-300">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 px-6 lg:px-12 py-8">

      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            FracAssets Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Overview of your investment portfolio
          </p>
        </div>

        <nav className="flex gap-8 text-sm mt-4 lg:mt-0">
          <Link className="text-white font-medium" to="/dashboard">
            Dashboard
          </Link>
          <Link className="text-gray-400 hover:text-white transition" to="/assets">
            Assets
          </Link>
          <Link className="text-gray-400 hover:text-white transition" to="/portfolio">
            Portfolio
          </Link>
          <Link className="text-gray-400 hover:text-white transition" to="/wallet">
            Wallet
          </Link>
        </nav>
      </header>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <StatCard
          icon={<FaDollarSign />}
          title="Total Invested"
          value={overview.totalInvested}
        />
        <StatCard
          icon={<FaChartLine />}
          title="Portfolio Value"
          value={overview.portfolioValue}
          sub={overview.profitLoss}
        />
        <StatCard
          icon={<FaLayerGroup />}
          title="Active Assets"
          value={overview.activeAssets}
        />
        <StatCard
          icon={<FaWallet />}
          title="Wallet Status"
          value={overview.walletStatus}
        />
      </section>

      {/* Recent Activity */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">
          Recent Activity
        </h2>

        {transactions.length === 0 ? (
          <p className="text-gray-400">No recent transactions.</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-md ${tx.type === "Buy"
                      ? "bg-emerald-900 text-emerald-400"
                      : "bg-rose-900 text-rose-400"
                    }`}>
                    {tx.type === "Buy" ? <FaArrowUp /> : <FaArrowDown />}
                  </div>

                  <div>
                    <p className="font-medium">
                      {tx.assetName} ({tx.fractions})
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 text-left sm:text-right">
                  <p className="font-medium">${tx.amount}</p>
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-700 text-gray-300">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Professional stat card
const StatCard = ({ icon, title, value, sub }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 
      hover:border-slate-600 transition">

    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-400">{title}</p>
      <div className="text-gray-400 text-lg">{icon}</div>
    </div>

    <p className="text-2xl font-semibold">{value}</p>

    {sub && (
      <p className={`text-sm mt-2 ${sub === "Profit" ? "text-emerald-400" : "text-rose-400"
        }`}>
        {sub}
      </p>
    )}
  </div>
);

export default Dashboard;
