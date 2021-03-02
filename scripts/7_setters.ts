import dotenv from 'dotenv';
dotenv.config();

import { ethers, network } from 'hardhat';
import { getMiningContract } from './utils/get_mining_contract';
import { getRestorableDeployedContracts } from './utils/get_restorable_deployed_contracts';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { TEST_NETWORKS } from '../constants/common';
import { BigNumber } from 'ethers';

// FOREIGN SWAP
// I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
// Need to clarify what they are

/**
 * INIT CONTRACTS (After deployment / snapshot restoration)
 **/
const SCRIPT_NAME = 'CUSTOM SETTERS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

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
      STAKE_PERIOD,
      MINE_MANAGER2,
    } = process.env as any;

    if (!TEST_NETWORKS.includes(networkName)) {
      [
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        MANAGER_ADDRESS,
        SWAP_TOKEN_ADDRESS,
        UNISWAP_ADDRESS,
        TIME_IN_DAY,
        AUCTION_V1_ADDRESS,
        STAKING_V1_ADDRESS,
        SUB_BALANCES_V1_ADDRESS,
        STAKE_PERIOD,
        MINE_MANAGER2,
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    // const { bpdRestorable } = await getRestorableDeployedContracts(networkName);
    const { auctionManager } = await getDeployedContracts(networkName);
    // const r = await bpdRestorable.setupRole(
    //   `0x843c3a00fa95510a35f425371231fd3fe4642e719cb4595160763d6d02594b50`,
    //   '0x5be5e5a2c372Ff794a0788066d6c2D649E2EE245'
    // );
    // r.wait();
    // console.log('HAS ROLE', hasRole);
    // const bpdAddressForAM = await auctionManager?.addresses();
    // console.log(bpdAddressForAM);
    await auctionManager?.sendToBPD('50000000000');

    console.log(
      `============================ ${SCRIPT_NAME}: DONE ===============================`
    );
  } catch (e) {
    console.error(
      `============================ ${SCRIPT_NAME}: FAILED ===============================`
    );
    throw e;
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
