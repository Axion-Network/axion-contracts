import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
import { task, HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-etherscan';
import dotenv from 'dotenv';
import { NetworkUserConfig } from 'hardhat/types';
dotenv.config();

/* uncomment to see the gas report after running the test */
// import 'hardhat-gas-reporter'

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const {
  ETHERSCAN_API_KEY,
  INFURA_URL,
  DEPLOYER_SECRET,
  DEPLOY_GAS_LIMIT,
  DEPLOY_GAS_PRICE,
} = process.env;

const getNetworkConfig = (chainId: number) => {
  if (
    !INFURA_URL ||
    !DEPLOYER_SECRET ||
    !DEPLOY_GAS_LIMIT ||
    !DEPLOY_GAS_PRICE
  ) {
    return {
      url: 'please update .env file',
    } as NetworkUserConfig;
  }

  return {
    chainId,
    url: INFURA_URL,
    accounts: [DEPLOYER_SECRET],
    gas: Number(DEPLOY_GAS_LIMIT),
    gasPrice: Number(DEPLOY_GAS_PRICE) * 1000000000, // gwei unit
    timeout: 600 * 1000, // milliseconds
    throwOnCallFailures: true,
    throwOnTransactionFailures: true,
    loggingEnabled: true,
  } as NetworkUserConfig;
};

export default {
  networks: {
    dev: {
      url: 'http://127.0.0.1:8545/',
    },
    ropsten: getNetworkConfig(3),
    rinkeby: getNetworkConfig(4),
    live: getNetworkConfig(1),
  },
  solidity: {
    version: '0.6.8',
    settings: {
      optimizer: {
        enabled: true,
        runs: 0,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
} as HardhatUserConfig;
