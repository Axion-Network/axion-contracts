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
const Auction = artifacts.require('Auction') as any;
const BPD = artifacts.require('BPD') as any;
const ForeignSwap = artifacts.require('ForeignSwap') as any;
const NativeSwap = artifacts.require('NativeSwap') as any;
const SubBalances = artifacts.require('SubBalances') as any;
const Staking = artifacts.require('Staking') as any;
const Token = artifacts.require('Token') as any;

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

    const auctionUpgrade = await prepareUpgrade(auction.address, Auction, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded auction contract - ', auctionUpgrade);

    const bpdUpgrade = await prepareUpgrade(bpd.address, BPD, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded bpd contract - ', bpdUpgrade);

    const foreignSwapUpgrade = await prepareUpgrade(
      foreignSwap.address,
      ForeignSwap,
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    );
    console.log('Upgraded foreignSwap contract - ', foreignSwapUpgrade);

    const nativeSwapUpgrade = await prepareUpgrade(
      nativeSwap.address,
      NativeSwap,
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    );
    console.log('Upgraded nativeSwap contract - ', nativeSwapUpgrade);

    const stakingUpgrade = await prepareUpgrade(staking.address, Staking, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded staking contract - ', stakingUpgrade);

    const subBalancesUpgrade = await prepareUpgrade(
      subBalances.address,
      SubBalances,
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    );
    console.log('Upgraded subbalances contract - ', subBalancesUpgrade);

    const tokenUpgrade = await prepareUpgrade(token.address, Token, {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    });
    console.log('Upgraded token contract - ', tokenUpgrade);

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
