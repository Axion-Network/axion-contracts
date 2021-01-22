import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { ContractFactory } from '../libs/ContractFactory';
import path from 'path';
import fs from 'fs';

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

    const tokenFactory = await ContractFactory.getTERC721Factory();

    // NFT 1
    const NFT1 = await tokenFactory.deploy('NFT1-1', 'NFT1');
    console.log('NFT1 finished deploying', NFT1.address);
    await NFT1.mint(`0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD`);
    await NFT1.mint(`0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C`);
    await NFT1.mint(`0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73`);
    console.log('Finished minting NFT1');
    // NFT 2
    const NFT2 = await tokenFactory.deploy('NFT2-2', 'NFT2');
    console.log('NFT2 finished deploying', NFT2.address);
    await NFT2.mint(`0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD`);
    await NFT2.mint(`0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C`);
    await NFT2.mint(`0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73`);
    console.log('Finished minting NFT2');
    // NFT 3
    const NFT3 = await tokenFactory.deploy('NFT3-3', 'NFT3');
    console.log('NFT3 finished deploying', NFT3.address);
    await NFT3.mint(`0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD`);
    await NFT3.mint(`0x058D55E9BDBDc42637f9fAc4f4F86D7002D5CD4C`);
    await NFT3.mint(`0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73`);
    console.log('Finished minting NFT3');

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'NFTaddresses.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          NFT1_ADDRESS: NFT1.address,
          NFT2_ADDRESS: NFT2.address,
          NFT3_ADDRESS: NFT3.address,
        },
        null,
        2
      )
    );
    console.log('Contracts addresses saved to', addressFilePath.toString());

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
