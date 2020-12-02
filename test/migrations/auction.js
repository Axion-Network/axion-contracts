const Auction = artifacts.require('Auction');
const auctionSnapshot = require('./snapshots/auction-snapshot.json');
const _ = require('lodash');
const BN = require('bn.js');

const DAY = 86400;

contract(
  'Auction - Migration',
  ([
    setter,
    foreignSwapAddress,
    weeklyAuction,
    stakingAddress,
    bigPayDayAddress,
    recipient,
    account1,
    account2,
    account3,
    account4,
  ]) => {
    let auction;

    beforeEach(async () => {
      auction = await Auction.new();
      await auction.init(
        new BN(DAY.toString(), 10),
        setter,
        setter,
        setter,
        setter,
        setter,
        setter,
        setter,
        setter
      );
    });

    describe('setReservesOf', () => {
      it('should init reservesOf using snapshot', async () => {
        const allSessionIds = [];

        const eths = [];
        const tokens = [];
        const uniswapLastPrices = [];
        const uniswapMiddlePrices = [];
        Object.keys(auctionSnapshot.reservesOf)
          .slice(0, 40)
          .forEach((sessionId) => {
            allSessionIds.push(sessionId);
            const {
              eth,
              token,
              uniswapLastPrice,
              uniswapMiddlePrice,
            } = auctionSnapshot.reservesOf[sessionId];
            eths.push(eth);
            tokens.push(token);
            uniswapLastPrices.push(uniswapLastPrice);
            uniswapMiddlePrices.push(uniswapMiddlePrice);
          });

        const estimatedGas = await auction.setReservesOf.estimateGas(
          allSessionIds,
          eths,
          tokens,
          uniswapLastPrices,
          uniswapMiddlePrices
        );
        console.log('estimatedGas', estimatedGas);
      });
    });

    describe('setAuctionsOf', () => {
      it('should init auctionsOf using snapshot', async () => {
        const userAddresses = [];
        const sessionPerAddressCounts = [];
        const allSessionIds = [];
        Object.keys(auctionSnapshot.auctionOf)
          .slice(0, 40)
          .forEach((userAddress) => {
            userAddresses.push(userAddress);
            const sessionIds = auctionSnapshot.auctionOf[userAddress];
            sessionPerAddressCounts.push(sessionIds.length);
            allSessionIds.push(...sessionIds);
          });

        const estimatedGas = await auction.setAuctionsOf.estimateGas(
          userAddresses,
          sessionPerAddressCounts,
          allSessionIds
        );
        console.log('estimatedGas', estimatedGas);
      });
    });

    describe('setAuctionBetOf', () => {
      it('should init auctionBetOf using snapshot', async () => {
        const sessionId = Object.keys(auctionSnapshot.auctionBetOf)[0];
        const userAddresses = [];
        const eths = [];
        const refs = [];
        Object.keys(auctionSnapshot.auctionBetOf[sessionId]).map(
          (userAddress) => {
            userAddresses.push(userAddress);
            const { eth, ref } = auctionSnapshot.auctionBetOf[sessionId][
              userAddress
            ];
            eths.push(eth);
            refs.push(ref);
          }
        );

        const estimatedGas = await auction.setAuctionBetOf.estimateGas(
          sessionId,
          userAddresses,
          eths,
          refs
        );
        console.log('estimatedGas', estimatedGas);
      });
    });

    describe('setExistAuctionsOf', () => {
      it('should init existAuctionsOf using snapshot', async () => {
        const sessionId = Object.keys(auctionSnapshot.existAuctionsOf)[0];
        const userAddresses = [];
        const exists = [];
        Object.keys(auctionSnapshot.existAuctionsOf[sessionId]).map(
          (userAddress) => {
            userAddresses.push(userAddress);
            const exist = auctionSnapshot.auctionBetOf[sessionId][userAddress];
            exists.push(exist);
          }
        );

        const estimatedGas = await auction.setExistAuctionsOf.estimateGas(
          sessionId,
          userAddresses,
          exists
        );
        console.log('estimatedGas', estimatedGas);
      });
    });
  }
);
