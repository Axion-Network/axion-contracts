import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  Auction,
  Token,
  Staking,
  UniswapV2Router02Mock,
} from '../../typechain';
import { TestUtil } from '../utils/TestUtil';

import { SECONDS_IN_DAY, AUCTIONSTAKE_MIN } from '../utils/constants';

/** Helper Vars */
const DEADLINE = ethers.utils.parseEther('10000000');

describe('Auction', () => {
  let token: Token;
  let auction: Auction;
  let staking: Staking;
  let uniswap: UniswapV2Router02Mock;

  beforeEach(async () => {
    const [setter, recipient] = await ethers.getSigners();
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
    });

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

  describe('withdraw', () => {
    it.only(`should correctly withdraw, and fail if not between ${AUCTIONSTAKE_MIN} and 5555 days`, async () => {
      let auctionID = await auction.lastAuctionEventId();
      const [account1, account2] = await ethers.getSigners();

      await auction.connect(account1).bid(0, DEADLINE, account2.address, {
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

      await auction.connect(account1).bid(0, DEADLINE, account2.address, {
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

      await auction.connect(account1).bid(0, DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 5556)
      ).to.be.revertedWith('Auction: stakeDays > 5555');

      auctionID = await auction.lastAuctionEventId();

      await auction.connect(account1).bid(0, DEADLINE, account2.address, {
        value: ethers.utils.parseEther('2'),
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await expect(
        auction.connect(account1).withdraw(auctionID, 1)
      ).to.be.revertedWith('Auction: stakeDays < minimum days');
    });
  });
});
