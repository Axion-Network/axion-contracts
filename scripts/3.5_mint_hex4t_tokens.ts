import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { ethers } from 'ethers';

/**
 * Mint hex4 tokens (swap token) to the list of addresses
 **/
const SCRIPT_NAME = 'MINT FAKE TOKEN';

/* Settings */
const ADDRESSES = ['0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73'];
const DROP_AMOUNT = '500000000';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { hex4Token } = await getDeployedContracts(networkName);

    await Promise.all(
      ADDRESSES.map(async (address) => {
        await hex4Token
          ?.mint(address, ethers.utils.parseEther(DROP_AMOUNT))
          .catch(console.log);
        console.log(`Finish minting ${DROP_AMOUNT} for ${address}`);
      })
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
