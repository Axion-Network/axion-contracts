import {
  getDeployedContracts,
  TEST_NETWORKS,
} from './utils/get_deployed_contracts';
import BN from 'bn.js';
import { prepareUpgrade, upgradeProxy } from '@openzeppelin/truffle-upgrades';
const Staking = artifacts.require('Staking') as any;
const SubBalances = artifacts.require('SubBalances') as any;

const STAKE_PERIOD = 350;

// FOREIGN SWAP
// TODO: I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
//       Need to clarify what they are
const SIGNER_ADDRESS = '0x849d89ffa8f91ff433a3a1d23865d15c8495cc7b';
const MAX_CLAIM_AMOUNT = '10000000000000000000000000';
const TOTAL_SNAPSHOT_AMOUNT = '370121420541683530700000000000';
const TOTAL_SNAPSHOT_ADDRESS = '183035';

module.exports = async function (
  deployer,
  network,
  [
    setterAddress,
    swapTokenAddress,
    uniswapAddress,
    recipientAddress,
    auctionV1Address,
    stakingV1Address,
    subBalancesV1Address,
  ]
) {
  if (!process.argv.includes('migrate')) {
    return;
  }

  try {
    console.log('INIT CONTRACTS');
    console.log(`Running on network: ${network}`);

    const {
      DEPLOYER_ADDRESS,
      RECIPIENT_ADDRESS,
      MANAGER_ADDRESS,
      SWAP_TOKEN_ADDRESS,
      UNISWAP_ADDRESS,
      TIME_IN_DAY,
      AUCTION_V1_ADDRESS,
      STAKING_V1_ADDRESS,
      SUB_BALANCES_V1_ADDRESS,
    } = process.env as any;

    if (!TEST_NETWORKS.includes(network)) {
      [
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        MANAGER_ADDRESS,
        UNISWAP_ADDRESS,
        TIME_IN_DAY,
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const {
      auction,
      bpd,
      foreignSwap,
      nativeSwap,
      token,
      hex4Token,
      subBalances,
      staking,
    } = await getDeployedContracts(network);

    const stakingDeployed = await Staking.deployed();
    // console.log(stakingDeployed);

    const upgradeAddress = await prepareUpgrade(
      stakingDeployed.address,
      Staking,
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    );

    console.log(upgradeAddress);
    console.log('=============== Staking contract upgaded ===============');
  } catch (err) {
    console.error(err);
    console.error(
      '============================INIT CONTRACTS: FAILED==============================='
    );
    process.exit();
  }
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
