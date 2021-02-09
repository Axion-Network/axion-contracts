import dotenv from 'dotenv';
dotenv.config();

import { ethers, network } from 'hardhat';
import { getRestorableDeployedContracts } from './utils/get_restorable_deployed_contracts';
import { TEST_NETWORKS } from '../constants/common';

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
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const {
      stakingRestorable,
      subBalancesRestorable,
    } = await getRestorableDeployedContracts(networkName);
    // 264239566464822229782847199356
    // 187801621951457551973232621777
    // await stakingRestorable.addStakedAmount('296074849488382766169407304');
    await stakingRestorable.addShareTotalSupply(
      '18388143960856716258228824305'
    );
    // console.log('Setting max share event active');
    // await subBalancesRestorable.addBPDShares([
    //   '5845982231928146848059627524',
    //   '5845982231928146848059627524',
    //   '5845982231928146848059627524',
    //   '5845982231928146848059627524',
    //   '5845982231928146848059627524',
    // ]);

    // 175991613660836568973493422471
    // 181837595892764715821553049995

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
