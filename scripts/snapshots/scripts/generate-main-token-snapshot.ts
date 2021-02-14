import * as _ from 'lodash';

import { axionContracts } from '../constants/axion.contracts';
import { ArrayUtil } from '../libs/array.util';
import { ContractEvent } from '../libs/contract-event';
import { FileUtil } from '../libs/file.util';
import { PromiseUtil } from '../libs/promise.util';
import { Web3Util } from '../libs/web3.util';

require('dotenv').config();

const ADDRESSES = require('../../../deployed-addresses/v1addresses.json');
const {
  AUCTION_ADDRESS,
  BPD_ADDRESS,
  STAKING_ADDRESS,
  TOKEN_ADDRESS,
} = ADDRESSES;

interface MainTokenState {
  balanceOf: { [address: string]: string };
}

const CONTRACT_ADDRESSES = [BPD_ADDRESS, AUCTION_ADDRESS, STAKING_ADDRESS];

export const generateMainTokenSnapshot = async () => {
  const state = {
    balanceOf: {},
  } as MainTokenState;

  const mainTokens = Web3Util.web3s.map(
    (web3) =>
      new web3.eth.Contract(axionContracts.MainToken.ABI as any, TOKEN_ADDRESS)
  );

  /* Get all user addresses */
  const allEvents = await ContractEvent.getPastEventsUsingBlockNumber(
    mainTokens as any,
    'Transfer',
    100,
    false,
    50
  );
  const allUserAddresses: string[] = _.uniq(
    allEvents.map((event) => event.returnValues.to)
  );
  console.log('addresses found', allUserAddresses.length);

  /* State - balanceOf */
  const promiseFns2 = allUserAddresses
    .filter((address) => !CONTRACT_ADDRESSES.includes(address))
    .map((address) => async () => {
      const balance = await ArrayUtil.getRandomElement(mainTokens)
        .methods.balanceOf(address)
        .call();
      if (Number(balance) > 0) {
        state.balanceOf[address] = balance;
      }
    });
  await PromiseUtil.batchPromises(promiseFns2, 1000, 'balanceOf', 10);

  // Write snapshot as json
  FileUtil.saveSnapshot('main-token-snapshot.json', state);
};
