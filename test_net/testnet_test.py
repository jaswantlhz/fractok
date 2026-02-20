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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests


load_dotenv()

# Initialize Client Globally
try:
    operator_id = AccountId.from_string(os.getenv("OPERATOR_ID"))
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

@app.get("/balance")
def get_account_balance(account_id: str):
    if not client:
        return {"error": "Client not initialized"}
    
    try:
        acc_id = AccountId.from_string(account_id)
        balance = CryptoGetAccountBalanceQuery().set_account_id(acc_id).execute(client)
        print(f"HBAR tinybars: {balance.hbars.to_tinybars()}")
        print(f"Tokens: {balance.tokens}")
        return {
            "hbars": str(balance.hbars),
            "tinybars": str(balance.hbars.to_tinybars()),
            "tokens": str(balance.tokens)
        }
    except Exception as e:
        return {"error": str(e)}


# Request Models
@app.post("/create-token")
def create_token(
    name: str,
    symbol: str,
    decimals: int,
    initial_supply: int,
    max_supply: int,
    token_type: str = "FUNGIBLE_COMMON",     # default as in MD example (FUNGIBLE_COMMON)
    supply_type: str = "FINITE",             # default as in MD example (FINITE)
    freeze_default: bool = False,
    admin_key: str = None, 
    supply_key: str = None,
    freeze_key: str = None,
    wipe_key: str = None,
    kyc_key: str = None,
    pause_key: str = None,
    treasury_account_id: str = None
):
    if not client:
        return {"error": "Client not initialized"}

    try:
        # Determine Enum types
        tk_type = TokenType.FUNGIBLE_COMMON
        if token_type == "NON_FUNGIBLE_UNIQUE":
            tk_type = TokenType.NON_FUNGIBLE_UNIQUE
        
        sp_type = SupplyType.FINITE
        if supply_type == "INFINITE":
            sp_type = SupplyType.INFINITE

        transaction = TokenCreateTransaction()
        
        # Set basic properties
        transaction.set_token_name(name)
        transaction.set_token_symbol(symbol)
        transaction.set_token_type(tk_type)
        transaction.set_decimals(decimals)
        transaction.set_initial_supply(initial_supply)
        transaction.set_max_supply(max_supply)
        transaction.set_supply_type(sp_type)
        transaction.set_freeze_default(freeze_default)

        # Handle Treasury 
        treasury_id = operator_id
        if treasury_account_id:
             treasury_id = AccountId.from_string(treasury_account_id)
        transaction.set_treasury_account_id(treasury_id)

        # Handle Keys (if provided)
        if admin_key:
            transaction.set_admin_key(PrivateKey.from_string(admin_key).public_key())
        if supply_key:
            transaction.set_supply_key(PrivateKey.from_string(supply_key).public_key())
        if freeze_key:
            transaction.set_freeze_key(PrivateKey.from_string(freeze_key).public_key())
        if wipe_key:
            transaction.set_wipe_key(PrivateKey.from_string(wipe_key).public_key())
        if kyc_key:
            transaction.set_kyc_key(PrivateKey.from_string(kyc_key).public_key())
        if pause_key:
            transaction.set_pause_key(PrivateKey.from_string(pause_key).public_key())

        # Freeze
        transaction.freeze_with(client)

        # Sign with treasury key (operator by default)
        # If user provides a different treasury, they would need to sign.
        # Here we assume operator key is the treasury key or has permission.
        # But if treasury is different, we must sign with that key.
        # For simplicity based on MD example where operator is treasury:
        if treasury_id.to_string() == operator_id.to_string():
             transaction.sign(operator_key)
        
        # If keys are set, we might need to sign with admin key? 
        # MD example says: `transaction.sign(admin_key) # Required since admin key exists`
        if admin_key:
             transaction.sign(PrivateKey.from_string(admin_key))

        response = transaction.execute(client)
        
        return {
            "status": "success",
            "token_id": str(receipt.token_id),
            "name": name,
            "symbol": symbol
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

class CreateAccountRequest(BaseModel):
    initial_balance: float
    memo: str = None

@app.post("/create-account")
def create_account(request: CreateAccountRequest):
    if not client:
        return {"error": "Client not initialized"}

    try:
        new_private_key = PrivateKey.generate_ed25519()
        new_public_key = new_private_key.public_key()

        transaction = (
            AccountCreateTransaction()
            .set_key_without_alias(new_public_key)
            .set_initial_balance(Hbar(request.initial_balance))
            .set_account_memo(request.memo)
            .freeze_with(client)
        )
        
        # Sign with client operator key (payer)
        transaction.sign(operator_key)
        # Sign with new key (required)
        transaction.sign(new_private_key)
        
        rec = transaction.execute(client)
        receipt = rec.account_id
        
        return {
            "status": "success",
            "account_id": str(receipt),
            "public_key": new_public_key.to_string(),
            "initial_balance": request.initial_balance,
            "memo": request.memo
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/transactions/{account_id}")
def get_transactions(account_id: str):
    base = "https://testnet.mirrornode.hedera.com"
    url = f"{base}/api/v1/transactions?account.id={account_id}&limit=100&order=desc"
    all_transactions = []
    
    try:
        while url:
            res = requests.get(url)
            res.raise_for_status()
            data = res.json()
            
            for tx in data.get("transactions", []):
                all_transactions.append({
                    "transaction_id": tx["transaction_id"],
                    "name": tx["name"],
                    "result": tx["result"]
                })
            
            next_link = data.get("links", {}).get("next")
            url = f"{base}{next_link}" if next_link else None
            
        return {"account_id": account_id, "transactions": all_transactions}
    except Exception as e:
        return {"error": str(e)}


@app.post("/mint-token")
def mint_token(token_id: str, amount: int, admin_key: str):
    if not client:
        return {"error": "Client not initialized"}

    try:
        transaction = (
            TokenMintTransaction()
            .set_token_id(token_id)
            .set_amount(amount) # lowest denomination, must be positive and not zero
            .freeze_with(client)
        )
        transaction.sign(operator_key)
        transaction.sign(PrivateKey.from_string(admin_key))

        response = transaction.execute(client)
        receipt = response.get_receipt(client)

        return {
            "status": "success",
            "new_total_supply": str(receipt.total_supply),
            "transaction_id": str(response.transaction_id)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


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
        
        response = transaction.execute(client)
        receipt = response.get_receipt(client)
        
        return {
            "status": "success",
            "transaction_id": str(response.transaction_id)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


















'''
### working code


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
    TransactionReceipt
)
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel



load_dotenv()
app = FastAPI()
@app.get("")
def get_account_balance():
    network = Network("testnet")
    client = Client(network)

    operator_id = AccountId.from_string(os.getenv("OPERATOR_ID"))
    operator_key = PrivateKey.from_string_ed25519(os.getenv("OPERATOR_KEY"))

    client.set_operator(operator_id, operator_key)

    balance = CryptoGetAccountBalanceQuery(
        account_id=operator_id
    ).execute(client)

    print(f"balance = {balance.hbars}")

#tx = (
#    TokenCreateTransaction()
#    .set_token_name("zephyr")
#    .set_token_symbol("zph")
#    .set_token_type(TokenType.FUNGIBLE_COMMON)
#    .set_decimals(6)
#    .set_initial_supply(10_000)
#    .set_supply_type(SupplyType.FINITE)
#    .set_max_supply(10_000)
#
#    # ONLY REQUIRED FIELD
#    .set_treasury_account_id(operator_id)
#
#    .freeze_with(client)
#)


## ONE signature is enough
#tx.sign(operator_key)

#response = tx.execute(client)
#print('token created')
#info = AccountInfoQuery(account_id=operator_id).execute(client)
#print(f"Account ID: {info.account_id}")
#print(f"Account Public Key: {info.key.to_string()}")
#print(f"Account Balance: {info.balance}")
#print(f"Account Memo: '{info.account_memo}'")
#print(f"Owned NFTs: {info.owned_nfts}")
#print(f"Token Relationships: {info.token_relationships}")


new_account_private_key = PrivateKey.generate_ed25519()
new_public_key = new_account_private_key.public_key()

transaction = (
        AccountCreateTransaction()
        .set_key_without_alias(new_public_key)
        .set_initial_balance(10)
        .set_account_memo("testusingcode-1")
        .freeze_with(client)
    )
transaction.sign(client.operator_private_key)
rec = transaction.execute(client)
print(rec.account_id)
print(new_account_private_key.to_string())
print(new_public_key.to_string())

#info = AccountInfoQuery(account_id=operator_id).execute(client)
#print(f"Account ID: {info.account_id}")
#print(f"Account Public Key: {info.key.to_string()}")
#print(f"Account Balance: {info.balance}")
#print(f"Account Memo: '{info.account_memo}'")
#print(f"Owned NFTs: {info.owned_nfts}")
#print(f"Token Relationships: {info.token_relationships}")
'''

# Start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)