import subprocess
import time
import requests
import sys
import os
import warnings

# Ignore warnings as requested
warnings.filterwarnings("ignore")

def run_verification():
    print("Starting FastAPI server...")
    # Start uvicorn in a separate process
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "test_net.testnet_test:app", "--port", "8000"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))), # Run from parent dir of test_net
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(5)  # Wait for server to start

    try:
        base_url = "http://127.0.0.1:8000"
        operator_id = "0.0.7898625" 

        # 1. Test /balance
        print(f"\n--- Testing GET {base_url}/balance?account_id={operator_id} ---")
        try:
            res = requests.get(f"{base_url}/balance", params={"account_id": operator_id})
            print(f"Status: {res.status_code}")
            print(f"Response: {res.json()}")
        except Exception as e:
            print(f"Balance check failed: {e}")

        # 2. Test /transactions
        print(f"\n--- Testing GET {base_url}/transactions/{operator_id} ---")
        try:
            res = requests.get(f"{base_url}/transactions/{operator_id}")
            print(f"Status: {res.status_code}")
            data = res.json()
            if "transactions" in data:
                print(f"Found {len(data['transactions'])} transactions.")
                if len(data['transactions']) > 0:
                    print(f"First tx: {data['transactions'][0]}")
            else:
                print(f"Response: {data}")
        except Exception as e:
            print(f"Transactions check failed: {e}")

        # 3. Test /create-token
        print(f"\n--- Testing POST {base_url}/create-token ---")
        try:
            params = {
                "name": "VerifyToken",
                "symbol": "VFY",
                "decimals": 2,
                "initial_supply": 1000,
                "max_supply": 10000,
                "token_type": "FUNGIBLE_COMMON",
                "supply_type": "FINITE"
            }
            res = requests.post(f"{base_url}/create-token", params=params)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.json()}")
        except Exception as e:
            print(f"Create Token failed: {e}")

        # 4. Test /create-account
        print(f"\n--- Testing POST {base_url}/create-account ---")
        try:
            params = {
                "initial_balance": 1.0,
                "memo": "VerificationTest"
            }
            res = requests.post(f"{base_url}/create-account", params=params)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.json()}")
        except Exception as e:
            print(f"Create Account failed: {e}")

    finally:
        print("\nStopping server...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        
        # Print server output only if needed for debugging
        # stdout, stderr = process.communicate()
        # if stderr: print(f"Server Errors:\n{stderr.decode()}")

if __name__ == "__main__":
    run_verification()

