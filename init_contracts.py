import os
import sys
import time
import json
import requests
import argparse
from web3 import Web3, WebsocketProvider
from web3.exceptions import TransactionNotFound
from dotenv import load_dotenv


class ContractInitializer:

    def __init__(self):
        self.contracts_env = {}
        self.contracts_abi = {}

        self.load_contracts_dotenv()
        self.prepare_env()
        self.load_contracts_abi()

        network = self.contracts_env['deployment_settings']['network']
        infura_project_id = self.contracts_env['deployment_settings']['infura_project_id']
        infura_project_secret = self.contracts_env['deployment_settings']['infura_project_secret']
        self.infura_url = f'wss://:{infura_project_secret}@{network}.infura.io/ws/v3/{infura_project_id}'

        self.web3interface = Web3(WebsocketProvider(self.infura_url))


    @staticmethod
    def load_contracts_dotenv():
        path = os.path.join(os.getcwd(), '.env')
        load_dotenv(dotenv_path=path)

    def prepare_env(self):
        contracts_env = {}

        # Deployer configuration
        deployment_settings = {
            'infura_project_id': os.getenv('INFURA_PROJECT_ID'),
            'infura_project_secret': os.getenv('INFURA_PROJECT_SECRET'),
            'network': os.getenv('NETWORK'),
            'setter_priv': os.getenv('SETTER_PRIV'),
            'setter_address': os.getenv('SETTER_ADDRESS'),
            'gas_limit': os.getenv('DEPLOY_GAS_LIMIT'),
            'gas_price': os.getenv('DEPLOY_GAS_PRICE')
        }
        self.check_settings(deployment_settings)
        contracts_env['deployment_settings'] = deployment_settings

        # Contract addresses
        contracts_addresses = {
            'token': os.getenv('TOKEN_ADDRESS'),
            'native_swap': os.getenv('NATIVE_SWAP_ADDRESS'),
            'auction': os.getenv('AUCTION_ADDRESS'),
            'staking': os.getenv('STAKING_ADDRESS'),
            'foreign_swap': os.getenv('FOREIGN_SWAP_ADDRESS'),
            'bpd': os.getenv('BPD_ADDRESS'),
            'subbalances': os.getenv('SUBBALANCES_ADDRESS'),
            'uniswap_router': os.getenv('UNISWAP_ADDRESS'),
            'hex2t_token': os.getenv('HEX2T_ADDRESS')
        }
        self.check_settings(contracts_addresses)
        contracts_env['contracts_addresses'] = contracts_addresses

        # Additional params for init
        init_params = {
            # Common
            'day_seconds': os.getenv('DAY_SECONDS'),
            'base_period': os.getenv('BASE_PERIOD'),

            # Auction
            'manager': os.getenv('MANAGER_ADDRESS'),
            'eth_recipient': os.getenv('ETH_RECIPIENT'),

            # Foreign Swap
            'signer': os.getenv('SIGNER_ADDRESS'),
            'autostake_period': os.getenv('AUTOSTAKE_PERIOD'),
            'max_claim_amount': os.getenv('MAX_CLAIM_AMOUNT'),
            'total_snapshot_amount': os.getenv('TOTAL_SNAPSHOT_AMOUNT'),
            'total_snapshot_addresses': os.getenv('TOTAL_SNAPSHOT_ADDRESSES')
        }
        self.check_settings(init_params)

        contracts_env['init_params'] = init_params
        self.contracts_env = contracts_env

    @staticmethod
    def check_settings(dictionary):
        for key, value in dictionary.items():
            if not value:
                raise Exception(f'Value for parameter {key} not found. Aborting')

    @staticmethod
    def load_contract_file(contract_filename):
        build_dir = os.path.join(os.getcwd(), 'build/contracts')

        with open(os.path.join(build_dir, contract_filename), 'r') as contract:
            return json.load(contract)['abi']

    def load_contracts_abi(self):
        token_file = 'Token.json'
        native_swap_file = 'NativeSwap.json'
        auction_file = 'Auction.json'
        staking_file = 'Staking.json'
        foreign_swap_file = 'ForeignSwap.json'
        bpd_file = 'BPD.json'
        subbalances_file = 'SubBalances.json'

        abi_dict = {
            'token': self.load_contract_file(token_file),
            'native_swap': self.load_contract_file(native_swap_file),
            'auction': self.load_contract_file(auction_file),
            'staking': self.load_contract_file(staking_file),
            'foreign_swap': self.load_contract_file(foreign_swap_file),
            'bpd': self.load_contract_file(bpd_file),
            'subbalances': self.load_contract_file(subbalances_file)
        }

        self.contracts_abi = abi_dict

    def load_contract(self, contract_address, abi):
        contract_instance = self.web3interface.eth.contract(address=contract_address, abi=abi)
        return contract_instance

    def sign_send_tx(self, contract_tx):
        setter_address = self.contracts_env['deployment_settings']['setter_address']
        setter_priv = self.contracts_env['deployment_settings']['setter_priv']
        gas_limit = self.contracts_env['deployment_settings']['gas_limit']
        gas_price = self.contracts_env['deployment_settings']['gas_price']

        nonce = self.web3interface.eth.getTransactionCount(setter_address, 'pending')
        chain_id = self.web3interface.eth.chainId

        tx_fields = {
            'chainId': chain_id,
            'gas': int(gas_limit),
            'gasPrice': self.web3interface.toWei(gas_price, 'gwei'),
            'nonce': nonce
        }

        tx = contract_tx.buildTransaction(tx_fields)
        signed = self.web3interface.eth.account.sign_transaction(tx, setter_priv)
        raw_tx = signed.rawTransaction
        return self.web3interface.eth.sendRawTransaction(raw_tx)

    def check_tx_success(self, tx):
        try:
            receipt = self.web3interface.eth.getTransactionReceipt(tx)
            if receipt['status'] == 1:
                return True
            else:
                return False
        except TransactionNotFound:
            return False

    def check_tx_on_retry(self, tx):
        retries = 0
        tx_found = False

        print('Checking transaction until found in network', flush=True)
        while retries <= 15:
            tx_found = self.check_tx_success(tx)
            if tx_found:
                print('Ok, found transaction and it was completed', flush=True)
                return True
            else:
                time.sleep(10)

        if not tx_found:
            print('Transaction receipt not found in 150 seconds. Supposedly it failed, please check hash on Etherscan',
                  flush=True
                  )
            print('Stopping init for now', flush=True)
            return False

    def init_staking_contract(self):
        print('Initializing Staking contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['staking']
        contract_abi = self.contracts_abi['staking']
        contract = self.load_contract(contract_address, contract_abi)

        
        tx = contract.functions.init(
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['auction'],
            self.contracts_env['contracts_addresses']['subbalances'],
            self.contracts_env['contracts_addresses']['foreign_swap'],
            int(self.contracts_env['init_params']['day_seconds']),
        )

        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)
        
        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_auction_contract(self):
        print('Initializing Auction contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['auction']
        contract_abi = self.contracts_abi['auction']
        contract = self.load_contract(contract_address, contract_abi)

        tx = contract.functions.init(
            int(self.contracts_env['init_params']['day_seconds']),
            self.contracts_env['init_params']['manager'],
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['staking'],
            self.contracts_env['contracts_addresses']['uniswap_router'],
            self.contracts_env['init_params']['eth_recipient'],
            self.contracts_env['contracts_addresses']['native_swap'],
            self.contracts_env['contracts_addresses']['foreign_swap'],
            self.contracts_env['contracts_addresses']['subbalances'],
        )

    
        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)

            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_native_swap_contract(self):
        print('Initializing Native Swap contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['native_swap']
        contract_abi = self.contracts_abi['native_swap']
        contract = self.load_contract(contract_address, contract_abi)

        
        tx = contract.functions.init(
            int(self.contracts_env['init_params']['base_period']),
            int(self.contracts_env['init_params']['day_seconds']),
            self.contracts_env['contracts_addresses']['hex2t_token'],
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['auction'],
        )

        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_foreign_swap_contract(self):
        print('Initializing Foreigm Swap contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['foreign_swap']
        contract_abi = self.contracts_abi['foreign_swap']
        contract = self.load_contract(contract_address, contract_abi)

        tx = contract.functions.init(
            self.contracts_env['init_params']['signer'],
            int(self.contracts_env['init_params']['day_seconds']),
            int(self.contracts_env['init_params']['autostake_period']),
            int(self.contracts_env['init_params']['max_claim_amount']),
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['auction'],
            self.contracts_env['contracts_addresses']['staking'],
            self.contracts_env['contracts_addresses']['bpd'],
            int(self.contracts_env['init_params']['total_snapshot_amount']),
            int(self.contracts_env['init_params']['total_snapshot_addresses']),
        )

        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_bpd_contract(self):
        print('Initializing BPD contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['bpd']
        contract_abi = self.contracts_abi['bpd']
        contract = self.load_contract(contract_address, contract_abi)

        tx = contract.functions.init(
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['foreign_swap'],
            self.contracts_env['contracts_addresses']['subbalances'],
        )
        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_subbalance_contract(self):
        print('Initializing SubBalance contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['subbalances']
        contract_abi = self.contracts_abi['subbalances']
        contract = self.load_contract(contract_address, contract_abi)

        tx = contract.functions.init(
            self.contracts_env['contracts_addresses']['token'],
            self.contracts_env['contracts_addresses']['foreign_swap'],
            self.contracts_env['contracts_addresses']['bpd'],
            self.contracts_env['contracts_addresses']['auction'],
            self.contracts_env['contracts_addresses']['staking'],
            int(self.contracts_env['init_params']['day_seconds']),
            int(self.contracts_env['init_params']['base_period']),
        )
        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)

    def init_token_contract(self):
        print('Initializing Token contract', flush=True)

        contract_address = self.contracts_env['contracts_addresses']['token']
        contract_abi = self.contracts_abi['token']
        contract = self.load_contract(contract_address, contract_abi)

        tx = contract.functions.init([
            self.contracts_env['contracts_addresses']['native_swap'],
            self.contracts_env['contracts_addresses']['auction'],
            self.contracts_env['contracts_addresses']['staking'],
            self.contracts_env['contracts_addresses']['foreign_swap'],
            self.contracts_env['contracts_addresses']['subbalances'],
        ])
        print('Raw transaction:', flush=True)
        print(tx.__dict__, flush=True)

        try:
            tx_hash = self.sign_send_tx(tx)
            print('Transaction hash:', tx_hash.hex(), flush=True)
            return tx_hash

        except Exception as e:
            print('Transaction failed to send, reason:', e)


def init_staking(initializer_instance):
    staking_tx = initializer_instance.init_staking_contract()
    if not initializer_instance.check_tx_on_retry(staking_tx):
        sys.exit()

def init_auction(initializer_instance):
    auction_tx = initializer_instance.init_auction_contract()
    if not initializer_instance.check_tx_on_retry(auction_tx):
        sys.exit()

def init_nativeswap(initializer_instance):
    nativeswap_tx = initializer_instance.init_native_swap_contract()
    if not initializer_instance.check_tx_on_retry(nativeswap_tx):
        sys.exit()

def init_foreignswap(initializer_instance):
    foreignswap_tx = initializer_instance.init_foreign_swap_contract()
    if not initializer_instance.check_tx_on_retry(foreignswap_tx):
        sys.exit()

def init_bpd(initializer_instance):
    bpd_tx = initializer_instance.init_bpd_contract()
    if not initializer_instance.check_tx_on_retry(bpd_tx):
        sys.exit()

def init_subbalances(initializer_instance):
    subbalances_tx = initializer_instance.init_subbalance_contract()
    if not initializer_instance.check_tx_on_retry(subbalances_tx):
        sys.exit()

def init_token(initializer_instance):
    token_tx = initializer_instance.init_token_contract()
    if not initializer_instance.check_tx_on_retry(token_tx):
        sys.exit()

def get_initializer():
    return ContractInitializer()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    helpstring = 'Name of contract. Can be: all, staking, auction, nativeswap, foreignswap, bpd, subbalances, token'
    parser.add_argument("contract", help=helpstring)
    args = parser.parse_args()

    contract_list = ["all", "staking", "auction", "nativeswap", "foreignswap", "bpd", "subbalances", "token"]
    if args.contract is None or args.contract not in contract_list:
        print('Contract(s) not specified or does not allowed', flush=True)
        sys.exit()

    initializer = get_initializer()

    if args.contract == 'all':
        init_staking(initializer)
        init_auction(initializer)
        init_nativeswap(initializer)
        init_foreignswap(initializer)
        init_bpd(initializer)
        init_subbalances(initializer)
        init_token(initializer)
    elif args.contract == 'staking':
        init_staking(initializer)
    elif args.contract == 'auction':
        init_auction(initializer)
    elif args.contract == 'nativeswap':
        init_nativeswap(initializer)
    elif args.contract == 'foreignswap':
        init_foreignswap(initializer)
    elif args.contract == 'bpd':
        init_bpd(initializer)
    elif args.contract == 'subbalances':
        init_subbalances(initializer)
    elif args.contract == 'token':
        init_token(initializer)

    print('Initialization completed successfully')













