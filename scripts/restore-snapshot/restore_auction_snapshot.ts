import { Auction, Token } from '../../typechain';

const auctionSnapshot = require('../snapshots/auction-snapshot.json');
import _ from 'lodash';

export async function restoreAuctionSnapshot(auction: Auction, token: Token) {
  console.log('restoreAuctionSnapshot');
  const { start, lastAuctionEventId, balanceOf } = auctionSnapshot;

  await token.bulkMint([auction.address], [balanceOf]);
  console.log('Token minted to auction', balanceOf);

  await auction.setNormalVariables(lastAuctionEventId, start);
  console.log('setNormalVariables', lastAuctionEventId, start);

  await setReservesOf(auction);
  console.log('setReservesOf');

  console.log('restoreAuctionSnapshot - Done');
  console.log('---------------------------------');
}

async function setReservesOf(auction: Auction) {
  const { reservesOf } = auctionSnapshot;

  let sessionIds: string[] = [];
  let eths: string[] = [];
  let tokens: string[] = [];
  let uniswapLastPrices: string[] = [];
  let uniswapMiddlePrices: string[] = [];

  for (const sessionId of Object.keys(reservesOf)) {
    sessionIds.push(sessionId);
    const { eth, token, uniswapLastPrice, uniswapMiddlePrice } = reservesOf[
      sessionId
    ];
    eths.push(eth);
    tokens.push(token);
    uniswapLastPrices.push(uniswapLastPrice);
    uniswapMiddlePrices.push(uniswapMiddlePrice);

    if (sessionIds.length === 20) {
      const last = _.last(sessionIds);
      await auction
        .setReservesOf(
          sessionIds,
          eths,
          tokens,
          uniswapLastPrices,
          uniswapMiddlePrices
        )
        .then(() => console.log('setReservesOf', last));
      sessionIds = [];
      eths = [];
      tokens = [];
      uniswapLastPrices = [];
      uniswapMiddlePrices = [];
    }
  }
  if (sessionIds.length > 0) {
    const last = _.last(sessionIds);
    await auction
      .setReservesOf(
        sessionIds,
        eths,
        tokens,
        uniswapLastPrices,
        uniswapMiddlePrices
      )
      .then(() => console.log('setReservesOf', last));
  }
  console.log('setReservesOf - Done');
  console.log('---------------------------------');
}
