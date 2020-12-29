import dotenv from 'dotenv';
dotenv.config();

import { ethers, network, upgrades } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { ContractFactory } from '../libs/ContractFactory';
import { AuctionManager } from '../typechain';
import fs from 'fs';
import path from 'path';
const ADDRESSES = require('../deployed-addresses/addresses.json');

/**
 * Deploy auction manager contract
 * */
const SCRIPT_NAME = 'DEPLOY AUCTION MANAGER';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { MANAGER_ADDRESS } = process.env;

    const [deployer, manager] = await ethers.getSigners();

    const managerAddress = MANAGER_ADDRESS ?? manager.address;

    const auctionManager = (await upgrades.deployProxy(
      await ContractFactory.getAuctionManagerFactory(),
      [
        managerAddress,
        ADDRESSES.TOKEN_ADDRESS,
        ADDRESSES.AUCTION_ADDRESS,
        ADDRESSES.BPD_ADDRESS,
      ],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as AuctionManager;
    console.log('Deployed: Auction Manager', auctionManager.address);

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'addresses.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          ...ADDRESSES,
          AUCTION_MANAGER_ADDRESS: auctionManager.address,
        },
        null,
        2
      )
    );
    console.log('Auction manager address saved to', addressFilePath.toString());

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
