import { ContractFactory } from '../../libs/ContractFactory';
const ADDRESSES = require('../../deployed-addresses/v1addresses.json');

export async function getDeployedContractsV1(network: string) {
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

  const auctionV1 = await ContractFactory.getAuctionV1At(AUCTION_ADDRESS);
  const bpdV1 = await ContractFactory.getBPDV1At(BPD_ADDRESS);
  const fswapV1 = await ContractFactory.getForeignSwapV1At(FOREIGNSWAP_ADDRESS);
  const nswapV1 = await ContractFactory.getNativeSwapV1At(NATIVESWAP_ADDRESS);
  const tokenV1 = await ContractFactory.getTokenV1At(TOKEN_ADDRESS);
  const hex4TokenV1 = HEX4T_ADDRESS
    ? await ContractFactory.getTokenV1At(HEX4T_ADDRESS)
    : null;
  const subBalancesV1 = await ContractFactory.getSubBalancesV1At(
    SUBBALANCES_ADDRESS
  );
  const stakingV1 = await ContractFactory.getStakingV1At(STAKING_ADDRESS);

  return {
    auctionV1,
    bpdV1,
    fswapV1,
    nswapV1,
    tokenV1,
    hex4TokenV1,
    subBalancesV1,
    stakingV1,
  };
}
