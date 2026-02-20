from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient, UpdateOne
import os
import requests
from dotenv import load_dotenv
import traceback
from hiero_sdk_python import (
    Client,
    AccountId,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    Network,
    TransferTransaction,
    AccountInfoQuery
)
import time

print("\n\n=== STARTING SYNCHRONIZATION SERVICE V2.1 (Hedera + Auth0) ===\n\n")

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hedera_users_db")
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "YOUR_AUTH0_DOMAIN.us.auth0.com") # Placeholder

# Initialize MongoDB
try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[MONGO_DB_NAME]
    users_collection = db["users"]
    # Index on Auth0 ID (primary key for us)
    users_collection.create_index("auth0_id", unique=True)
    # Optional: Index on Hedera Account ID too
    users_collection.create_index("hedera_account_id", unique=False) # One user might own multiple accounts? Or unique?
    # Usually unique per platform account.
    print(f"Connected to MongoDB at {MONGO_URI}, DB: {MONGO_DB_NAME}")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    mongo_client = None
    users_collection = None

# Initialize Hedera Client
try:
    operator_id_str = os.getenv("OPERATOR_ID")
    operator_key_str = os.getenv("OPERATOR_KEY")

    if not operator_id_str or not operator_key_str:
        print("Hedera credentials missing in .env")
        client = None
        operator_key = None
    else:
        operator_id = AccountId.from_string(operator_id_str)
        operator_key = PrivateKey.from_string(operator_key_str)

        client = Client.for_testnet()
        client.set_operator(operator_id, operator_key)
        print("Hedera Client initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Hedera Client: {e}")
    client = None
    operator_key = None

app = FastAPI()

# Input: Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SyncUserRequest(BaseModel):
    wallet_address: str # EVM address
    hedera_account_id: str = None # Optional now

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "mongo": users_collection is not None,
        "auth0_domain": AUTH0_DOMAIN
    }

@app.post("/sync-user")
def sync_user(
    request: SyncUserRequest,
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]

    # 1. Verify Token with Auth0
    # We use the /userinfo endpoint to validate the token and get user profile
    try:
        userinfo_url = f"https://{AUTH0_DOMAIN}/userinfo"
        response = requests.get(userinfo_url, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code != 200:
             raise HTTPException(status_code=401, detail="Invalid Auth0 Token")
        
        user_profile = response.json()
        auth0_id = user_profile.get("sub")
        email = user_profile.get("email")
        name = user_profile.get("name")
        
    except requests.RequestException as e:
         raise HTTPException(status_code=503, detail=f"Failed to verify with Auth0: {str(e)}")

    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection failed")

    try:
        # 2. Check/Upsert User in MongoDB
        # We try to find existing user first to avoiding re-creating account if they just logged in from new device
        existing_user = users_collection.find_one({"auth0_id": auth0_id})

        final_hedera_id = None
        
        # Scenario A: User sends an ID (MetaMask Snap found it)
        if request.hedera_account_id:
             final_hedera_id = request.hedera_account_id
        
        # Scenario B: User did NOT send an ID (New wallet or Snap didn't find it)
        else:
             if existing_user and existing_user.get("hedera_account_id"):
                 # We already have it on record
                 final_hedera_id = existing_user["hedera_account_id"]
             else:
                 # CREATE NEW HEDERA ACCOUNT (Aliased to EVM Address)
                 # This allows the user to control it with their MetaMask private key
                 print(f"Creating new Hedera account for EVM address: {request.wallet_address}")
                 try:
                     # Convert 0x... to evm address string
                     evm_address_str = request.wallet_address if request.wallet_address.startswith("0x") else f"0x{request.wallet_address}"
                     evm_bytes = bytes.fromhex(evm_address_str.replace("0x", ""))

                     # Correct signature: from_evm_address(evm_address, shard, realm)
                     # Shard and realm are both 0 on testnet/mainnet.
                     evm_account_id_for_transfer = AccountId.from_evm_address(evm_address_str, 0, 0)

                     transaction = (
                        TransferTransaction()
                        .add_hbar_transfer(operator_id, Hbar(-10)) # Debit operator
                        .add_hbar_transfer(evm_account_id_for_transfer, Hbar(10)) # Lazy-create via EVM alias
                        .set_transaction_memo(f"Auth0: {email}") # Optional memo
                        .freeze_with(client)
                     )
                     transaction.sign(operator_key)
                     response = transaction.execute(client)
                     # Wait one beat, then query for the real Hedera Account ID
                     # (AccountCreateTransaction implicitly creates an account, but we used TransferTransaction)
                     # (So we query via the EVM Address to get the 0.0.x ID)
                     try:
                         # The AccountInfoQuery might need the EVM address as AccountId
                         # Some SDKs allow AccountId(evm_address=...) or similar
                         # Let's try passing EvmAddress directly if supported, or wrapped
                        # AFTER (fixed)

                         time.sleep(5)  # Allow network time to finalize the lazy-create
                         
                         evm_account_id = AccountId.from_evm_address(evm_address_str, 0, 0)
                         info_query = AccountInfoQuery()
                         info_query.set_account_id(evm_account_id)
                         
                         account_info = info_query.execute(client)
                         final_hedera_id = str(account_info.account_id)
                         print(f"Lazy Created Account ID: {final_hedera_id}")
                     except Exception as info_err:
                         print(f"Could not fetch info for new account, using EVM as fallback: {info_err}")
                         final_hedera_id = f"0x{evm_bytes.hex()}"
                     
                     print(f"Final Hedera ID used: {final_hedera_id}")
                 except Exception as hedera_err:
                     print(f"Hedera Creation Failed: {hedera_err}")
                     # Ensure we don't crash the sync, but we return no ID
                     raise hedera_err

        update_doc = {
            "$set": {
                "auth0_id": auth0_id,
                "email": email,
                "name": name,
                "hedera_account_id": final_hedera_id,
                "wallet_address": request.wallet_address,
                "last_login": "NOW" 
            }
        }
        
        result = users_collection.update_one(
            {"auth0_id": auth0_id},
            update_doc,
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "User synced successfully",
            "auth0_id": auth0_id,
            "hedera_account_id": final_hedera_id
        }

    except Exception as e:
        # Log full error safely
        error_msg = f"Error syncing user (Auth0 ID: {auth0_id if 'auth0_id' in locals() else 'Unknown'}): {str(e)}"
        print(error_msg) # Print to console for immediate visibility
        
        try:
            with open("error.log", "a") as f:
                f.write(f"{error_msg}\n")
                traceback.print_exc(file=f)
                f.write("\n-------------------\n")
        except:
            pass # Look, if logging fails, just don't crash the crash handler.
        
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# Start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)