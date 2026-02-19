// ---------------- USERS ----------------
let users = [
  { id: 1, email: "hemu@gmail.com", password: "123456" },
  { id: 2, email: "test@gmail.com", password: "123456" }
];

// ---------------- ASSETS ----------------
let assets = [
  // ── Real Estate ──────────────────────────────────────────────────────────
  {
    id: 1,
    name: "Manhattan Office Tower",
    symbol: "MOT",
    category: "Real Estate",
    description: "Prime Grade-A office space in Midtown Manhattan, 42 floors, 98% occupancy.",
    price: 500,
    available: 2000,
    totalSupply: 10000,
    tokenId: null, // Set after token creation on Hedera
  },
  {
    id: 2,
    name: "Dubai Marina Residences",
    symbol: "DMR",
    category: "Real Estate",
    description: "Luxury waterfront apartments in Dubai Marina with guaranteed rental yield.",
    price: 250,
    available: 4000,
    totalSupply: 20000,
    tokenId: null,
  },
  {
    id: 3,
    name: "London Canary Wharf Complex",
    symbol: "LCW",
    category: "Real Estate",
    description: "Commercial property complex in London's financial district.",
    price: 1200,
    available: 800,
    totalSupply: 5000,
    tokenId: null,
  },

  // ── Art ──────────────────────────────────────────────────────────────────
  {
    id: 4,
    name: "Basquiat Collection 2024",
    symbol: "BSQT",
    category: "Art",
    description: "Fractional ownership of a curated Basquiat collection valued at $12M.",
    price: 1200,
    available: 1000,
    totalSupply: 10000,
    tokenId: null,
  },
  {
    id: 5,
    name: "Contemporary Asian Art Fund",
    symbol: "CAAF",
    category: "Art",
    description: "Diversified fund of emerging Asian contemporary artists.",
    price: 300,
    available: 5000,
    totalSupply: 30000,
    tokenId: null,
  },

  // ── Commodities ──────────────────────────────────────────────────────────
  {
    id: 6,
    name: "Gold Reserve Token",
    symbol: "GRT",
    category: "Commodities",
    description: "Each token backed by 0.01 troy ounce of LBMA-certified gold.",
    price: 20,
    available: 50000,
    totalSupply: 500000,
    tokenId: null,
  },
  {
    id: 7,
    name: "Crude Oil Futures Fund",
    symbol: "COFF",
    category: "Commodities",
    description: "Tokenized exposure to WTI crude oil futures contracts.",
    price: 85,
    available: 10000,
    totalSupply: 100000,
    tokenId: null,
  },

  // ── Infrastructure ───────────────────────────────────────────────────────
  {
    id: 8,
    name: "Solar Farm Texas",
    symbol: "SFT",
    category: "Infrastructure",
    description: "500MW solar farm in West Texas generating stable renewable energy income.",
    price: 150,
    available: 8000,
    totalSupply: 50000,
    tokenId: null,
  },
  {
    id: 9,
    name: "Singapore Port Authority",
    symbol: "SPA",
    category: "Infrastructure",
    description: "Fractional ownership in Singapore's Tuas Mega Port expansion.",
    price: 800,
    available: 1500,
    totalSupply: 10000,
    tokenId: null,
  },

  // ── Crypto (existing) ────────────────────────────────────────────────────
  {
    id: 10,
    name: "Hedera",
    symbol: "HBAR",
    category: "Crypto",
    description: "Native token of the Hedera Hashgraph network.",
    price: 0.12,
    available: 10000,
    totalSupply: 50000000000,
    tokenId: null,
  },
];

// ---------------- PORTFOLIO ----------------

let portfolio = [
  {
    userId: 1,
    assetId: 1,
    assetName: "Manhattan Office Tower",
    amount: 10,
    investedPrice: 480,
    currentPrice: 500,
    status: "confirmed",
    transactionHash: "0xabc123",
  },
  {
    userId: 1,
    assetId: 6,
    assetName: "Gold Reserve Token",
    amount: 100,
    investedPrice: 18,
    currentPrice: 20,
    status: "confirmed",
    transactionHash: "0xdef456",
  },
  {
    userId: 1,
    assetId: 10,
    assetName: "Hedera",
    amount: 500,
    investedPrice: 0.10,
    currentPrice: 0.12,
    status: "pending",
    transactionHash: "0xghi789",
  },
];

module.exports = { users, assets, portfolio };
