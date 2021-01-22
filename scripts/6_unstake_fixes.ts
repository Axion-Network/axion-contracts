import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { TestUtil } from '../test/utils/TestUtil';
import { getRestorableDeployedContracts } from './utils/get_restorable_deployed_contracts';
const ShareRateJson = require('../snapshots/share_rate_129_layer2.json');

/**
 * Unstake fixes
 **/
const SCRIPT_NAME = 'Fix v1 stakes';

const fixes = {
  '0xf8a4ca2ae4837a6de3e5dc8539206e6f193a2034': [21792],
} as any;

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

    const keys = Object.keys(fixes);
    for (var i = 0; i < keys.length; i++) {
      const staker = keys[i];
      for (var j = 0; j < fixes[staker].length; j++) {
        const sessionid = fixes[staker][j];
        console.log('Fixing staker', staker, 'session id', sessionid);
        await stakingRestorable.fixV1Stake(staker, sessionid);
      }
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
