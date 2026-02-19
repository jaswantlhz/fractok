import React, { createContext, useContext, useState } from "react";
import { getAssets, getPortfolio, investInAsset } from "../services/api";
import { useAuth } from "./AuthContext";

const InvestmentContext = createContext();

export const InvestmentProvider = ({ children }) => {
  const { token } = useAuth();

  const [assets, setAssets] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssets = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getAssets(token);
      setAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getPortfolio(token);
      setPortfolio(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const invest = async (assetId, amount) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      await investInAsset(token, assetId, amount);
      await fetchPortfolio(); // refresh portfolio
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InvestmentContext.Provider
      value={{
        assets,
        portfolio,
        loading,
        error,
        fetchAssets,
        fetchPortfolio,
        invest,
      }}
    >
      {children}
    </InvestmentContext.Provider>
  );
};

export const useInvestment = () => useContext(InvestmentContext);
