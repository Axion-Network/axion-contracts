import { AuctionInstance } from '../../types/truffle-contracts';

const auctionSnapshot = require('./mock-auction-snapshot.json');
const initTestSmartContracts = require('../utils/initTestSmartContracts');

contract('Auction - Migration', ([setter, recipient]) => {
  let auction: AuctionInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    auction = contracts.auction;
  });

  describe('setNormalVariables', () => {
    it('should set all normal variables', async () => {
      // act
      await auction.setNormalVariables(
        auctionSnapshot.lastAuctionEventId,
        auctionSnapshot.start
      );

      // assert
      expect(await auction.lastAuctionEventId().then(String)).to.eq(
        auctionSnapshot.lastAuctionEventId
      );
      expect(await auction.start().then(String)).to.eq(auctionSnapshot.start);
    });
  });

  describe('setReservesOf', () => {
    it('should init reservesOf using snapshot', async () => {
      // arrange
      const allSessionIds: string[] = [];
      const eths: string[] = [];
      const tokens: string[] = [];
      const uniswapLastPrices: string[] = [];
      const uniswapMiddlePrices: string[] = [];
      Object.keys(auctionSnapshot.reservesOf)
        .slice(0, 5)
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

      // act
      await auction.setReservesOf(
        allSessionIds,
        eths,
        tokens,
        uniswapLastPrices,
        uniswapMiddlePrices
      );

      // assert
      for (const sessionId of allSessionIds) {
        const {
          eth,
          token,
          uniswapLastPrice,
          uniswapMiddlePrice,
        } = (await auction.reservesOf(sessionId)) as any;
        expect(eth.toString()).to.eq(auctionSnapshot.reservesOf[sessionId].eth);
        expect(token.toString()).to.eq(
          auctionSnapshot.reservesOf[sessionId].token
        );
        expect(uniswapLastPrice.toString()).to.eq(
          auctionSnapshot.reservesOf[sessionId].uniswapLastPrice
        );
        expect(uniswapMiddlePrice.toString()).to.eq(
          auctionSnapshot.reservesOf[sessionId].uniswapMiddlePrice
        );
      }
    });
  });

  describe('setAuctionsOf', () => {
    it('should init auctionsOf using snapshot', async () => {
      // arrange
      const userAddresses: string[] = [];
      const sessionPerAddressCounts: string[] = [];
      const allSessionIds: string[] = [];
      Object.keys(auctionSnapshot.auctionOf)
        .slice(0, 5)
        .forEach((userAddress) => {
          userAddresses.push(userAddress);
          const sessionIds = auctionSnapshot.auctionOf[userAddress];
          sessionPerAddressCounts.push(sessionIds.length);
          allSessionIds.push(...sessionIds);
        });

      // act
      await auction.setAuctionsOf(
        userAddresses,
        sessionPerAddressCounts,
        allSessionIds
      );

      // assert
      for (const userAddress of userAddresses) {
        const numSessions = auctionSnapshot.auctionOf[userAddress].length;
        const userSessionIds: string[] = [];
        for (let idx = 0; idx < numSessions; idx++) {
          userSessionIds.push(
            await auction.auctionsOf(userAddress, idx).then(String)
          );
        }
        expect(userSessionIds).to.deep.eq(
          auctionSnapshot.auctionOf[userAddress]
        );
      }
    });
  });

  describe('setAuctionBidOf', () => {
    it('should init auctionBidOf using snapshot', async () => {
      // arrange
      const sessionId = Object.keys(auctionSnapshot.auctionBidOf)[0];
      const userAddresses: string[] = [];
      const eths: string[] = [];
      const refs: string[] = [];
      Object.keys(auctionSnapshot.auctionBidOf[sessionId]).map(
        (userAddress) => {
          userAddresses.push(userAddress);
          const { eth, ref } = auctionSnapshot.auctionBidOf[sessionId][
            userAddress
          ];
          eths.push(eth);
          refs.push(ref);
        }
      );

      // act
      await auction.setAuctionBidOf(sessionId, userAddresses, eths, refs);

      // assert
      for (const userAddress of userAddresses) {
        const { eth, ref } = (await auction.auctionBidOf(
          sessionId,
          userAddress
        )) as any;
        const expectedAuctionBid =
          auctionSnapshot.auctionBidOf[sessionId][userAddress];
        expect(eth.toString()).to.eq(expectedAuctionBid.eth);
        expect(ref.toString()).to.eq(expectedAuctionBid.ref);
      }
    });
  });

  describe('setExistAuctionsOf', () => {
    it('should init existAuctionsOf using snapshot', async () => {
      // arrange
      const sessionId = Object.keys(auctionSnapshot.existAuctionsOf)[0];
      const userAddresses: string[] = [];
      const exists: boolean[] = [];
      Object.keys(auctionSnapshot.existAuctionsOf[sessionId]).map(
        (userAddress) => {
          userAddresses.push(userAddress);
          const exist = auctionSnapshot.auctionBidOf[sessionId][userAddress];
          exists.push(exist);
        }
      );

      // act
      await auction.setExistAuctionsOf(sessionId, userAddresses, exists);

      for (const userAddress of userAddresses) {
        const exist = await auction.existAuctionsOf(sessionId, userAddress);
        expect(exist).to.eq(
          auctionSnapshot.existAuctionsOf[sessionId][userAddress]
        );
      }
    });
  });
});
