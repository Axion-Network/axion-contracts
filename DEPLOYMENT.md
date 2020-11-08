# Axion Contracts deployment and initialization instructions

## Environment

At this point, we assume that setup instructions from README was executed on local machine.

In order to deploy contracts, in local directory must exist file `.env`, which contains all needed parameters for deployment.

Deployment, verification and initialization scripts actively using environment variables from this file, and all neccessary settings and parameters must be saved in it.

Example of correct `.env` file can be found in `env.example`. I put modified secret keys here too, they will not work, but may be useful for better understanding what value must be in paramater.

Next sections will contain list of required parameters for each stage.


### Breakdown of parameters in `.env` file:

#### Common parameters
* `ETHERSCAN_API_KEY` - API Key from Etherscan, needed to verify contracts through Truffle plugin. [More about Etherscan api keys](https://info.etherscan.com/api-keys/)
* `INFURA_PROJECT_ID` - Project ID from Infura. Truffle uses Infura for deployment of contracts. [More about Infura usage](https://infura.io/docs)
* `INFURA_PROJECT_SECRET` - Project secret from Infura
* `NETWORK` - This parameter will be taken at initialization stage and will choose which network will be used to send init transactions
* `SETTER_PRIV` - Private key of account, which will deploy and initialize contracts
* `SETTER_ADDRESS` - Address of account, which will deploy and initialize contracts (web3 needed to get nonce of this address to send transactions)
* `DEPLOY_GAS_LIMIT` - Amount of gas limit for transactions. Make sure that value not lower than 4 mil, with less value deployments can fail
* `DEPLOY_GAS_PRICE` - Price of gas (in gwei). Good practice is to get "fast" or even "trader" gas price from [ETH Gas Station](https://www.ethgasstation.info/). This will shorten deploy time and make it more safe.

#### Deployment parameters
* `TOKEN_NAME` - Name of token for deploy
* `TOKEN_SYMBOL` - Short symbol of token for deploy
* `SWAPPER_ADDRESS` - Address of account, which will do first swap of tokens (after deployment but before initialization)
* `HEX2T_ADDRESS` - Address of token, which will be used on first 1:1 swap of tokens (before initialization)

#### Initialization parameters 
These parameters can be supplied after successful deployment, but needed for correct initialization of contracts.

##### Addresses of deployed contracts to initialize
These values also will be provided on screen after successful run of deployment command.

* `TOKEN_ADDRESS` - Address of deployed `Token.sol`
* `NATIVE_SWAP_ADDRESS` - Address of deployed `NativeSwap.sol`
* `AUCTION_ADDRESS` - Address of deployed `Auction.sol`
* `STAKING_ADDRESS` - Address of deployed `Staking.sol`
* `FOREIGN_SWAP_ADDRESS` - Address of deployed `ForeignSwap.sol`
* `BPD_ADDRESS` - Address of deployed `BPD.sol`
* `SUBBALANCES_ADDRESS` - Address of deployed `SubBalances.sol`

##### Common initialization parameters
* `DAY_SECONDS` - Amount of seconds in day (used in formulas). For default: `86400`
* `BASE_PERIOD` - Amount of days in year (used in formulas. For default: `350`

##### Auction initialization parameters
* `UNISWAP_ADDRESS` - Address of Uniswap Router v2 contract. Used for auction buybacks. For now address is: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D, but check [Uniswap docs](https://uniswap.org/docs/v2/smart-contracts/router02/) which address they currently using
* `MANAGER_ADDRESS` - Address of account, which will be manager of auction
* `ETH_RECIPIENT` - Address of account, which will receive 20% of auction ETH

##### Foreign Swap initialization parameters
* `SIGNER_ADDRESS` - Address of account, which was signed HEX Freeclaim snapshot amounts. Must be `0x849d89FfA8F91fF433A3A1D23865d15C8495Cc7B`
* `AUTOSTAKE_PERIOD` - Amount of days to autostake freeclaimed HEX. For default: `350`
* `MAX_CLAIM_AMOUNT` - Amount of tokens (in wei) for upper-limiting freeclaimed HEX. For default: `10000000000000000000000000`
* `TOTAL_SNAPSHOT_AMOUNT` - Amount of tokens in HEX Freeclaim snapshot. Will be used for calculation of bonuses. Must be `370121420541683530700000000000`
* `TOTAL_SNAPSHOT_ADDRESSES` - Amount of account in HEX Freeclaim snapshot. Will be used for calculation bonuses. Must be `183035`


## Deployment Instructions

Requirement parameter of `.env` file:
* `INFURA_PROJECT_ID`
* `INFURA_PROJECT_SECRET`
* `SETTER_ADDRESS`
* `SETTER_PRIV`
* `DEPLOY_GAS_LIMIT`
* `DEPLOY_GAS_PRICE`
* `TOKEN_NAME`
* `TOKEN_SYMBOL`
* `SWAPPER_ADDRESS` 
* `HEX2T_ADDRESS`

Steps to deploy:
1. Create `.env` file
2. Choose network to deploy. Possible options are:
  * `live` - Ethereum Mainnet
  * `ropsten` - Ropsten Testnet
  * `kovan` - Kovan Testnet
  * `rinkeby` - Rinkeby Testnet
5. Run `truffle migrate --reset --network <network_name>` - this will deploy contract.
  * For example, command `truffle migrate --reset network live` will deploy contracts to Ethereum Mainnet
6. After successful deployment, final contract addresses will be displayed in console. Additionaly, will be generated code to paste in `.env` file (needed for initialization of contracts

## Verification Instructions
Package file contains dependency of [truffle-plugin-verify](https://www.npmjs.com/package/truffle-plugin-verify). This plugin allows automatically verify contracts through Truffle and Etherscan API. 

**Important**
Verification must be executed at the same machine, at the same contract directory, which contain builded and deployed contracts. Verification plugin actively uses artifacts of local compiled contracts.

Requirement parameter of `.env` file:
* ETHERSCAN_API_KEY

Steps to verify:
1. Run `./verify-contracts.sh <network_name>` and this will verify contracts
  * For example, command `./verify-contracts.sh live` will verify contracts in Ethereum Mainnet


## Initialization Instructions
Repository contrains Python script which can be used for initializaion of contracts. To all of contracts will be send transaction with call of `init` function, in which all neded arguments will be passed. Arguments taken fron `.env`

**Important**
Initialization must be executed at the same machine, at the same contract directory, which contain builded and deployed contracts
Initialization script actively uses artifacts of local compiled contracts.

**Important**
In scripts before, `live` was used as name definition of Ethereum Mainnet. On initialization script, I use `mainnet` name definition. E.g. for init, in `.env` file `NETWORK=mainnet` will be correct for initialization.

Requirement parameter of `.env` file:
* All possible parameters from breakdown (above) must be filled.

Steps to initialize:
1. Create new Python environment in current directory. For example on Linux: `python3 -m venv venv`
2. Activate Python environment: `source venv/bin/activate`
3. Install dependencies: `pip install -r python-requirements.txt`
  * If dependency installation fails, run: `pip install wheel` and try to install them again
4. Make sure all parameters set in `.env` file
7. Run script to initalize contracts: `python init_contracts.py all` - this will initialize contracts in sequence
  * If one of initialization fails, you can run `python init_contracts.py <contract>` to send transaction manually. `<contract>` can be: `all`, `staking`, `auction`, `nativeswap`, `foreignswap`, `bpd`, `subbalances`, `token`

