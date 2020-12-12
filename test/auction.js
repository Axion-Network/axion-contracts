const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');
chai.use(require('chai-bn')(BN));
const EthCrypto = require('eth-crypto');

const DAY = 86400;
const DEADLINE = web3.utils.toWei('10000000');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const testSigner = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);
const testSignerPriv =
  'eaac3bee2ca2316bc2dad3f2efcc91c17cee394d45cebc8529bfa250061dac89';
const MAX_CLAIM_AMOUNT = new BN(10 ** 7);

const getMessageHash = (encodeTypes, args) => {
  let encoded = web3.eth.abi.encodeParameters(encodeTypes, args);
  return web3.utils.soliditySha3(encoded);
};

const sign = (address, pkey, messageParamsTypes, messageParams) => {
  const messageHash = getMessageHash(messageParamsTypes, messageParams);

  return EthCrypto.sign(pkey, messageHash);
};

contract('Auction', ([setter, recipient, account1, account2, account3]) => {
  let swaptoken;
  let foreignswap;
  let token;
  let nativeswap;
  let dailyauction;
  let uniswap;
  let subBalances;
  let staking;
  let bpd;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    swaptoken = contracts.swaptoken;
    foreignswap = contracts.foreignswap;
    token = contracts.token;
    nativeswap = contracts.nativeswap;
    dailyauction = contracts.auction;
    uniswap = contracts.uniswap;
    subBalances = contracts.subbalances;
    staking = contracts.staking;
    bpd = contracts.bpd;
  });

  describe('set', () => {
    it('should allow manager to set percentages autostakes and referral on/off', async () => {
      /** Referral Ssyte, */
      await dailyauction.setReferrerPercentage(5, { from: setter });
      let referrerPercent = (await dailyauction.options()).referrerPercent;
      expect(referrerPercent.toString()).to.eq('5');
      await dailyauction.setReferredPercentage(5, { from: setter });
      let referredPercent = (await dailyauction.options()).referredPercent;
      expect(referredPercent.toString()).to.eq('5');
      await dailyauction.setReferralsOn(false, { from: setter });
      let referralsOn = (await dailyauction.options()).referralsOn;
      expect(referralsOn).to.eq(false);
      /** Auto stake */
      await dailyauction.setAutoStakeDays(30, { from: setter });
      let autoStakeDays = (await dailyauction.options()).autoStakeDays;
      expect(autoStakeDays.toString()).to.eq('30');
      // Price manipulation
      await dailyauction.setDiscountPercent(5, { from: setter });
      let discountPercent = (await dailyauction.options()).discountPercent;
      expect(discountPercent.toString()).to.eq('5');
      await dailyauction.setPremiumPercent(5, { from: setter });
      let premiumPercent = (await dailyauction.options()).premiumPercent;
      expect(premiumPercent.toString()).to.eq('5');
    });
  });

  describe('bid', () => {
    it('should update the contract state correctly', async () => {
      // Advance the date to day 100 after launch
      await helper.advanceTimeAndBlock(DAY * 100);

      // ---------------------------------- 1st bid ----------------------------
      const prevRecipientETHBalance1 = await web3.eth.getBalance(recipient);

      // Bid with 10 eth
      await dailyauction.bid(0, DEADLINE, ZERO_ADDRESS, {
        from: account1,
        value: web3.utils.toWei('10'),
      });

      // _saveAuctionData()
      const currentAuctionId1 = await dailyauction.lastAuctionEventId();
      expect(currentAuctionId1.toString()).to.eq('100');

      const {
        eth: auctionEth1,
        token: token1,
        uniswapLastPrice: uniswapLastPrice1,
        uniswapMiddlePrice: uniswapMiddlePrice1,
      } = await dailyauction.reservesOf(currentAuctionId1);

      // _updatePrice();
      expect(uniswapLastPrice1.toString()).to.eq('1000000000000000000');
      expect(uniswapMiddlePrice1.toString()).to.eq('1000000000000000000');

      // User auction bid
      const userAuctionBid1 = await dailyauction.auctionBidOf(
        currentAuctionId1,
        account1
      );
      const { eth: userEth1, ref: ref1 } = userAuctionBid1;
      expect(web3.utils.fromWei(userEth1.toString())).to.eq('10');
      expect(ref1).to.eq(ZERO_ADDRESS);

      // Check the reserves of the auction
      expect(web3.utils.fromWei(auctionEth1.toString())).to.eq('10');
      expect(token1.toString()).to.eq('0');

      const postRecipientETHBalance1 = await web3.eth.getBalance(recipient);

      // 80% to uniswap, 20% to recipient
      const recipientETHBalanceChange1 = new BN(postRecipientETHBalance1).sub(
        new BN(prevRecipientETHBalance1)
      );
      expect(web3.utils.fromWei(recipientETHBalanceChange1)).to.eq('2');

      // ---------------------------------- 2nd bid ----------------------------
      const prevRecipientETHBalance2 = await web3.eth.getBalance(recipient);

      // Bid with 20 eth
      await dailyauction.bid(0, DEADLINE, account2, {
        from: account1,
        value: web3.utils.toWei('20'),
      });

      // _saveAuctionData()
      const currentAuctionId2 = await dailyauction.lastAuctionEventId();
      expect(currentAuctionId2.toString()).to.eq('100');

      const {
        eth: auctionEth2,
        token: token2,
        uniswapLastPrice: uniswapLastPrice2,
        uniswapMiddlePrice: uniswapMiddlePrice2,
      } = await dailyauction.reservesOf(currentAuctionId1);

      // _updatePrice();
      expect(uniswapLastPrice2.toString()).to.eq('1000000000000000000');
      expect(uniswapMiddlePrice2.toString()).to.eq('1000000000000000000');

      // User auction bid
      const userAuctionBid2 = await dailyauction.auctionBidOf(
        currentAuctionId1,
        account1
      );
      const { eth: userEth2, ref: ref2 } = userAuctionBid2;
      expect(web3.utils.fromWei(userEth2.toString())).to.eq('30');
      expect(ref2).to.eq(account2);

      // Check the reserves of the auction
      expect(web3.utils.fromWei(auctionEth2.toString())).to.eq('30');
      expect(token2.toString()).to.eq('0');

      const postRecipientETHBalance2 = await web3.eth.getBalance(recipient);

      // 80% to uniswap, 20% to recipient
      const recipientETHBalanceChange2 = new BN(postRecipientETHBalance2).sub(
        new BN(prevRecipientETHBalance2)
      );
      expect(web3.utils.fromWei(recipientETHBalanceChange2)).to.eq('4');
    });
  });

  describe('withdraw', () => {
    describe('failure cases', () => {
      it('should fail if the user withdraws before bidding', async () => {
        // Advance the date to day 51 after launch
        await helper.advanceTimeAndBlock(DAY * 51);

        try {
          // Withdraw on day 50
          await dailyauction.withdraw('50', { from: account1 });
          expect.fail('it should fail');
        } catch (err) {
          expect(err.reason).to.eq('Auction: Zero bid or withdrawn');
        }
      });

      it('should fail if the auction is still active', async () => {
        // Advance the date to day 51 after launch
        await helper.advanceTimeAndBlock(DAY * 50);

        try {
          // Withdraw on day 50
          await dailyauction.withdraw('50', { from: account1 });
          expect.fail('it should fail');
        } catch (err) {
          expect(err.reason).to.eq('Auction: Auction is active');
        }
      });
    });

    describe('successful cases', () => {
      beforeEach(async () => {
        // setter swap swapToken to mainToken - to generate penalty
        await swaptoken.approve(
          nativeswap.address,
          web3.utils.toWei('10000000000'),
          { from: setter }
        );
        await nativeswap.deposit(web3.utils.toWei('100000'), {
          from: setter,
        });

        // Advance the date to day 175 after launch - so there is a penalty 50%
        await helper.advanceTimeAndBlock(DAY * 175);
        await nativeswap.swapNativeToken({ from: setter });
        // Advance to day 176, we will bid on this day
        await helper.advanceTimeAndBlock(DAY);

        const auctionMainTokenBalance = await token.balanceOf(
          dailyauction.address
        );
        // The penalty is transferred to the auction = 100000 * 50% = 50000
        expect(web3.utils.fromWei(auctionMainTokenBalance.toString())).to.eq(
          '50000'
        );
      });

      it('should success and update the contract state correctly (without ref)', async () => {
        // User1 & User 2: Bid with 10 eth
        await dailyauction.bid(0, DEADLINE, ZERO_ADDRESS, {
          from: account1,
          value: web3.utils.toWei('10'),
        });
        await dailyauction.bid(0, DEADLINE, ZERO_ADDRESS, {
          from: account2,
          value: web3.utils.toWei('20'),
        });

        // Advance the date to day 177 after launch, so the auction on day 176 is ended
        await helper.advanceTimeAndBlock(DAY);

        expect((await dailyauction.auctionBidOf('176', account1))
          .withdrawn).to.be.false;
        expect((await dailyauction.auctionBidOf('176', account2))
          .withdrawn).to.be.false;

        // User1 & User2: Withdraw on day 8
        await dailyauction.withdraw('176', { from: account1 });
        await dailyauction.withdraw('176', { from: account2 });

        // Check state of user1 and user2
        const { 
          eth: user1Eth, 
          ref: user1Ref, 
          withdrawn: user1Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account1
        );
        expect(web3.utils.fromWei(user1Eth)).to.eq('10');
        expect(user1Ref).to.eq(ZERO_ADDRESS);
        expect(user1Withdrawn).to.be.true;

        const { 
          eth: user2Eth, 
          ref: user2Ref, 
          withdrawn: user2Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account2
        );
        expect(web3.utils.fromWei(user2Eth)).to.eq('20');
        expect(user2Ref).to.eq(ZERO_ADDRESS);
        expect(user2Withdrawn).to.be.true;

        const [event1, event2] = await dailyauction.getPastEvents(
          'Withdraval',
          {
            fromBlock: 0,
            toBlock: 'latest',
          }
        );
        expect(event1.returnValues.value).to.eq('12000000000000000000');
        expect(event2.returnValues.value).to.eq('24000000000000000000');
      });
    
      it("should set amountOutMin for buyback", async () => {
        const expectedAmountOutMin = 1000;

        // Bid with 10 eth
        await dailyauction.bid(expectedAmountOutMin, DEADLINE, ZERO_ADDRESS, {
          from: account1,
          value: web3.utils.toWei("10"),
        });

        expect((await uniswap.lastAmountsOutMin()).toNumber()).to.eq(expectedAmountOutMin);
      });
  
      it('should success and update the contract state correctly (with ref)', async () => {
        // User1 & User 2: Bid with 10 eth
        await dailyauction.bid(0, DEADLINE, account3, {
          from: account1,
          value: web3.utils.toWei('10'),
        });
        await dailyauction.bid(0, DEADLINE, account3, {
          from: account2,
          value: web3.utils.toWei('30'),
        });

        // Advance the date to day 177 after launch, so the auction on day 176 is ended
        await helper.advanceTimeAndBlock(DAY);

        expect((await dailyauction.auctionBidOf('176', account1))
          .withdrawn).to.be.false;
        expect((await dailyauction.auctionBidOf('176', account2))
          .withdrawn).to.be.false;

        // User1 & User2: Withdraw on day 8
        await dailyauction.withdraw('176', { from: account1 });
        await dailyauction.withdraw('176', { from: account2 });

        // Check state of user1 and user2
        const { 
          eth: user1Eth, 
          ref: user1Ref, 
          withdrawn: user1Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account1
        );
        expect(web3.utils.fromWei(user1Eth)).to.eq('10');
        expect(user1Ref).to.eq(account3);
        expect(user1Withdrawn).to.be.true;

        const { 
          eth: user2Eth, 
          ref: user2Ref, 
          withdrawn: user2Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account2
        );
        expect(web3.utils.fromWei(user2Eth)).to.eq('30');
        expect(user2Ref).to.eq(account3);
        expect(user2Withdrawn).to.be.true;

        const [event1, event2] = await dailyauction.getPastEvents(
          'Withdraval',
          {
            fromBlock: 0,
            toBlock: 'latest',
          }
        );
        expect(event1.returnValues.value).to.eq('13200000000000000000');
        expect(event2.returnValues.value).to.eq('39600000000000000000');
      });

      it('should take into account premium and discount', async () => {
        await dailyauction.setPremiumPercent(10, { from: setter });
        // User1 & User 2: Bid with 10 eth
        await dailyauction.bid(0, DEADLINE, account3, {
          from: account1,
          value: web3.utils.toWei('10'),
        });

        await dailyauction.bid(0, DEADLINE, account3, {
          from: account2,
          value: web3.utils.toWei('30'),
        });

        // Advance the date to day 177 after launch, so the auction on day 176 is ended
        await helper.advanceTimeAndBlock(DAY);

        expect((await dailyauction.auctionBidOf('176', account1))
          .withdrawn).to.be.false;
        expect((await dailyauction.auctionBidOf('176', account2))
          .withdrawn).to.be.false;

        // User1 & User2: Withdraw on day 8
        await dailyauction.withdraw('176', { from: account1 });
        await dailyauction.withdraw('176', { from: account2 });

        // Check state of user1 and user2
        const { 
          eth: user1Eth, 
          ref: user1Ref, 
          withdrawn: user1Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account1
        );
        expect(web3.utils.fromWei(user1Eth)).to.eq('10');
        expect(user1Ref).to.eq(account3);
        expect(user1Withdrawn).to.be.true;

        const { 
          eth: user2Eth, 
          ref: user2Ref, 
          withdrawn: user2Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account2
        );
        expect(web3.utils.fromWei(user2Eth)).to.eq('30');
        expect(user2Ref).to.eq(account3);
        expect(user2Withdrawn).to.be.true;

        const [event1, event2] = await dailyauction.getPastEvents(
          'Withdraval',
          {
            fromBlock: 0,
            toBlock: 'latest',
          }
        );

        expect(event1.returnValues.value).to.eq('12100000000000000000');
        expect(event2.returnValues.value).to.eq('36300000000000000000');
      });

      it("it shouldn't allow referrals when referrals are off", async () => {
        await dailyauction.setReferralsOn(false, { from: setter });
        // User1 & User 2: Bid with 10 eth
        await dailyauction.bid(0, DEADLINE, account3, {
          from: account1,
          value: web3.utils.toWei('10'),
        });
        // Advance the date to day 177 after launch, so the auction on day 176 is ended
        await helper.advanceTimeAndBlock(DAY);

        expect((await dailyauction.auctionBidOf('176', account1))
          .withdrawn).to.be.false;

        // User1 & User2: Withdraw on day 8
        await dailyauction.withdraw('176', { from: account1 });

        // Check state of user1 and user2
        const { 
          eth: user1Eth, 
          ref: user1Ref, 
          withdrawn: user1Withdrawn
         } = await dailyauction.auctionBidOf(
          '176',
          account1
        );
        expect(web3.utils.fromWei(user1Eth)).to.eq('10');
        expect(user1Ref).to.eq(ZERO_ADDRESS);
        expect(user1Withdrawn).to.be.true;
      });
    });
  });

  describe('big penalty amount (exceed 10M hex free claim)', () => {
    it('should not receive big penalty amount', async () => {
      const exceedAmount = MAX_CLAIM_AMOUNT; // 10 M

      const exceedSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [exceedAmount.toString(), account1]
      );

      await foreignswap.claimFromForeign(exceedAmount, exceedSignature, {
        from: account1,
      });

      const day6AuctionReserves = await dailyauction.reservesOf('6');
      expect(day6AuctionReserves.token.toString()).to.eq('0');

      const weeklyAuctionReserves = await dailyauction.reservesOf('7');
      expect(weeklyAuctionReserves.token.toString()).to.eq('0');

      const day8AuctionReserves = await dailyauction.reservesOf('8');
      expect(day8AuctionReserves.token.toString()).to.eq('0');
    });

    it('should receive big penalty amount', async () => {
      const exceedAmount = MAX_CLAIM_AMOUNT.add(new BN(1)); // 20 M

      const exceedSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [exceedAmount.toString(), account1]
      );

      await foreignswap.claimFromForeign(exceedAmount, exceedSignature, {
        from: account1,
      });

      const day6AuctionReserves = await dailyauction.reservesOf('6');
      expect(day6AuctionReserves.token.toString()).to.eq('0');

      const weeklyAuctionReserves = await dailyauction.reservesOf('7');
      expect(weeklyAuctionReserves.token.toString()).to.eq('1');

      const day8AuctionReserves = await dailyauction.reservesOf('8');
      expect(day8AuctionReserves.token.toString()).to.eq('0');
    });
  });
});
