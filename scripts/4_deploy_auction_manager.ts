import dotenv from 'dotenv';
dotenv.config();

import { ethers, network, upgrades } from 'hardhat';
import { ContractFactory } from '../libs/ContractFactory';
import { AuctionManager } from '../typechain';
import fs from 'fs';
import path from 'path';
import { getDeployedContracts } from './utils/get_deployed_contracts';
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

    const { auction, token, bpd } = await getDeployedContracts(networkName);

    const auctionManager = (await upgrades.deployProxy(
      await ContractFactory.getAuctionManagerFactory(),
      [managerAddress, token.address, auction.address, bpd.address],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as AuctionManager;
    console.log('Deployed: Auction Manager', auctionManager.address);

    const callerRole =
      '0x843c3a00fa95510a35f425371231fd3fe4642e719cb4595160763d6d02594b50';
    const minterRole =
      '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    const swapperRole =
      '0x499b8dbdbe4f7b12284c4a222a9951ce4488b43af4d09f42655d67f73b612fe1';

    const s1 = await auction.setupRole(callerRole, auctionManager.address);
    await s1.wait();
    console.log('Setup role 1');
    const s2 = await token.setupRole(minterRole, auctionManager.address);
    await s2.wait();
    console.log('Setup role 2');
    const s3 = await bpd.setupRole(swapperRole, auctionManager.address);
    await s3.wait();
    console.log('Setup role 3');

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'auction-manager.json'
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
