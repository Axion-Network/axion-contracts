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
  [setterAddress, swapTokenAddress, uniswapAddress, recipientAddress]
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
    const usedSetter = setterAddress ?? DEPLOYER_ADDRESS;

    await Promise.all([
      // Staking
      staking
        .init(
          token.address,
          auction.address,
          subBalances.address,
          foreignSwap.address,
          new BN(TIME_IN_DAY, 10)
        )
        .then(() => console.log('Staking init')),

      // AXN
      token
        .initSwapperAndSwapToken(usedSwapTokenAddress, nativeSwap.address)
        .then(() => console.log('AXN initSwapperAndSwapToken')),
      token
        .init([
          nativeSwap.address,
          foreignSwap.address,
          staking.address,
          auction.address,
          subBalances.address,
        ])
        .then(() => console.log('AXN init')),

      // HEX4T
      SWAP_TOKEN_ADDRESS
        ? Promise.resolve()
        : hex4Token?.init([usedSetter]).then(() => console.log('HEX4T init')),

      // NativeSwap
      nativeSwap
        .init(
          new BN(STAKE_PERIOD.toString(), 10),
          new BN(TIME_IN_DAY, 10),
          usedSwapTokenAddress,
          token.address,
          auction.address
        )
        .then(() => console.log('nativeSwap init')),

      // BPD
      bpd
        .init(token.address, foreignSwap.address, subBalances.address)
        .then(() => console.log('bpd init')),

      // ForeignSwap
      foreignSwap
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
        .then(() => console.log('foreignSwap init')),

      // Auction
      auction
        .init(
          new BN(TIME_IN_DAY, 10),
          token.address,
          staking.address,
          usedUniswapAddress,
          usedRecipientAddress,
          nativeSwap.address,
          foreignSwap.address,
          subBalances.address
        )
        .then(() => console.log('auction init')),

      // SubBalances
      subBalances
        .init(
          token.address,
          foreignSwap.address,
          bpd.address,
          auction.address,
          staking.address,
          new BN(TIME_IN_DAY, 10),
          new BN(STAKE_PERIOD.toString(), 10)
        )
        .then(() => console.log('subBalances init')),
    ]);

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
