import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { ContractFactory } from '../libs/ContractFactory';

/**
 * Deploy the new auction implementation for chosing auto stake days
 * */
const SCRIPT_NAME = 'Upgrade auction stake days';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const {
      auction,
      bpd,
      foreignSwap,
      nativeSwap,
      token,
      hex4Token,
      subBalances,
      staking,
    } = await getDeployedContracts(networkName);

    const upgradeAddress = await upgrades.prepareUpgrade(
      auction.address,
      await ContractFactory.getAuctionFactory(),
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    );

    console.log(`NEW IMPLEMENTATION ADDRESS ${upgradeAddress}`);

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
