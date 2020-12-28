import dotenv from 'dotenv';
dotenv.config();
import { deployProxy, prepareUpgrade } from '@openzeppelin/truffle-upgrades';
import { AuctionManagerInstance } from '../types/truffle-contracts';
import fs from 'fs';
import path from 'path';
import {
  getDeployedContracts,
  TEST_NETWORKS,
} from './utils/get_deployed_contracts';

const ADDRESSES = require('../migration-output/address.json');
const AuctionManager = artifacts.require('AuctionManager');
const Token = artifacts.require('Token');
const Auction = artifacts.require('Auction') as any;
const BPD = artifacts.require('BPD') as any;

module.exports = async function (deployer, network, [managerAddress]) {
  if (!process.argv.includes('migrate')) {
    return;
  }

  try {
    console.log('DEPLOYING CONTRACTS');
    console.log(`Running on network: ${network}`);
    const { DEPLOYER_ADDRESS, MANAGER_ADDRESS } = process.env;

    if (!TEST_NETWORKS.includes(network)) {
      [DEPLOYER_ADDRESS].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const manager = MANAGER_ADDRESS ?? managerAddress;
    const {
      auction,
      bpd,
      foreignSwap,
      nativeSwap,
      token,
      subBalances,
      staking,
    } = await getDeployedContracts(network);

    // Auction
    const auctionManager = (await deployProxy(
      AuctionManager as any,
      [
        manager,
        ADDRESSES.TOKEN_ADDRESS,
        ADDRESSES.AUCTION_ADDRESS,
        ADDRESSES.BPD_ADDRESS,
      ],
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    ).then((instance) => {
      console.log('Deployed: Auction Pool', instance.address);
      return instance;
    })) as AuctionManagerInstance;

    const auctionUpgrade = await prepareUpgrade(auction.address, Auction, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded staking contract - ', auctionUpgrade);

    const bpdUpgrade = await prepareUpgrade(bpd.address, BPD, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded bpd contract - ', bpdUpgrade);

    // Setup the roles using the migration script
    if (network === 'ropsten') {
      console.log('Setting up Auction Manager minter role for Token');
      await token.setupRole(
        await token.getMinterRole(),
        auctionManager?.address ?? '0x00'
      );
      console.log('Setting up Auction Manager swap role for BPD');
      await bpd.setupRole(
        await bpd.SWAP_ROLE(),
        auctionManager?.address ?? '0x00'
      );
      console.log('Setting up Auction Manager caller role for auction');
      await auction.setupRole(
        await auction.CALLER_ROLE(),
        auctionManager?.address ?? '0x00'
      );

      console.log(
        'Manager has caller role',
        await token.hasRole(
          await token.getMinterRole(),
          auctionManager?.address ?? '0x00'
        )
      );
      console.log(
        'Manager has caller role',
        await auction.hasRole(
          await auction.CALLER_ROLE(),
          auctionManager?.address ?? '0x00'
        )
      );
      console.log(
        'Manager has swap role',
        await bpd.hasRole(
          await bpd.SWAP_ROLE(),
          auctionManager?.address ?? '0x00'
        )
      );
    }

    const addressFilePath = path.join(
      __dirname,
      '..',
      'migration-output',
      'address.json'
    );
    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          ...ADDRESSES,
          AUCTION_POOL_ADDRESS: auctionManager?.address ?? '0x00',
        },
        null,
        2
      )
    );
    console.log('Contracts addresses saved to', addressFilePath.toString());

    console.log(
      '============================DEPLOYING CONTRACTS: DONE==============================='
    );
  } catch (err) {
    console.error(err);
    console.error(
      '============================DEPLOYING CONTRACTS: FAILED==============================='
    );

    process.exit();
  }
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
