import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { ROLES } from '../constants/roles';
import { TestUtil } from '../test/utils/TestUtil';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { getDeployedContractsV1 } from './utils/get_v1_deployed_contracts';

/**
 * Explain what the script does here
 **/
const SCRIPT_NAME = 'Fix v1 stakes';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { staking } = await getDeployedContracts(networkName);

    // let sessionV2 = await staking.sessionDataOf(
    //   '0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C',
    //   1
    // );
    // console.log('Shares before', sessionV2.shares.toString());
    // await staking.setupRole(
    //   ROLES.MANAGER,
    //   '0x98C8088802EE7ED7459a59A1090CB6Fc14FDe9b9'
    // );
    // await staking.setShareRate('127000000000000000');
    // console.log('Share Rate', await staking.shareRate().then(String));

    // await staking.fixShareRateOnStake(
    //   '0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C',
    //   1
    // );
    // sessionV2 = await staking.sessionDataOf(
    //   '0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C',
    //   1
    // );
    // console.log('Shares after', sessionV2.shares.toString());

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
