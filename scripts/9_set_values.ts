import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { ContractFactory } from '../libs/ContractFactory';

/**
 * Explain what the script does here
 **/
const SCRIPT_NAME = 'PUT SCRIPT NAME HERE';

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

    await staking.setBasePeriod(350);
    await staking.setTotalStakedAmount(
      2349238409238409283904820394820348293482093489230
    );

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
