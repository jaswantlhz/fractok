"""
Quick diagnostic: run this directly to see the exact error from the Hedera SDK
during token creation. Run from f:\fracassets\test_net\:
    python debug_token.py
"""
import os, traceback
from dotenv import load_dotenv
load_dotenv()

from hiero_sdk_python import (
    Client, AccountId, PrivateKey,
    TokenCreateTransaction, TokenType, SupplyType
)

operator_id  = AccountId.from_string(os.getenv("OPERATOR_ID"))
operator_key = PrivateKey.from_string(os.getenv("OPERATOR_KEY"))
client = Client.for_testnet()
client.set_operator(operator_id, operator_key)
print("Client OK:", operator_id)

try:
    tx = TokenCreateTransaction()
    tx.set_token_name("Debug Token")
    tx.set_token_symbol("DBG")
    tx.set_token_type(TokenType.FUNGIBLE_COMMON)
    tx.set_decimals(0)
    tx.set_initial_supply(100)
    tx.set_max_supply(1000)
    tx.set_supply_type(SupplyType.FINITE)
    tx.set_freeze_default(False)
    tx.set_treasury_account_id(operator_id)
    tx.freeze_with(client)
    tx.sign(operator_key)

    print("Executing transaction...")
    response = tx.execute(client)
    print("Response:", response)

    receipt = response.get_receipt(client)
    print("Receipt:", receipt)
    print("Token ID:", str(receipt.token_id))
    print("SUCCESS ✓")

except Exception as e:
    print("ERROR:", e)
    traceback.print_exc()
