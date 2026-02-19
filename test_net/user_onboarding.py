from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from hiero_sdk_python import Client, PrivateKey, AccountCreateTransaction, Hbar, AccountId
import os
from dotenv import load_dotenv
from typing import Optional
from bson import ObjectId

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hedera_users_db")

try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[MONGO_DB_NAME]
    users_collection = db["users"]
    
    # Create unique index on email
    users_collection.create_index("email", unique=True)
    print(f"Connected to MongoDB at {MONGO_URI}, DB: {MONGO_DB_NAME}")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    mongo_client = None
    db = None
    users_collection = None

# Hedera Client Setup
try:
    operator_id_str = os.getenv("OPERATOR_ID")
    operator_key_str = os.getenv("OPERATOR_KEY")
    
    if not operator_id_str or not operator_key_str:
        raise ValueError("OPERATOR_ID or OPERATOR_KEY not set in .env")

    operator_id = AccountId.from_string(operator_id_str)
    operator_key = PrivateKey.from_string(operator_key_str)

    client = Client.for_testnet()
    client.set_operator(operator_id, operator_key)
except Exception as e:
    print(f"Failed to initialize Hedera client: {e}")
    client = None

# FastAPI App
app = FastAPI()

# Pydantic Schemas
class UserRegistrationRequest(BaseModel):
    name: str
    address: str
    email: EmailStr
    kyc_proof: str

class UserRegistrationResponse(BaseModel):
    status: str
    user_id: str
    hedera_account_id: str
    message: str

@app.post("/register", response_model=UserRegistrationResponse)
def register_user(user_req: UserRegistrationRequest):
    if not client:
        raise HTTPException(status_code=503, detail="Hedera client not initialized")
    if not users_collection:
        raise HTTPException(status_code=503, detail="Database connection failed")

    # Check if email already exists
    if users_collection.find_one({"email": user_req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # 1. Create Hedera Account
        new_private_key = PrivateKey.generate_ed25519()
        new_public_key = new_private_key.public_key()

        transaction = (
            AccountCreateTransaction()
            .set_key_without_alias(new_public_key)
            .set_initial_balance(Hbar(0)) # Initial balance 0
            .set_account_memo(f"User: {user_req.email}")
            .freeze_with(client)
        )
        
        # Sign with operator (payer)
        transaction.sign(operator_key)
        
        response = transaction.execute(client)
        receipt = response.get_receipt(client)
        new_account_id = str(receipt.account_id)
        
        # 2. Save to MongoDB
        user_doc = {
            "name": user_req.name,
            "address": user_req.address,
            "email": user_req.email,
            "kyc_proof": user_req.kyc_proof,
            "hedera_account_id": new_account_id,
            "hedera_public_key": str(new_public_key)
        }
        
        result = users_collection.insert_one(user_doc)
        
        return {
            "status": "success",
            "user_id": str(result.inserted_id),
            "hedera_account_id": new_account_id,
            "message": "User registered and Hedera account created successfully."
        }

    except DuplicateKeyError:
         raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
