import dotenv from 'dotenv';
dotenv.config();

import { network, ethers, upgrades } from 'hardhat';
import path from 'path';
import fs from 'fs';
import { TEST_NETWORKS } from '../constants/common';
import { ContractFactory } from '../libs/ContractFactory';
import {
  AuctionRestorable,
  BPDRestorable,
  ForeignSwapRestorable,
  NativeSwapRestorable,
  StakingRestorable,
  SubBalancesRestorable,
  TokenRestorable,
} from '../typechain';

const TOKEN_NAME = 'Axion';
const TOKEN_SYMBOL = 'AXN';

/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'DEPLOY AXION CONTRACTS';

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

    // Auction
    const auction = (await upgrades.deployProxy(
      await ContractFactory.getAuctionRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as AuctionRestorable;
    console.log('Deployed: Auction', auction.address);

    // Swap Token
    let hex4Token: TokenRestorable | undefined;
    if (!SWAP_TOKEN_ADDRESS) {
      hex4Token = (await upgrades.deployProxy(
        await ContractFactory.getTokenRestorableFactory(),
        [managerAddress, deployerAddress, 'HEX10T', 'HEX10T'],
        { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
      )) as TokenRestorable;
      console.log('Deployed: SwapToken', hex4Token.address);
    } else {
      console.log(
        `No need to deploy SwapToken, it was deployed ${SWAP_TOKEN_ADDRESS}`
      );
    }

    // Axion
    const token = (await upgrades.deployProxy(
      await ContractFactory.getTokenRestorableFactory(),
      [managerAddress, deployerAddress, TOKEN_NAME, TOKEN_SYMBOL],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as TokenRestorable;
    console.log('Deployed: Axion', token.address);

    // Native Swap
    const nativeswap = (await upgrades.deployProxy(
      await ContractFactory.getNativeSwapRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as NativeSwapRestorable;
    console.log('Deployed: NativeSwap', nativeswap.address);

    // BPD
    const bpd = (await upgrades.deployProxy(
      await ContractFactory.getBPDRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as BPDRestorable;
    console.log('Deployed: BPD', bpd.address);

    // Foreign Swap
    const foreignswap = (await upgrades.deployProxy(
      await ContractFactory.getForeignSwapRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as ForeignSwapRestorable;
    console.log('Deployed: ForeignSwap', bpd.address);

    // SubBalances
    const subbalances = (await upgrades.deployProxy(
      await ContractFactory.getSubBalancesRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as SubBalancesRestorable;
    console.log('Deployed: SubBalances', subbalances.address);

    // Staking
    const staking = (await upgrades.deployProxy(
      await ContractFactory.getStakingRestorableFactory(),
      [managerAddress, deployerAddress],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as StakingRestorable;
    console.log('Deployed: Staking', staking.address);

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
          NETWORK: networkName,
          AUCTION_ADDRESS: auction.address,
          TOKEN_ADDRESS: token.address,
          HEX4T_ADDRESS: hex4Token?.address,
          NATIVESWAP_ADDRESS: nativeswap.address,
          BPD_ADDRESS: bpd.address,
          FOREIGNSWAP_ADDRESS: foreignswap.address,
          SUBBALANCES_ADDRESS: subbalances.address,
          STAKING_ADDRESS: staking.address,
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
