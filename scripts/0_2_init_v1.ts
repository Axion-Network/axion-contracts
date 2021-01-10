import dotenv from 'dotenv';
dotenv.config();

import { network, ethers } from 'hardhat';
import path from 'path';
import { TEST_NETWORKS } from '../constants/common';
import { getDeployedContractsV1 } from './utils/get_v1_deployed_contracts';

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
      RECIPIENT_ADDRESS,
      MANAGER_ADDRESS,
      SWAP_TOKEN_ADDRESS,
      UNISWAP_ADDRESS,
      TIME_IN_DAY,
      AUCTION_V1_ADDRESS,
      STAKING_V1_ADDRESS,
      SUB_BALANCES_V1_ADDRESS,
      STAKE_PERIOD,
    } = process.env as any;

    if (!TEST_NETWORKS.includes(networkName)) {
      [
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        MANAGER_ADDRESS,
        SWAP_TOKEN_ADDRESS,
        UNISWAP_ADDRESS,
        TIME_IN_DAY,
        AUCTION_V1_ADDRESS,
        STAKING_V1_ADDRESS,
        SUB_BALANCES_V1_ADDRESS,
        STAKE_PERIOD,
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const {
      auctionV1,
      bpdV1,
      fswapV1,
      nswapV1,
      tokenV1,
      hex4TokenV1,
      subBalancesV1,
      stakingV1,
    } = await getDeployedContractsV1(networkName);

    console.log('LOOK HERE', auctionV1.address);

    const [
      fakeSwapToken,
      fakeUniswap,
      fakeRecipient,
      fakeAuctionV1,
      fakeStakingV1,
      fakeSubBalancesV1,
    ] = await ethers.getSigners();

    const [manager] = await ethers.getSigners();
    const managerAddress = MANAGER_ADDRESS ?? manager.address;

    const usedSwapTokenAddress =
      SWAP_TOKEN_ADDRESS ?? hex4TokenV1?.address ?? fakeSwapToken.address;
    const usedUniswapAddress = UNISWAP_ADDRESS ?? fakeUniswap.address;
    const usedRecipientAddress = RECIPIENT_ADDRESS ?? fakeRecipient.address;
    const usedAuctionV1Address = AUCTION_V1_ADDRESS ?? fakeAuctionV1.address;
    const usedStakingV1Address = STAKING_V1_ADDRESS ?? fakeStakingV1.address;
    const usedSubBalancesV1Address =
      SUB_BALANCES_V1_ADDRESS ?? fakeSubBalancesV1.address;
    // const usedSetter = DEPLOYER_ADDRESS ?? fakeDeployer.address;

    // await tokenV1.init([
    //   nswapV1.address,
    //   usedAuctionV1Address,
    //   usedStakingV1Address,
    //   fswapV1.address,
    //   usedSubBalancesV1Address,
    // ]);
    // console.log('========== TOKEN INITED ==========');

    // await subBalancesV1.init(
    //   tokenV1.address,
    //   fswapV1.address,
    //   bpdV1.address,
    //   usedAuctionV1Address,
    //   usedStakingV1Address,
    //   TIME_IN_DAY ?? '3600',
    //   STAKE_PERIOD ?? '350'
    // );
    // console.log('========== SUB-BALANCES INITED ==========');

    // await bpdV1.init(tokenV1.address, fswapV1.address, bpdV1.address);
    // console.log('========== BPD INITED ==========');

    // await fswapV1.init(
    //   SIGNER_ADDRESS,
    //   TIME_IN_DAY ?? '3600',
    //   STAKE_PERIOD ?? '350',
    //   MAX_CLAIM_AMOUNT,
    //   tokenV1.address,
    //   usedAuctionV1Address,
    //   usedStakingV1Address,
    //   bpdV1.address,
    //   TOTAL_SNAPSHOT_AMOUNT,
    //   TOTAL_SNAPSHOT_ADDRESS
    // );
    // console.log('========== FSWAP INITED ==========');

    // await nswapV1.init(
    //   STAKE_PERIOD ?? '350',
    //   TIME_IN_DAY ?? '3600',
    //   usedSwapTokenAddress,
    //   tokenV1.addres,
    //   usedAuctionV1Address
    // );
    // console.log('========== NSWAP INITED ==========');

    // await auctionV1.init(
    //   TIME_IN_DAY ?? '3600',
    //   managerAddress,
    //   tokenV1.address,
    //   usedStakingV1Address,
    //   usedUniswapAddress,
    //   usedRecipientAddress,
    //   nswapV1.address,
    //   fswapV1.address,
    //   usedSubBalancesV1Address
    // );
    // console.log('========== NSWAP INITED ==========');

    await stakingV1.init(
      tokenV1.address,
      usedAuctionV1Address,
      usedSubBalancesV1Address,
      fswapV1.address,
      TIME_IN_DAY ?? '3600'
    );
    console.log('========== NSWAP INITED ==========');

    const addressFilePath = path.join(
      __dirname,
      '..',
      'deployed-addresses',
      'v1addresses.json'
    );

    console.log('V1 Contracts initialized');

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
