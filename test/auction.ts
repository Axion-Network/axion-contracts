import { initTestSmartContracts } from './utils/initTestSmartContracts';
import { ROLES } from '../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  Auction,
  Token,
  Staking,
  TERC20,
  UniswapV2Router02Mock,
  StakingRestorable,
  AuctionRestorable,
} from '../typechain';
import { TestUtil } from './utils/TestUtil';

import { SECONDS_IN_DAY, AUCTIONSTAKE_MIN } from './utils/constants';

/** Helper Vars */
import { DEADLINE, DEFAULT_AUCTION_TYPES } from './utils/constants';

describe('Auction', () => {
  let token: Token;
  let swaptoken: TERC20;
  let auction: AuctionRestorable;
  let staking: StakingRestorable;
  let uniswap: UniswapV2Router02Mock;

  beforeEach(async () => {
    const [setter, recipient] = await ethers.getSigners();
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
    });
    swaptoken = contracts.swaptoken;
    token = contracts.token;
    auction = contracts.auction;
    staking = contracts.staking;
    uniswap = contracts.uniswap;
  });

  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const addresses = (await auction.addresses()) as any;

      expect(
        await auction.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('1');
      expect(addresses.mainToken).to.eq(token.address);
      expect(addresses.staking).to.eq(staking.address);
      expect(addresses.uniswap).to.eq(uniswap.address);
    });
  });

  describe('venture auction', () => {
    it('should get correct day of week & correct auction type', async () => {
      await auction.setTokensOfDay(
        1,
        [token.address, swaptoken.address],
        [65, 35]
      );
      await auction.setTokensOfDay(
        5,
        [token.address, swaptoken.address],
        [65, 35]
      );

      TestUtil.increaseTime(86400 * 18); // 18 days in future

      const auctionTypes = await auction.getAuctionModes(); // get aution
      expect(auctionTypes[1]).to.be.eq([0, 1, 0, 0, 0, 1, 0][1]);
      expect(auctionTypes[5]).to.be.eq([0, 1, 0, 0, 0, 1, 0][5]);
    });

    it('should not set token of day if percentage does not equal 100', async () => {
      await expect(
        auction.setTokensOfDay(0, [token.address], [90])
      ).to.be.revertedWith('Percentage for venture day must equal 100');
    });

    it('should set token of the day with correct percentages', async () => {
      let tokenOfDay0; // Create token of day holders

      await auction.setTokensOfDay(0, [token.address], [100]); // Set token of day to axn 100%
      tokenOfDay0 = await auction.getTokensOfDay(0); // Get token of day

      expect(tokenOfDay0[0][0]).to.be.eq(token.address); // Expect first token to be axn
      expect(tokenOfDay0[1][0]).to.be.eq(100); // expect first percent to be 100

      await auction.setTokensOfDay(
        5,
        [token.address, swaptoken.address],
        [65, 35]
      );
      tokenOfDay0 = await auction.tokensOfTheDay(5);

      expect(tokenOfDay0[0][0]).to.be.eq(token.address);
      expect(tokenOfDay0[1][0]).to.be.eq(65);
      expect(tokenOfDay0[1][0]).to.be.eq(swaptoken.address);
      expect(tokenOfDay0[1][1]).to.be.eq(35);
    });
  });

  describe('withdraw', () => {
    it(`should correctly withdraw non venture auction bid, and fail if not between ${AUCTIONSTAKE_MIN} and 5555 days`, async () => {
      let auctionID = await auction.lastAuctionEventId();
      const [account1, account2] = await ethers.getSigners();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('1'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await auction.connect(account1).withdraw(auctionID, AUCTIONSTAKE_MIN);

      let stakeSessionId = await staking.sessionsOf(account1.address, 0);

      let stakeSessionData = await staking.sessionDataOf(
        account1.address,
        stakeSessionId
      );

      expect(
        stakeSessionData.end.sub(stakeSessionData.start).div(SECONDS_IN_DAY)
      ).to.equal(AUCTIONSTAKE_MIN);

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await auction.connect(account1).withdraw(auctionID, 350);

      stakeSessionId = await staking.sessionsOf(account1.address, 1);

      stakeSessionData = await staking.sessionDataOf(
        account1.address,
        stakeSessionId
      );

      expect(
        stakeSessionData.end.sub(stakeSessionData.start).div(SECONDS_IN_DAY)
      ).to.equal(350);

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 5556)
      ).to.be.revertedWith('Auction: stakeDays > 5555');

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 1)
      ).to.be.revertedWith('Auction: stakeDays < minimum days');
    });

    it(`should correctly withdraw venture auction bid, and fail if not between ${AUCTIONSTAKE_MIN} and 5555 days`, async () => {
      let auctionID = await auction.lastAuctionEventId();
      const [account1, account2] = await ethers.getSigners();

      await auction.setTokensOfDay(0, [token.address], [100]);

      console.log(await staking.getDivTokens());

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('1'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);
      await staking.makePayout();

      await auction.connect(account1).withdraw(auctionID, AUCTIONSTAKE_MIN);

      let stakeSessionId = await staking.sessionsOf(account1.address, 0);

      let stakeSessionData = await staking.sessionDataOf(
        account1.address,
        stakeSessionId
      );

      expect(
        stakeSessionData.end.sub(stakeSessionData.start).div(SECONDS_IN_DAY)
      ).to.equal(AUCTIONSTAKE_MIN);

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await auction.connect(account1).withdraw(auctionID, 350);

      stakeSessionId = await staking.sessionsOf(account1.address, 1);

      stakeSessionData = await staking.sessionDataOf(
        account1.address,
        stakeSessionId
      );

      expect(
        stakeSessionData.end.sub(stakeSessionData.start).div(SECONDS_IN_DAY)
      ).to.equal(350);

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 5556)
      ).to.be.revertedWith('Auction: stakeDays > 5555');

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid([0], DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 1)
      ).to.be.revertedWith('Auction: stakeDays < minimum days');
    });
  });
});
