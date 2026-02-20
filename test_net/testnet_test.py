from hiero_sdk_python import (
    Network,
    Client,
    AccountId,
    PrivateKey,
    CryptoGetAccountBalanceQuery,
    TokenCreateTransaction,
    TokenType,
    SupplyType,
    AccountInfoQuery,
    AccountCreateTransaction,
    TransactionReceipt,
    Hbar,
    TokenMintTransaction,
    TransferTransaction)
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import requests
from datetime import datetime, timezone

load_dotenv()

# ── MongoDB ────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hedera_users_db")

try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[MONGO_DB_NAME]
    marketplace_col = db["marketplace"]
    portfolio_col   = db["portfolio"]
    marketplace_col.create_index("token_id", unique=True)
    portfolio_col.create_index([("auth0_id", 1), ("token_id", 1)])
    print(f"MongoDB connected: {MONGO_DB_NAME}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    db = None
    marketplace_col = None
    portfolio_col   = None

# ── Hedera Client ──────────────────────────────────────────────────────────
try:
    operator_id  = AccountId.from_string(os.getenv("OPERATOR_ID"))
    operator_key = PrivateKey.from_string(os.getenv("OPERATOR_KEY"))
    client = Client.for_testnet()
    client.set_operator(operator_id, operator_key)
    print("Client initialized successfully.")
except Exception as e:
    print(f"Failed to initialize client: {e}")
    client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Models ─────────────────────────────────────────────────────────

class CreateTokenRequest(BaseModel):
    name: str
    symbol: str
    decimals: int = 0
    initial_supply: int = 1000
    max_supply: int = 10000
    token_type: str = "FUNGIBLE_COMMON"
    supply_type: str = "FINITE"
    freeze_default: bool = False
    admin_key: str = None
    supply_key: str = None
    freeze_key: str = None
    wipe_key: str = None
    kyc_key: str = None
    pause_key: str = None
    treasury_account_id: str = None
    # Extra fields from frontend
    description: str = None
    category: str = None
    # Auth identity (passed by Express after verifying JWT)
    auth0_id: str = None

class InvestRequest(BaseModel):
    auth0_id: str
    token_id: str
    asset_name: str
    symbol: str
    amount: int
    price_per_unit: float = 0.0
    tx_id: str = None


# ── Balance ────────────────────────────────────────────────────────────────

@app.get("/balance")
def get_account_balance(account_id: str):
    if not client:
        return {"error": "Client not initialized"}
    try:
        acc_id  = AccountId.from_string(account_id)
        balance = CryptoGetAccountBalanceQuery().set_account_id(acc_id).execute(client)
        return {
            "hbars": str(balance.hbars),
            "tinybars": str(balance.hbars.to_tinybars()),
            "tokens": str(balance.tokens)
        }
    except Exception as e:
        return {"error": str(e)}


# ── Create Token ───────────────────────────────────────────────────────────

@app.post("/create-token")
def create_token(request: CreateTokenRequest):
    if not client:
        return {"error": "Client not initialized"}

    try:
        tk_type = TokenType.NON_FUNGIBLE_UNIQUE if request.token_type == "NON_FUNGIBLE_UNIQUE" else TokenType.FUNGIBLE_COMMON
        sp_type = SupplyType.INFINITE if request.supply_type == "INFINITE" else SupplyType.FINITE

        transaction = TokenCreateTransaction()
        transaction.set_token_name(request.name)
        transaction.set_token_symbol(request.symbol)
        transaction.set_token_type(tk_type)
        transaction.set_decimals(request.decimals)
        transaction.set_initial_supply(request.initial_supply)
        transaction.set_max_supply(request.max_supply)
        transaction.set_supply_type(sp_type)
        transaction.set_freeze_default(request.freeze_default)

        treasury_id = operator_id
        if request.treasury_account_id:
            treasury_id = AccountId.from_string(request.treasury_account_id)
        transaction.set_treasury_account_id(treasury_id)

        if request.admin_key:
            transaction.set_admin_key(PrivateKey.from_string(request.admin_key).public_key())
        if request.supply_key:
            transaction.set_supply_key(PrivateKey.from_string(request.supply_key).public_key())
        if request.freeze_key:
            transaction.set_freeze_key(PrivateKey.from_string(request.freeze_key).public_key())
        if request.wipe_key:
            transaction.set_wipe_key(PrivateKey.from_string(request.wipe_key).public_key())
        if request.kyc_key:
            transaction.set_kyc_key(PrivateKey.from_string(request.kyc_key).public_key())
        if request.pause_key:
            transaction.set_pause_key(PrivateKey.from_string(request.pause_key).public_key())

        transaction.freeze_with(client)

        if str(treasury_id) == str(operator_id):
            transaction.sign(operator_key)
        if request.admin_key:
            transaction.sign(PrivateKey.from_string(request.admin_key))

        # execute() returns TransactionReceipt directly in this SDK version
        receipt       = transaction.execute(client)
        token_id_str  = str(receipt.token_id)

        # ── Persist to MongoDB marketplace ──────────────────────────────
        if marketplace_col is not None:
            doc = {
                "token_id":     token_id_str,
                "name":         request.name,
                "symbol":       request.symbol,
                "description":  request.description or "",
                "category":     request.category or "Other",
                "decimals":     request.decimals,
                "initial_supply": request.initial_supply,
                "max_supply":   request.max_supply,
                "available":    request.initial_supply,   # starts as full supply
                "supply_type":  request.supply_type,
                "token_type":   request.token_type,
                "price":        0,                        # price set later; 0 = market determines
                "created_by":   request.auth0_id or "unknown",
                "created_at":   datetime.now(timezone.utc).isoformat(),
            }
            try:
                marketplace_col.insert_one(doc)
            except Exception as db_err:
                print(f"DB insert warning: {db_err}")   # token still created, just log

        return {
            "status":   "success",
            "token_id": token_id_str,
            "name":     request.name,
            "symbol":   request.symbol,
            "category": request.category,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Marketplace Listing ────────────────────────────────────────────────────

@app.get("/marketplace")
def get_marketplace():
    if marketplace_col is None:
        return []
    try:
        assets = list(marketplace_col.find({}, {"_id": 0}))
        return assets
    except Exception as e:
        return {"error": str(e)}


# ── Portfolio: Record Investment ───────────────────────────────────────────

@app.post("/portfolio/invest")
def portfolio_invest(req: InvestRequest):
    if portfolio_col is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        doc = {
            "auth0_id":       req.auth0_id,
            "token_id":       req.token_id,
            "asset_name":     req.asset_name,
            "symbol":         req.symbol,
            "amount":         req.amount,
            "price_per_unit": req.price_per_unit,
            "total_cost":     req.amount * req.price_per_unit,
            "tx_id":          req.tx_id or "",
            "status":         "confirmed",
            "created_at":     datetime.now(timezone.utc).isoformat(),
        }
        portfolio_col.insert_one(doc)
        # Reduce available supply on the marketplace listing
        if marketplace_col is not None:
            marketplace_col.update_one(
                {"token_id": req.token_id},
                {"$inc": {"available": -req.amount}}
            )
        return {"status": "success", "investment": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Portfolio: Get User Holdings ───────────────────────────────────────────

@app.get("/portfolio")
def get_portfolio(auth0_id: str):
    if portfolio_col is None:
        return []
    try:
        holdings = list(portfolio_col.find({"auth0_id": auth0_id}, {"_id": 0}))
        return holdings
    except Exception as e:
        return {"error": str(e)}


# ── Create Account ─────────────────────────────────────────────────────────

class CreateAccountRequest(BaseModel):
    initial_balance: float
    memo: str = None

@app.post("/create-account")
def create_account(request: CreateAccountRequest):
    if not client:
        return {"error": "Client not initialized"}
    try:
        new_private_key = PrivateKey.generate_ed25519()
        new_public_key  = new_private_key.public_key()
        transaction = (
            AccountCreateTransaction()
            .set_key_without_alias(new_public_key)
            .set_initial_balance(Hbar(request.initial_balance))
            .set_account_memo(request.memo)
            .freeze_with(client)
        )
        transaction.sign(operator_key)
        transaction.sign(new_private_key)
        receipt = transaction.execute(client)
        new_account_id = str(receipt.account_id)
        return {
            "status":          "success",
            "account_id":      new_account_id,
            "public_key":      str(new_public_key),
            "initial_balance": request.initial_balance,
            "memo":            request.memo,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Transactions via Mirror Node ───────────────────────────────────────────

@app.get("/transactions/{account_id}")
def get_transactions(account_id: str):
    base = "https://testnet.mirrornode.hedera.com"
    url  = f"{base}/api/v1/transactions?account.id={account_id}&limit=100&order=desc"
    all_transactions = []
    try:
        while url:
            res = requests.get(url)
            res.raise_for_status()
            data = res.json()
            for tx in data.get("transactions", []):
                all_transactions.append({
                    "transaction_id": tx["transaction_id"],
                    "name":           tx["name"],
                    "result":         tx["result"],
                })
            next_link = data.get("links", {}).get("next")
            url = f"{base}{next_link}" if next_link else None
        return {"account_id": account_id, "transactions": all_transactions}
    except Exception as e:
        return {"error": str(e)}


# ── Mint Token ─────────────────────────────────────────────────────────────

@app.post("/mint-token")
def mint_token(token_id: str, amount: int, admin_key: str):
    if not client:
        return {"error": "Client not initialized"}
    try:
        transaction = (
            TokenMintTransaction()
            .set_token_id(token_id)
            .set_amount(amount)
            .freeze_with(client)
        )
        transaction.sign(operator_key)
        transaction.sign(PrivateKey.from_string(admin_key))
        receipt = transaction.execute(client)
        return {
            "status":           "success",
            "new_total_supply": str(receipt.total_supply),
            "transaction_id":   str(receipt.transaction_id),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Transfer Token ─────────────────────────────────────────────────────────

@app.post("/transfer-token")
def transfer_token(token_id: str, recipient_id: str, amount: int):
    if not client:
        return {"error": "Client not initialized"}
    try:
        transaction = (
            TransferTransaction()
            .add_token_transfer(token_id, operator_id, -amount)
            .add_token_transfer(token_id, recipient_id, amount)
            .freeze_with(client)
        )
        transaction.sign(operator_key)
        receipt = transaction.execute(client)
        return {
            "status":         "success",
            "transaction_id": str(receipt.transaction_id),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)