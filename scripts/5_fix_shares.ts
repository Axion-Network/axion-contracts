import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { TestUtil } from '../test/utils/TestUtil';
import { getRestorableDeployedContracts } from './utils/get_restorable_deployed_contracts';
const ShareRateJson = require('../snapshots/share_rate_129_layer2.json');

/**
 * Explain what the script does here
 **/
const SCRIPT_NAME = 'Fix v2 shares';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { stakingRestorable } = await getRestorableDeployedContracts(
      networkName
    );

    if (ShareRateJson.address.length !== ShareRateJson.sessionID.length)
      throw new Error('Lengths: Addresses !== SessionIDs');

    for (var i = 0; i < ShareRateJson.address.length; i++) {
      const staker = ShareRateJson.address[i];
      const sessionId = ShareRateJson.sessionID[i];
      const session = await stakingRestorable.sessionDataOf(staker, sessionId);
      if (!session.withdrawn) {
        console.log('Fixing ', staker, 'with session id', sessionId);
        console.log('Old share', session.shares.toString());
        await stakingRestorable.fixShareRateOnStake(staker, sessionId);
      } else {
        console.log('Session has been withdrawn', staker);
      }
      console.log('=====Finished=====');
    }

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

async function testRun() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  });
}
