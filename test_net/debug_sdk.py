from hiero_sdk_python import AccountId, Client, TransferTransaction, EvmAddress

print("Dir AccountId:", dir(AccountId))
try:
    print("AccountId constructor doc:", AccountId.__doc__)
except:
    pass

try:
    # Try typical ways to create from EVM
    evm_fake = bytes.fromhex("8d59ffa13d117a107284690235fd33eef1dee56a")
    acc = AccountId.from_evm_address(evm_fake)
    print("Found from_evm_address:", acc)
except Exception as e:
    print("No from_evm_address:", e)

try:
    # Try constructor kwargs
    acc2 = AccountId(0, 0, 0, evm_address=evm_fake)
    print("Found constructor kwargs:", acc2)
except Exception as e:
    print("No constructor kwargs:", e)
