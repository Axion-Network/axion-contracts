import * as _ from 'lodash';

import { axionContracts } from '../constants/axion.contracts';
import { ArrayUtil } from '../libs/array.util';
import { ConfigUtil } from '../libs/config.util';
import { FileUtil } from '../libs/file.util';
import { PromiseUtil } from '../libs/promise.util';
import { Web3Util } from '../libs/web3.util';

require('dotenv').config();

const ADDRESSES = require('../../../deployed-addresses/v1addresses.json');
const { AUCTION_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface AuctionState {
  lastAuctionEventId: string;

  reservesOf: {
    [auctionId: string]: {
      eth: string;
      token: string;
      uniswapLastPrice: string;
      uniswapMiddlePrice: string;
    };
  };

  start: string; // timestamp (seconds)
  balanceOf: string; // amount of Axion this contract has
}

export const generateAuctionSnapshot = async () => {
  const state = {
    reservesOf: {},
  } as AuctionState;

  const auctionContracts = Web3Util.web3s.map(
    (web3) =>
      new web3.eth.Contract(axionContracts.Auction.ABI as any, AUCTION_ADDRESS)
  );

  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  /* State - start */
  state.start = await ArrayUtil.getRandomElement(auctionContracts)
    .methods.start()
    .call();

  /* State - lastAuctionEventId */
  state.lastAuctionEventId = await ArrayUtil.getRandomElement(auctionContracts)
    .methods.lastAuctionEventId()
    .call();

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods.balanceOf(AUCTION_ADDRESS).call();

  /* State - reservesOf */
  const promiseFns3 = _.range(0, ConfigUtil.getNumDays()).map(
    (auctionId) => async () => {
      const reserves = await ArrayUtil.getRandomElement(auctionContracts)
        .methods.reservesOf(auctionId)
        .call();
      state.reservesOf[auctionId] = reserves;
    }
  );
  await PromiseUtil.batchPromises(promiseFns3, 7, 'reservesOf');

  // Write snapshot as json
  FileUtil.saveSnapshot('auction-snapshot.json', state);
};
