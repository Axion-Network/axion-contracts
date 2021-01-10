import dotenv from 'dotenv';
dotenv.config();

import { network, ethers, upgrades } from 'hardhat';
import path from 'path';
import fs from 'fs';
import { TEST_NETWORKS } from '../constants/common';
import { ContractFactory } from '../libs/ContractFactory';
import { Token } from '../typechain';

const TOKEN_NAME = 'Axion';
const TOKEN_SYMBOL = 'AXN';

const SIGNER_ADDRESS = '0x849d89ffa8f91ff433a3a1d23865d15c8495cc7b';
const MAX_CLAIM_AMOUNT = '10000000000000000000000000';
const TOTAL_SNAPSHOT_AMOUNT = '370121420541683530700000000000';
const TOTAL_SNAPSHOT_ADDRESS = '183035';
/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'DEPLOY AXION LAYER 1 CONTRACTS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const {
      DEPLOYER_ADDRESS,
      UNISWAP_ADDRESS,
      MANAGER_ADDRESS,
      SWAP_TOKEN_ADDRESS,
      TIME_IN_DAY,
      STAKE_PERIOD,
      RECIPIENT_ADDRESS,
    } = process.env;

    if (!TEST_NETWORKS.includes(networkName)) {
      [
        DEPLOYER_ADDRESS,
        MANAGER_ADDRESS,
        SWAP_TOKEN_ADDRESS,
        UNISWAP_ADDRESS,
        RECIPIENT_ADDRESS,
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const [deployer, manager] = await ethers.getSigners();
    const deployerAddress = DEPLOYER_ADDRESS ?? deployer.address;
    const managerAddress = MANAGER_ADDRESS ?? manager.address;
    // Swap Token
    let hex4Token: Token | undefined;
    if (!SWAP_TOKEN_ADDRESS) {
      hex4Token = (await upgrades.deployProxy(
        await ContractFactory.getTokenFactory(),
        [managerAddress, deployerAddress, 'HEX10T', 'HEX10T'],
        { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
      )) as Token;
      console.log('Deployed: SwapToken', hex4Token.address);
    } else {
      console.log(
        `No need to deploy SwapToken, it was deployed ${SWAP_TOKEN_ADDRESS}`
      );
    }

    const tokenFactory = await ContractFactory.getTokenV1Factory();
    const token = await tokenFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      hex4Token?.address || SWAP_TOKEN_ADDRESS || '',
      managerAddress
    );
    console.log(`======== LAYER 1 TOKEN LAUNCHED ${token.address} ========`);
    const nativeSwapFactory = await ContractFactory.getNativeSwapV1Factory();
    const nswap = await nativeSwapFactory.deploy();
    console.log(
      `========== LAYER 1 NATIVE SWAP LAUNCHED ${nswap.address} ==========`
    );
    const foreignSwapFactory = await ContractFactory.getForeignSwapV1Factory();
    const fswap = await foreignSwapFactory.deploy(managerAddress);
    console.log(
      `========== LAYER 1 FOREIGN SWAP LAUNCHED ${fswap.address} ==========`
    );
    const auctionFactory = await ContractFactory.getAuctionV1Factory();
    const auction = await auctionFactory.deploy();
    console.log(
      `========== LAYER 1 AUCTION LAUNCHED ${auction.address} ==========`
    );
    const bpdFactory = await ContractFactory.getBPDV1Factory();
    const bpd = await bpdFactory.deploy(managerAddress);
    console.log(`========== LAYER 1 BPD LAUNCHED ${bpd.address} ==========`);
    const subBalancesFactory = await ContractFactory.getSubBalancesV1Factory();
    const subBalances = await subBalancesFactory.deploy(managerAddress);
    console.log(
      `========== LAYER 1 SUB BALANCES LAUNCHED ${subBalances.address} ==========`
    );
    const stakingFactory = await ContractFactory.getStakingV1Factory();
    const staking = await stakingFactory.deploy();
    console.log(
      `========== LAYER 1 STAKING LAUNCHED AT ${staking.address} ==========`
    );

    console.log('========== INITIALIZING TOKEN ==========');
    await token.init([
      nswap.address,
      auction.address,
      staking.address,
      fswap.address,
      subBalances.address,
    ]);
    console.log('========== TOKEN INITED ==========');

    console.log('========== INITIALIZING BPD ==========');
    await subBalances.init(
      token.address,
      fswap.address,
      bpd.address,
      auction.address,
      staking.address,
      TIME_IN_DAY ?? '3600',
      STAKE_PERIOD ?? '350'
    );
    console.log('========== SUB-BALANCES INITED ==========');

    console.log('========== INITIALIZING BPD ==========');
    await bpd.init(token.string, fswap.string, bpd.string);
    console.log('========== BPD INITED ==========');

    console.log('========== INITIALIZING FSWAP ==========');
    await fswap.init(
      SIGNER_ADDRESS,
      TIME_IN_DAY ?? '3600',
      STAKE_PERIOD ?? '350',
      MAX_CLAIM_AMOUNT,
      token.address,
      auction.address,
      staking.address,
      bpd.address,
      TOTAL_SNAPSHOT_AMOUNT,
      TOTAL_SNAPSHOT_ADDRESS
    );
    console.log('========== FSWAP INITED ==========');

    console.log('========== INITIALIZING NSWAP ==========');
    await nswap.init(
      STAKE_PERIOD ?? '350',
      TIME_IN_DAY ?? '3600',
      hex4Token?.address || SWAP_TOKEN_ADDRESS || '',
      token.addres,
      auction.address
    );
    console.log('========== NSWAP INITED ==========');

    console.log('========== INITIALIZING NSWAP ==========');
    await auction.init(
      TIME_IN_DAY ?? '3600',
      managerAddress,
      token.address,
      staking.address,
      UNISWAP_ADDRESS ?? managerAddress,
      RECIPIENT_ADDRESS ?? managerAddress,
      nswap.address,
      fswap.address,
      subBalances.address
    );
    console.log('========== NSWAP INITED ==========');

    console.log('========== INITIALIZING NSWAP ==========');
    await staking.init(
      token.address,
      auction.address,
      subBalances.address,
      fswap.address,
      TIME_IN_DAY ?? '3600'
    );
    console.log('========== NSWAP INITED ==========');

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'v1addresses.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          HEX4T_ADDRESS: hex4Token?.address,
          AUCTION_ADDRESS: auction.address,
          TOKEN_ADDRESS: token.address,
          NATIVESWAP_ADDRESS: nswap.address,
          BPD_ADDRESS: bpd.address,
          FOREIGNSWAP_ADDRESS: fswap.address,
          SUBBALANCES_ADDRESS: subBalances.address,
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
