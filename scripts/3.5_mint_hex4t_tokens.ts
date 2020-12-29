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
const ADDRESSES = [
  '0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C',
  '0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73',
  '0x317fc875A47CAD5B8D3d3b47307E8868C2FC1539',
  '0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD',
];
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
        await hex4Token?.mint(address, ethers.utils.parseEther(DROP_AMOUNT));
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
