import { ContractFactory } from '../../libs/ContractFactory';
const ADDRESSES = require('../../deployed-addresses/addresses.json');

export async function getDeployedContracts(network: string) {
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
    AUCTION_MANAGER_ADDRESS,
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

  const auction = await ContractFactory.getAuctionAt(AUCTION_ADDRESS);
  const bpd = await ContractFactory.getBPDAt(BPD_ADDRESS);
  const foreignSwap = await ContractFactory.getForeignSwapAt(
    FOREIGNSWAP_ADDRESS
  );
  const nativeSwap = await ContractFactory.getNativeSwapAt(NATIVESWAP_ADDRESS);
  const token = await ContractFactory.getTokenAt(TOKEN_ADDRESS);
  const hex4Token = HEX4T_ADDRESS
    ? await ContractFactory.getTokenAt(HEX4T_ADDRESS)
    : null;
  const subBalances = await ContractFactory.getSubBalancesAt(
    SUBBALANCES_ADDRESS
  );
  const staking = await ContractFactory.getStakingAt(STAKING_ADDRESS);
  const auctionManager = AUCTION_MANAGER_ADDRESS
    ? await ContractFactory.getAuctionManagerAt(AUCTION_MANAGER_ADDRESS)
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
