import dotenv from 'dotenv';
dotenv.config();

import { network, ethers, upgrades } from 'hardhat';
import path from 'path';
import fs from 'fs';
import { TEST_NETWORKS } from '../../constants/common';
import { ContractFactory } from '../../libs/ContractFactory';
import {
  TokenRestorable,
} from '../../typechain';

const TOKEN_NAME = 'Wrapped Bitcoin';
const TOKEN_SYMBOL = 'wBTC';

/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'DEPLOY ERC20';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const {
      DEPLOYER_ADDRESS,
      MANAGER_ADDRESS,
      SWAP_TOKEN_ADDRESS,
    } = process.env;

    if (!TEST_NETWORKS.includes(networkName)) {
      [DEPLOYER_ADDRESS, MANAGER_ADDRESS, SWAP_TOKEN_ADDRESS].forEach(
        (value) => {
          if (!value) {
            throw new Error('Please set the value in .env file');
          }
        }
      );
    }

    const [deployer, manager] = await ethers.getSigners();
    const deployerAddress = DEPLOYER_ADDRESS ?? deployer.address;
    const managerAddress = MANAGER_ADDRESS ?? manager.address;

    const token = (await upgrades.deployProxy(
      await ContractFactory.getTokenRestorableFactory(),
      [managerAddress, deployerAddress, TOKEN_NAME, TOKEN_SYMBOL],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as TokenRestorable;
    console.log('Deployed: ERC20', token.address);

    await token.init([managerAddress]);

    await token.mint(
      '0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73',
      '1000000000000000000000000000'
    );

    await token.mint(
      '0xcFB56b3eE67C3FC890EF660A40fbccAFdCA84d6f',
      '1000000000000000000000000000'
    );

    await token.mint(
      '0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD',
      '1000000000000000000000000000'
    );

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'test-ERC20.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          TOKEN_ADDRESS: token.address,
        },
        null,
        2
      ),
      { flag: 'w' }
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
