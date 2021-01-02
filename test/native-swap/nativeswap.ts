import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';

import { SECONDS_IN_DAY, STAKE_PERIOD } from '../utils/constants';
import { TestUtil } from '../utils/TestUtil';

describe('Native Swap', () => {
  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const {
        nativeswap,
        token,
        swaptoken,
        auction,
      } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      expect(
        await nativeswap.getRoleMemberCount(ROLES.DEFAULT_ADMIN).then(String)
      ).to.eq('0'); // Test that admin has 0 members

      expect(
        await nativeswap.getRoleMemberCount(ROLES.MIGRATOR).then(String)
      ).to.eq('1'); // Test that migrator has only 1 member

      expect(await nativeswap.hasRole(ROLES.MIGRATOR, setter.address)).to.eq(
        true
      ); // Ensure migrator role is the setters

      expect(
        await nativeswap.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('1'); // Test that manager has only 1 member

      expect(await nativeswap.hasRole(ROLES.MANAGER, setter.address)).to.eq(
        true
      ); // Ensure manager roles is the setters

      const stepTimeStamp = await nativeswap.stepTimestamp(); // Get time stamp from nativeSwap
      const period = await nativeswap.period(); // get valid period from native swap

      expect(stepTimeStamp.toString()).to.eq(`${SECONDS_IN_DAY}`); // Ensure stepTimestamp is set correct
      expect(period.toString()).to.eq(`${STAKE_PERIOD}`); // Ensure period is set correct
      expect(await nativeswap.mainToken()).to.eq(token.address); // Ensure token address set correct
      expect(await nativeswap.swapToken()).to.eq(swaptoken.address); // Ensure swap token is set correct
      expect(await nativeswap.auction()).to.eq(auction.address); // Ensure auction address is set correct
    });

    it('should allow manager to setup role', async () => {
      const [setter, recipient, setToManager] = await ethers.getSigners();
      const { nativeswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await nativeswap
        .connect(setter)
        .setupRole(ROLES.MANAGER, setToManager.address);
      expect(
        await nativeswap.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('2'); // Test that manager has only 1 member

      expect(
        await nativeswap.hasRole(ROLES.MANAGER, setToManager.address)
      ).to.eq(true); // Ensure manager roles is the setters
    });
  });

  describe('trade swap token for axn', async () => {
    it('should fail deposit swap tokens if balance = 0', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).approve(nativeswap.address, '0'); // Approve swap token for native swap
      await expect(nativeswap.connect(user).deposit('10')).to.be.revertedWith(
        'transfer amount exceeds balance'
      ); // Deposit fail
    });
    it('should deposit swap tokens', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, '10'); // Mint Swap stoken for user
      await swaptoken.connect(user).approve(nativeswap.address, '10'); // Approve swap token for native swap
      await nativeswap.connect(user).deposit('10'); // Deposit

      expect(
        await nativeswap.swapTokenBalanceOf(user.address).then(String)
      ).to.eq('10'); // Ensure balance swap token balance of user address is set correct
    });
    it('should withdraw swap tokens', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, '10'); // Mint Swap stoken for user
      await swaptoken.connect(user).approve(nativeswap.address, '10'); // Approve swap token for native swap
      await nativeswap.connect(user).deposit('10'); // Deposit

      expect(
        await nativeswap.swapTokenBalanceOf(user.address).then(String)
      ).to.eq('10'); // Ensure balance swap token balance of user address is set correct

      /**
       * The following is super weird...
       * It makes you ask yourself, "Why add a param on the function if it's impossible to use except on the exact value of the users swapBalance?"
       * */
      await expect(nativeswap.connect(user).withdraw('11')).to.be.revertedWith(
        'subtraction overflow'
      ); // Revert on Boundary above
      await expect(nativeswap.connect(user).withdraw('9')).to.be.revertedWith(
        'balance < amount'
      ); // Revert on Boundary Below

      await nativeswap.connect(user).withdraw('10'); // Withdraw swap tokens back into user wallet

      expect(
        await nativeswap.swapTokenBalanceOf(user.address).then(String)
      ).to.eq('0'); // Ensure that swapTokenBalanceOf user has subtracted # of withdrawed swap token
      expect(await swaptoken.balanceOf(user.address).then(String)).to.eq('10'); // Ensure user has 9 swap token returned to them
    });
    it('should swap native tokens for axn', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken, token } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, '10'); // Mint Swap stoken for user
      await swaptoken.connect(user).approve(nativeswap.address, '10'); // Approve swap token for native swap
      await nativeswap.connect(user).deposit('10'); // Deposit
      await nativeswap.connect(user).swapNativeToken(); // Swap deposited native token for axn

      expect(await token.balanceOf(user.address).then(String)).to.eq('10'); // Ensure user has received axn
    });
    it('should not swap native tokens for axn if user balance is 0', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken, token } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, '10'); // Mint Swap stoken for user
      await expect(
        nativeswap.connect(user).swapNativeToken()
      ).to.be.revertedWith('amount == 0'); // ensure swap native token does not send 0
    });
    it('should fail to swap native tokens for axn if period has past', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap, swaptoken, token } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, '10'); // Mint Swap stoken for user
      await swaptoken.connect(user).approve(nativeswap.address, '10'); // Approve swap token for native swap
      await nativeswap.connect(user).deposit('10'); // Deposit
      await TestUtil.increaseTime(SECONDS_IN_DAY * (STAKE_PERIOD + 1)); // Increase time to stake_period + 1
      await expect(
        nativeswap.connect(user).swapNativeToken()
      ).to.be.revertedWith('swap is over'); // Ensure fails with swap is over (Boundary test for 350 is done in next section)
    });
  });

  describe('late penalties', async () => {
    async function runPenalties(days: any, mint: any) {
      const [setter, recipient, user] = await ethers.getSigners();
      const {
        nativeswap,
        swaptoken,
        token,
        auction,
      } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await swaptoken.connect(user).mint(user.address, String(mint)); // Mint
      await TestUtil.increaseTime(SECONDS_IN_DAY * days); // fast forward time on the block
      await swaptoken.connect(user).approve(nativeswap.address, String(mint)); // Approve
      await nativeswap.connect(user).deposit(String(mint)); // deposit token into native swap
      await nativeswap.connect(user).swapNativeToken(); // Swap tokens

      const axnSentToAuction = await nativeswap
        .calculateDeltaPenalty(mint)
        .then(Number); // Take math from nativeSwap to determine axn sent to auction

      const balance = await token.balanceOf(user.address); // Obtain balance of user
      expect(balance.toString()).to.eq(String(mint - axnSentToAuction)); // Ensure users balance is mint amount subtracted by axn sent to auction

      const auctionBalance = await token.balanceOf(auction.address); // Obtain auction balance
      expect(auctionBalance.toString()).to.eq(String(axnSentToAuction)); // Ensure auction balance is the amount of expected axn sent to auction
    }

    it('days since start can not be -1', async () => {
      /** Boundary Test */
      /** Setup Constants */
      const DAYS_SINCE_START = -1; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      try {
        await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
      } catch (error) {
        expect(error.message).to.be.eq(
          'VM Exception while processing transaction: revert SafeMath: subtraction overflow'
        );
      }
    });
    it('should not penalize on day 0', async () => {
      /** Setup Constants */
      const DAYS_SINCE_START = 0; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
    });
    it('should penalize for late swap', async () => {
      const DAYS_SINCE_START = 7; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
    });
    it('should penalize for late swap on day 350', async () => {
      // 350 is the inner boundary test
      const DAYS_SINCE_START = 350; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
    });
    it('should not allow to swap on day 351', async () => {
      // 351 boundary test
      const DAYS_SINCE_START = 351; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      try {
        await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
      } catch (error) {
        expect(error.message).to.be.eq(
          'VM Exception while processing transaction: revert swapNativeToken: swap is over'
        );
      }
    });
    it('should not allow to swap on day 352', async () => {
      // 352 outer boundary test
      const DAYS_SINCE_START = 352; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      try {
        await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
      } catch (error) {
        expect(error.message).to.be.eq(
          'VM Exception while processing transaction: revert swapNativeToken: swap is over'
        );
      }
    });
    it('should not allow to swap on day 500', async () => {
      // 500 far outer boundary test
      const DAYS_SINCE_START = 500; // # of days for test
      const MINT_AMOUNT = 1000; // Mint 1000

      try {
        await runPenalties(DAYS_SINCE_START, MINT_AMOUNT);
      } catch (error) {
        expect(error.message).to.be.eq(
          'VM Exception while processing transaction: revert swapNativeToken: swap is over'
        );
      }
    });
    it('calculate delta after period should result in 100% penalty', async () => {
      const [setter, recipient, user] = await ethers.getSigners();
      const { nativeswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await TestUtil.increaseTime(SECONDS_IN_DAY * 351); // fast forward time on the block
      const penalty = await nativeswap.calculateDeltaPenalty('1000');

      expect(penalty.toString()).to.eq('1000'); // Ensure balance swap token balance of user address is set correct
    });
  });
});
