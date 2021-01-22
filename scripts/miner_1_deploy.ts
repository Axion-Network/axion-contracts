import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { ContractFactory } from '../libs/ContractFactory';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import path from 'path';
import fs from 'fs';
import { AxionMineManager } from '../typechain';

/**
 * Deploys Axion Mine Manager
 **/
const SCRIPT_NAME = 'CREATE MINER';

const main = async () => {
  const networkName = network.name;

  const {
    DEPLOYER_ADDRESS,
    UNISWAP_FACTORY,
    NFT1_ADDRESS,
    NFT2_ADDRESS,
    NFT3_ADDRESS,
  } = process.env;

  const { token } = await getDeployedContracts(networkName);

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );

    const mineManager = (await upgrades.deployProxy(
      await ContractFactory.getAxionMineManagerFactory(),
      [
        DEPLOYER_ADDRESS ?? '',
        token.address,
        NFT1_ADDRESS ?? '',
        NFT2_ADDRESS ?? '',
        NFT3_ADDRESS ?? '',
        UNISWAP_FACTORY ?? '',
      ],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as AxionMineManager;

    // const mineManagerFactory = await ContractFactory.getAxionMineManagerFactory();
    // const mineManager = await mineManagerFactory.deploy();
    console.log('Mine Manager Initialized', mineManager.address);

    await mineManager.setupRole(
      await mineManager.MANAGER_ROLE(),
      '0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73'
    );
    await mineManager.setupRole(
      await mineManager.MANAGER_ROLE(),
      '0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD'
    );

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'mineaddress.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          MINE_MANAGER: mineManager.address,
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
