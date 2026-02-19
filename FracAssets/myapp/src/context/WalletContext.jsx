import React, { createContext, useContext, useState, useCallback } from "react";
import {
  installSnap,
  getInstalledSnap,
  getSnapAccount,
  getSnapBalance,
  getMirrorNodeBalance,
  isNoAccountError,
  createHederaAccountViaBackend,
} from "../services/hederaService";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [snapInstalled, setSnapInstalled] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [hederaAccountId, setHederaAccountId] = useState(null);
  const [hbarBalance, setHbarBalance] = useState(null);
  const [tokenBalances, setTokenBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // human-readable progress
  const [error, setError] = useState(null);
  const [network] = useState("testnet");

  // ── Internal helpers ──────────────────────────────────────────────────────
  const status = (msg) => setStatusMessage(msg);

  const loadBalance = async (accountId) => {
    // Try Snap first, fall back to Mirror Node REST API
    try {
      const balInfo = await getSnapBalance(accountId);
      const hbars =
        balInfo?.balance?.balance ??
        balInfo?.hbars ??
        balInfo?.balance ??
        0;
      setHbarBalance(hbars);
      setTokenBalances(
        balInfo?.balance?.tokens ?? balInfo?.tokens ?? {}
      );
    } catch {
      // Snap balance failed — use Mirror Node directly
      const mirrorBal = await getMirrorNodeBalance(accountId);
      if (mirrorBal) {
        setHbarBalance(mirrorBal.hbars);
        setTokenBalances(mirrorBal.tokens ?? {});
      }
    }
  };

  // ── Connect ───────────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStatusMessage(null);

      // 1. Request MetaMask EVM accounts
      status("Requesting MetaMask accounts...");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const evmAddress = accounts[0];
      setWalletAddress(evmAddress);

      // 2. Install Hedera Snap
      status("Installing Hedera Wallet Snap...");
      const snap = await installSnap();
      setSnapInstalled(!!snap);

      // 3. Try to get Hedera account info
      let accountId = null;
      status("Looking up your Hedera account...");
      try {
        const accountInfo = await getSnapAccount();
        accountId =
          accountInfo?.currentAccount?.accountId ??
          accountInfo?.accountId ??
          null;
      } catch (snapErr) {
        if (isNoAccountError(snapErr)) {
          // ── No Hedera account yet — create one via backend ──────────────
          status(
            "No Hedera account found for this address. Creating one on testnet (this may take ~5s)..."
          );
          try {
            const created = await createHederaAccountViaBackend(evmAddress);
            accountId = created?.account_id ?? created?.accountId ?? null;

            if (!accountId) {
              throw new Error("Account created but ID not returned.");
            }

            status(`Hedera account created: ${accountId}`);
            // Store mapping so the Snap can pick it up on next invoke
            // (user may need to re-open MetaMask to sync — we surface this)
          } catch (createErr) {
            throw new Error(
              `Could not create Hedera account: ${createErr.message}`
            );
          }
        } else {
          throw snapErr;
        }
      }

      setHederaAccountId(accountId);

      // 4. Load balance
      if (accountId) {
        status("Fetching HBAR balance...");
        await loadBalance(accountId);
      }

      setConnected(true);
      setStatusMessage(null);
    } catch (err) {
      console.error("Wallet connect error:", err);
      setError(err?.message ?? "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setConnected(false);
    setSnapInstalled(false);
    setWalletAddress(null);
    setHederaAccountId(null);
    setHbarBalance(null);
    setTokenBalances({});
    setError(null);
    setStatusMessage(null);
  }, []);

  // ── Refresh balance ───────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!hederaAccountId) return;
    await loadBalance(hederaAccountId);
  }, [hederaAccountId]);

  // ── Check existing connection on mount ────────────────────────────────────
  const checkExistingConnection = useCallback(async () => {
    try {
      const snap = await getInstalledSnap();
      if (!snap) return;

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts?.length) return;

      setWalletAddress(accounts[0]);
      setSnapInstalled(true);

      try {
        const accountInfo = await getSnapAccount();
        const accountId =
          accountInfo?.currentAccount?.accountId ??
          accountInfo?.accountId ??
          null;

        if (accountId) {
          setHederaAccountId(accountId);
          await loadBalance(accountId);
          setConnected(true);
        }
      } catch {
        // Snap account lookup failed silently on mount — user can reconnect
      }
    } catch {
      // Not connected — silent fail
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
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
        // legacy compat
        balance: hbarBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
