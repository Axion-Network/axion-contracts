import dotenv from 'dotenv';
dotenv.config();

import { ethers, network } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { TEST_NETWORKS } from '../constants/common';

// FOREIGN SWAP
// I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
// Need to clarify what they are
const SIGNER_ADDRESS = '0x849d89ffa8f91ff433a3a1d23865d15c8495cc7b';
const MAX_CLAIM_AMOUNT = '10000000000000000000000000';
const TOTAL_SNAPSHOT_AMOUNT = '370121420541683530700000000000';
const TOTAL_SNAPSHOT_ADDRESS = '183035';

/**
 * INIT CONTRACTS (After deployment / snapshot restoration)
 **/
const SCRIPT_NAME = 'INIT CONTRACTS';

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
      auction,
      bpd,
      foreignSwap,
      nativeSwap,
      token,
      hex4Token,
      subBalances,
      staking,
    } = await getDeployedContracts(networkName);

    const [
      fakeDeployer,
      fakeSwapToken,
      fakeUniswap,
      fakeRecipient,
      fakeAuctionV1,
      fakeStakingV1,
      fakeSubBalancesV1,
    ] = await ethers.getSigners();

    console.log(fakeDeployer.address);

    const usedSwapTokenAddress =
      SWAP_TOKEN_ADDRESS ?? hex4Token?.address ?? fakeSwapToken.address;
    const usedUniswapAddress = UNISWAP_ADDRESS ?? fakeUniswap.address;
    const usedRecipientAddress = RECIPIENT_ADDRESS ?? fakeRecipient.address;
    const usedAuctionV1Address = AUCTION_V1_ADDRESS ?? fakeAuctionV1.address;
    const usedStakingV1Address = STAKING_V1_ADDRESS ?? fakeStakingV1.address;
    const usedSubBalancesV1Address =
      SUB_BALANCES_V1_ADDRESS ?? fakeSubBalancesV1.address;
    const usedSetter = DEPLOYER_ADDRESS ?? fakeDeployer.address;

    console.log('usedSwapTokenAddress', usedSwapTokenAddress);
    console.log('usedUniswapAddress', usedUniswapAddress);
    console.log('usedRecipientAddress', usedRecipientAddress);
    console.log('usedAuctionV1Address', usedAuctionV1Address);
    console.log('usedStakingV1Address', usedStakingV1Address);
    console.log('usedSubBalancesV1Address', usedSubBalancesV1Address);
    console.log('usedSetter', usedSetter);

    // Staking
    await staking
      .init(
        token.address,
        auction.address,
        subBalances.address,
        foreignSwap.address,
        usedStakingV1Address,
        TIME_IN_DAY.toString(),
        0
      )
      .then(() => console.log('Staking init'));

    // AXN
    await token
      .initSwapperAndSwapToken(usedSwapTokenAddress, nativeSwap.address)
      .then(() => console.log('AXN initSwapperAndSwapToken'));
    await token
      .init([
        nativeSwap.address,
        foreignSwap.address,
        staking.address,
        auction.address,
        subBalances.address,
      ])
      .then(() => console.log('AXN init'));

    // HEX4T
    if (SWAP_TOKEN_ADDRESS) {
      console.log(`No need to init swap token ${SWAP_TOKEN_ADDRESS}`);
    } else {
      await hex4Token?.init([usedSetter]).then(() => console.log('HEX4T init'));
    }

    // NativeSwap
    await nativeSwap
      .init(
        STAKE_PERIOD.toString(),
        TIME_IN_DAY.toString(),
        usedSwapTokenAddress,
        token.address,
        auction.address
      )
      .then(() => console.log('nativeSwap init'));

    // BPD
    await bpd
      .init(token.address, foreignSwap.address, subBalances.address)
      .then(() => console.log('bpd init'));

    // ForeignSwap
    await foreignSwap
      .init(
        SIGNER_ADDRESS,
        TIME_IN_DAY.toString(),
        STAKE_PERIOD.toString(),
        MAX_CLAIM_AMOUNT,
        token.address,
        auction.address,
        staking.address,
        bpd.address,
        TOTAL_SNAPSHOT_AMOUNT,
        TOTAL_SNAPSHOT_ADDRESS
      )
      .then(() => console.log('foreignSwap init'));

    // Auction
    await auction
      .init(
        TIME_IN_DAY.toString(),
        token.address,
        staking.address,
        usedUniswapAddress,
        usedRecipientAddress,
        nativeSwap.address,
        foreignSwap.address,
        subBalances.address,
        usedAuctionV1Address
      )
      .then(() => console.log('auction init'));

    // SubBalances
    await subBalances
      .init(
        token.address,
        foreignSwap.address,
        bpd.address,
        auction.address,
        usedSubBalancesV1Address,
        staking.address,
        TIME_IN_DAY.toString(),
        STAKE_PERIOD.toString()
      )
      .then(() => console.log('subBalances init'));

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
