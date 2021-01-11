import { ContractFactory } from '../../libs/ContractFactory';
const ADDRESSES = require('../../deployed-addresses/addresses.json');

export async function getRestorableDeployedContracts(network: string) {
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

  const auctionRestorable = await ContractFactory.getAuctionRestorableAt(
    AUCTION_ADDRESS
  );
  const bpdRestorable = await ContractFactory.getBPDRestorableAt(BPD_ADDRESS);
  const foreignSwapRestorable = await ContractFactory.getForeignSwapRestorableAt(
    FOREIGNSWAP_ADDRESS
  );
  const nativeSwapRestorable = await ContractFactory.getNativeSwapRestorableAt(
    NATIVESWAP_ADDRESS
  );
  const tokenRestorable = await ContractFactory.getTokenRestorableAt(
    TOKEN_ADDRESS
  );
  const hex4Token = HEX4T_ADDRESS
    ? await ContractFactory.getTokenRestorableAt(HEX4T_ADDRESS)
    : null;
  const subBalancesRestorable = await ContractFactory.getSubBalancesRestorableAt(
    SUBBALANCES_ADDRESS
  );
  const stakingRestorable = await ContractFactory.getStakingRestorableAt(
    STAKING_ADDRESS
  );

  return {
    auctionRestorable,
    bpdRestorable,
    foreignSwapRestorable,
    nativeSwapRestorable,
    tokenRestorable,
    hex4Token,
    subBalancesRestorable,
    stakingRestorable,
  };
}
