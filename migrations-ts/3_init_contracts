import {
  getDeployedContracts,
  TEST_NETWORKS,
} from './utils/get_deployed_contracts';
import BN from 'bn.js';

const STAKE_PERIOD = 350;

// FOREIGN SWAP
// TODO: I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
//       Need to clarify what they are
const SIGNER_ADDRESS = '0x849d89ffa8f91ff433a3a1d23865d15c8495cc7b';
const MAX_CLAIM_AMOUNT = '10000000000000000000000000';
const TOTAL_SNAPSHOT_AMOUNT = '370121420541683530700000000000';
const TOTAL_SNAPSHOT_ADDRESS = '183035';

module.exports = async function (
  deployer,
  network,
  [
    setterAddress,
    swapTokenAddress,
    uniswapAddress,
    recipientAddress,
    auctionV1Address,
    stakingV1Address,
    subBalancesV1Address,
  ]
) {
  if (!process.argv.includes('migrate')) {
    return;
  }

  try {
    console.log('INIT CONTRACTS');
    console.log(`Running on network: ${network}`);

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
    } = process.env as any;

    if (!TEST_NETWORKS.includes(network)) {
      [
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        MANAGER_ADDRESS,
        UNISWAP_ADDRESS,
        TIME_IN_DAY,
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
    } = await getDeployedContracts(network);

    const usedSwapTokenAddress =
      SWAP_TOKEN_ADDRESS ?? hex4Token?.address ?? swapTokenAddress;
    const usedUniswapAddress = UNISWAP_ADDRESS ?? uniswapAddress;
    const usedRecipientAddress = RECIPIENT_ADDRESS ?? recipientAddress;
    const usedAuctionV1Address = AUCTION_V1_ADDRESS ?? auctionV1Address;
    const usedStakingV1Address = STAKING_V1_ADDRESS ?? stakingV1Address;
    const usedSubBalancesV1Address =
      SUB_BALANCES_V1_ADDRESS ?? subBalancesV1Address;
    const usedSetter = DEPLOYER_ADDRESS ?? setterAddress;

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
        new BN(TIME_IN_DAY, 10)
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
    SWAP_TOKEN_ADDRESS
      ? await Promise.resolve().then(() =>
          console.log('No need to init swap token')
        )
      : await hex4Token
          ?.init([usedSetter])
          .then(() => console.log('HEX4T init'));

    // NativeSwap
    await nativeSwap
      .init(
        new BN(STAKE_PERIOD.toString(), 10),
        new BN(TIME_IN_DAY, 10),
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
        new BN(TIME_IN_DAY, 10),
        new BN(STAKE_PERIOD.toString(), 10),
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
        new BN(TIME_IN_DAY, 10),
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
        new BN(TIME_IN_DAY, 10),
        new BN(STAKE_PERIOD.toString(), 10)
      )
      .then(() => console.log('subBalances init'));

    console.log(
      '============================INIT CONTRACTS: DONE==============================='
    );
  } catch (err) {
    console.error(err);
    console.error(
      '============================INIT CONTRACTS: FAILED==============================='
    );
    process.exit();
  }
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
