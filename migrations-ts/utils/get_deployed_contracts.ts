const Auction = artifacts.require('Auction');
const AuctionManager = artifacts.require('AuctionManager');
const BPD = artifacts.require('BPD');
const ForeignSwap = artifacts.require('ForeignSwap');
const NativeSwap = artifacts.require('NativeSwap');
const Staking = artifacts.require('Staking');
const SubBalances = artifacts.require('SubBalances');
const Token = artifacts.require('Token');

export const TEST_NETWORKS = ['develop', 'test', 'ganache'];

export async function getDeployedContracts(network: string) {
  // get addresses at runtime, because step 1 will of update this file
  const ADDRESSES = require('../../migration-output/address.json');

  const {
    NETWORK,
    AUCTION_ADDRESS,
    BPD_ADDRESS,
    FOREIGNSWAP_ADDRESS,
    NATIVESWAP_ADDRESS,
    STAKING_ADDRESS,
    SUBBALANCES_ADDRESS,
    TOKEN_ADDRESS,
    HEX4T_ADDRESS,
    AUCTION_POOL_ADDRESS,
  } = ADDRESSES;

  if (NETWORK !== network) {
    throw new Error('Network does not match');
  }

  [
    NETWORK,
    AUCTION_ADDRESS,
    BPD_ADDRESS,
    FOREIGNSWAP_ADDRESS,
    NATIVESWAP_ADDRESS,
    STAKING_ADDRESS,
    SUBBALANCES_ADDRESS,
    TOKEN_ADDRESS,
  ].forEach((address) => {
    if (!address) {
      throw new Error('Please check migration-output/address.json file');
    }
  });

  const auction = await Auction.at(AUCTION_ADDRESS);
  const bpd = await BPD.at(BPD_ADDRESS);
  const foreignSwap = await ForeignSwap.at(FOREIGNSWAP_ADDRESS);
  const nativeSwap = await NativeSwap.at(NATIVESWAP_ADDRESS);
  const token = await Token.at(TOKEN_ADDRESS);
  const hex4Token = HEX4T_ADDRESS ? await Token.at(HEX4T_ADDRESS) : undefined;
  const subBalances = await SubBalances.at(SUBBALANCES_ADDRESS);
  const staking = await Staking.at(STAKING_ADDRESS);
  const auctionManager = AUCTION_POOL_ADDRESS
    ? await AuctionManager.at(AUCTION_POOL_ADDRESS)
    : null;

  return {
    auction,
    bpd,
    foreignSwap,
    nativeSwap,
    token,
    hex4Token,
    subBalances,
    staking,
    auctionManager,
  };
}
