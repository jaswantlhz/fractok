// Hedera MetaMask Snap Service
// Uses the official Hedera Wallet Snap: npm:@hashgraph/hedera-wallet-snap

const SNAP_ID = "npm:@hashgraph/hedera-wallet-snap";
const SNAP_VERSION = "0.6.2";
const HEDERA_NETWORK = "testnet";

// ─────────────────────────────────────────────
// Install / Get Snap
// ─────────────────────────────────────────────
export const installSnap = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask.");
    }

    const snaps = await window.ethereum.request({
        method: "wallet_requestSnaps",
        params: {
            [SNAP_ID]: { version: SNAP_VERSION },
        },
    });

    return snaps[SNAP_ID];
};

export const getInstalledSnap = async () => {
    if (!window.ethereum) return null;

    try {
        const snaps = await window.ethereum.request({ method: "wallet_getSnaps" });
        return snaps[SNAP_ID] ?? null;
    } catch {
        return null;
    }
};

// ─────────────────────────────────────────────
// Snap Invoke Helper
// ─────────────────────────────────────────────
const invokeSnap = async (method, params = {}) => {
    return window.ethereum.request({
        method: "wallet_invokeSnap",
        params: {
            snapId: SNAP_ID,
            request: { method, params },
        },
    });
};

// ─────────────────────────────────────────────
// Account Info — may throw if no Hedera account exists yet
// ─────────────────────────────────────────────
export const getSnapAccount = async () => {
    const result = await invokeSnap("hedera_getAccountInfo", {
        network: HEDERA_NETWORK,
    });
    return result;
};

// ─────────────────────────────────────────────
// Check if the error is "no Hedera account" error
// ─────────────────────────────────────────────
export const isNoAccountError = (err) => {
    const msg = err?.message ?? err?.data?.message ?? "";
    return (
        msg.toLowerCase().includes("could not get account info") ||
        msg.toLowerCase().includes("mirror node") ||
        msg.toLowerCase().includes("no account") ||
        msg.toLowerCase().includes("account not found")
    );
};

// ─────────────────────────────────────────────
// Create Hedera account via our backend (Python API)
// Called when the user's EVM address has no Hedera account yet
// ─────────────────────────────────────────────
export const createHederaAccountViaBackend = async (evmAddress) => {
    const res = await fetch("http://localhost:8000/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            initial_balance: 10,   // 10 HBAR initial funding for testnet
            memo: `FracAssets user: ${evmAddress}`,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to create Hedera account");
    }

    return res.json(); // { account_id, public_key }
};

// ─────────────────────────────────────────────
// Balance
// ─────────────────────────────────────────────
export const getSnapBalance = async (accountId) => {
    const result = await invokeSnap("hedera_getAccountBalance", {
        network: HEDERA_NETWORK,
        accountId,
    });
    return result;
};

// ─────────────────────────────────────────────
// Mirror Node balance lookup (fallback — no Snap needed)
// ─────────────────────────────────────────────
export const getMirrorNodeBalance = async (accountId) => {
    const res = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
        hbars: (data.balance?.balance ?? 0) / 1e8, // tinybars → HBAR
        tokens: data.balance?.tokens ?? [],
    };
};

// ─────────────────────────────────────────────
// Transfer HBAR
// ─────────────────────────────────────────────
export const transferHbar = async (toAccountId, amount) => {
    return invokeSnap("hedera_transferCrypto", {
        network: HEDERA_NETWORK,
        transfers: [
            {
                assetType: "HBAR",
                to: toAccountId,
                amount,
            },
        ],
        memo: "FracAssets Transfer",
    });
};

// ─────────────────────────────────────────────
// Transfer Token (HTS)
// ─────────────────────────────────────────────
export const transferToken = async (tokenId, toAccountId, amount) => {
    return invokeSnap("hedera_transferCrypto", {
        network: HEDERA_NETWORK,
        transfers: [
            {
                assetType: "TOKEN",
                tokenId,
                to: toAccountId,
                amount,
                decimals: 0,
            },
        ],
        memo: "FracAssets Token Transfer",
    });
};

// ─────────────────────────────────────────────
// Associate Token (user must associate before receiving)
// ─────────────────────────────────────────────
export const associateToken = async (tokenId) => {
    return invokeSnap("hedera_associateTokens", {
        network: HEDERA_NETWORK,
        tokenIds: [tokenId],
    });
};

// ─────────────────────────────────────────────
// Sign arbitrary message (for KYC / auth)
// ─────────────────────────────────────────────
export const signMessage = async (message) => {
    return invokeSnap("hedera_signMessage", {
        network: HEDERA_NETWORK,
        message,
    });
};
