import { ContractFactory } from '../../libs/ContractFactory';
const ADDRESSES = require('../../deployed-addresses/addresses.json');

export async function getMiningContract(network: string) {
  const { NETWORK, MINE_MANAGER } = ADDRESSES;

  if (NETWORK !== network) {
    throw new Error('Network does not match');
  }

  [NETWORK, MINE_MANAGER].forEach((address) => {
    if (!address) {
      throw new Error('Please check migration-output/address.json file');
    }
  });

  const mineManager = await ContractFactory.getAxionMineManagerAt(MINE_MANAGER);

  return {
    mineManager,
  };
}
