const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
const expectRevert = require('./utils/expectRevert.js');
chai.use(require('chai-bn')(BN));
const EthCrypto = require('eth-crypto');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const TERC20 = artifacts.require('TERC20');
const Token = artifacts.require('Token');
const Auction = artifacts.require('Auction');
const SubBalances = artifacts.require('SubBalances');
const Staking = artifacts.require('Staking');
const ForeignSwap = artifacts.require('ForeignSwap');
const BPD = artifacts.require('BPD');

// Mocks
const AuctionMock = artifacts.require('AuctionMock');
const StakingMock = artifacts.require('StakingMock');

const DAY = 900;
const STAKE_PERIOD = 10;

const testSigner = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);
const testSignerPriv =
  'eaac3bee2ca2316bc2dad3f2efcc91c17cee394d45cebc8529bfa250061dac89';
const totalSnapshotAmount = new BN(10 ** 10);
const totalSnapshotAddresses = new BN(10);

const getMessageHash = (encodeTypes, args) => {
  let encoded = web3.eth.abi.encodeParameters(encodeTypes, args);
  return web3.utils.soliditySha3(encoded);
};

const sign = (address, pkey, messageParamsTypes, messageParams) => {
  const messageHash = getMessageHash(messageParamsTypes, messageParams);

  return EthCrypto.sign(pkey, messageHash);
};

contract(
  'SubBalances',
  ([bank, setter, signer, nativeSwap, stakingCaller, account1, account2]) => {
    let swaptoken;
    let token;
    let foreignswap;
    let auction;
    let bpd;
    let signAmount;
    let testSignature;
    let maxClaimAmount;
    let stakingContract;

    beforeEach(async () => {
      maxClaimAmount = new BN(10 ** 7);
      signAmount = maxClaimAmount;
      testSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [signAmount.toString(), account1]
      );

      swaptoken = await TERC20.new(
        '2T Token',
        '2T',
        web3.utils.toWei('1000'),
        bank,
        { from: bank }
      );

      token = await deployProxy(Token, [setter, setter, 'Axion Token', 'AXN'], {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });

      auction = await AuctionMock.new();
      stakingContract = await StakingMock.new();

      // Deploy foreign swap

      foreignswap = await deployProxy(ForeignSwap, [setter, setter], {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });

      // Deploy BigPayDay Pool
      bpd = await deployProxy(BPD, [setter, setter], {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });

      // Deploy SubBalances Contract
      subbalances = await deployProxy(SubBalances, [setter, setter], {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });

      await token.initSwapperAndSwapToken(swaptoken.address, setter, {
        from: setter,
      });
      // Init token
      await token.init(
        [
          nativeSwap,
          foreignswap.address,
          auction.address,
          stakingContract.address,
          subbalances.address,
        ],
        { from: setter }
      );

      // Init foreign swap
      await foreignswap.init(
        testSigner,
        new BN(DAY.toString(), 10),
        new BN(STAKE_PERIOD.toString(), 10),
        maxClaimAmount,
        token.address,
        auction.address,
        stakingContract.address,
        bpd.address,
        totalSnapshotAmount,
        totalSnapshotAddresses,
        { from: setter }
      );

      // Init BPD Pool
      await bpd.init(token.address, foreignswap.address, subbalances.address, {
        from: setter,
      });

      // Init SubBalances Contract
      await subbalances.init(
        token.address,
        foreignswap.address,
        bpd.address,
        auction.address,
        '0x0000000000000000000000000000000000000000',
        stakingCaller,
        new BN(DAY.toString(), 10),
        new BN(STAKE_PERIOD.toString(), 10),
        { from: setter }
      );
    });

    const getBlockchainTimestamp = async () => {
      const latestBlock = await web3.eth.getBlock('latest');
      return latestBlock.timestamp;
    };

    it('should generate payout pool on 350 day', async () => {
      const amountBefore = await foreignswap.getUserClaimableAmountFor(
        signAmount
      );
      console.log('AMOUNT BEFORE', amountBefore.toString());

      await helper.advanceTimeAndBlock(DAY * (STAKE_PERIOD / 2));

      const amountAfter = await foreignswap.getUserClaimableAmountFor(
        signAmount
      );
      console.log('AMOUNT AFTER', amountAfter.toString());

      expect(amountAfter[0]).to.be.a.bignumber.that.equals(
        amountBefore[0].div(new BN('2'))
      );

      await foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      });

      const dividedAmount = signAmount.div(new BN('2'));
      // expect(
      //     await token.balanceOf(account1)
      // ).to.be.a.bignumber.that.equals(dividedAmount);

      const dividedAmountPart = dividedAmount.div(new BN('350'));
      // expect(
      //     await token.balanceOf(auction.address)
      // ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN("349")));
      // expect(
      //     await token.balanceOf(bpd.address)
      // ).to.be.a.bignumber.that.equals(dividedAmountPart);

      const bpdAmountPercent = dividedAmountPart.div(new BN('100'));
      console.log(bpdAmountPercent.toString());

      const currentPoolAmounts = await bpd.getPoolYearAmounts();
      const yearOnePool = currentPoolAmounts[0];
      console.log(yearOnePool.toString());

      // expect(
      //     yearOnePool
      // ).to.be.a.bignumber.that.equals(bpdAmountPercent.mul(new BN("10")));

      expect(await token.balanceOf(subbalances.address)).to.be.a.bignumber.zero;

      // Switch time once again to 350
      await helper.advanceTimeAndBlock(DAY * (STAKE_PERIOD / 2) + 10);

      const times = await subbalances.getStartTimes();

      expect(
        new BN(await getBlockchainTimestamp())
      ).to.be.a.bignumber.that.above(times[0]);

      await subbalances.generatePool();

      expect((await subbalances.getPoolsMinted())[0]).to.be.a.true;

      expect(
        await token.balanceOf(subbalances.address)
      ).to.be.a.bignumber.that.above(yearOnePool);

      // expect(
      //     await token.balanceOf(bpd.address)
      // ).to.be.a.bignumber.that.equals(dividedAmountPart.sub(yearOnePool));

      const firstPoolAmount = (await subbalances.getPoolsMintedAmounts())[0];
      // console.log(firstPoolAmount.toString());
      expect(firstPoolAmount).to.be.a.bignumber.that.above(yearOnePool);
    });

    it('should withdraw payout for staker', async () => {

      const initTime = new BN(await getBlockchainTimestamp());

      await helper.advanceTimeAndBlock(DAY * 3 + 5);

      const afterInitTime = new BN(await getBlockchainTimestamp());

      expect(new BN(afterInitTime - initTime)).to.be.bignumber.that.above(
        new BN(DAY * 3)
      );

      expect(await token.balanceOf(account1)).to.be.bignumber.zero;
      expect(await token.balanceOf(auction.address)).to.be.bignumber.zero;
      expect(await token.balanceOf(bpd.address)).to.be.bignumber.zero;

      await foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      });

      const penaltyAuction = await token.balanceOf(auction.address);
      const penaltyBpd = await token.balanceOf(bpd.address);
      expect(await token.balanceOf(account1)).to.be.bignumber.zero;
      expect(penaltyAuction).to.be.bignumber.not.zero;
      expect(penaltyBpd).to.be.bignumber.not.zero;
      console.log('penalty auction', penaltyAuction.toString());
      console.log('penalty bpd', penaltyBpd.toString());

      const stakeId = new BN('1');
      const stakeStartTime = afterInitTime;
      const stakeEndTime = stakeStartTime.add(new BN(DAY * STAKE_PERIOD + 10));
      const stakeShares = signAmount;

      console.log('stake time', (stakeEndTime - stakeStartTime) / DAY);

      await subbalances.callIncomeStakerTrigger(
        account1,
        stakeId,
        stakeStartTime,
        stakeEndTime,
        stakeShares,
        { from: stakingCaller }
      );

      const stakeId_2 = new BN('2');
      const stakeStartTime_2 = afterInitTime.add(new BN(DAY));
      const stakeEndTime_2 = stakeStartTime_2.add(
        new BN(DAY * (STAKE_PERIOD + 1) + 5)
      );
      const stakingShares_2 = signAmount / 2;

      console.log('stake time 2', (stakeEndTime_2 - stakeStartTime_2) / DAY);

      const stakeShares_1 = await subbalances.currentSharesTotalSupply();
      console.log('shares 1', stakeShares_1.toString());

      expect(stakeShares_1).to.be.a.bignumber.not.zero;

      await helper.advanceTimeAndBlock(DAY + 5);

      const afterSecondStake = new BN(await getBlockchainTimestamp());

      await subbalances.callIncomeStakerTrigger(
        account2,
        stakeId_2,
        stakeStartTime_2,
        stakeEndTime_2,
        stakingShares_2,
        { from: stakingCaller }
      );

      const stakeShares_2 = await subbalances.currentSharesTotalSupply();
      console.log('shares 2', stakeShares_2.toString());

      expect(stakeShares_2).to.be.bignumber.that.above(stakeShares_1);

      const stake1 = await subbalances.getStakeSession(stakeId);
      const stake2 = await subbalances.getStakeSession(stakeId_2);

      console.log(stake1.payDayEligible);
      console.log(stake2.payDayEligible);

      const estimate_1 = await subbalances.calculateSessionPayout(
        stake1.start, 
        stake1.end, 
        stake1.finishTime, 
        stake1.shares, 
        stake1.payDayEligible
      );

      const estimate_2 = await subbalances.calculateSessionPayout(
        stake2.start, 
        stake2.end, 
        stake2.finishTime, 
        stake2.shares, 
        stake2.payDayEligible
      );

      console.log(
        'estimate before 1',
        estimate_1[0].toString(),
        estimate_1[1].toString()
      );
      console.log(
        'estimate before 2',
        estimate_2[0].toString(),
        estimate_2[1].toString()
      );

      const poolStartTimes = await subbalances.getStartTimes();
      const firstPoolStartTime = poolStartTimes[0];
      console.log(((firstPoolStartTime - afterSecondStake) / DAY).toString());

      await helper.advanceTimeAndBlock(DAY * 7);

      const subbalanceBalanceBefore = await token.balanceOf(
        subbalances.address
      );

      await subbalances.generatePool();

      const subbalanceBalanceAfter = await token.balanceOf(subbalances.address);

      expect(subbalanceBalanceAfter).to.be.a.bignumber.that.above(
        subbalanceBalanceBefore
      );
      console.log(
        'sub balance',
        subbalanceBalanceBefore.toString(),
        '',
        subbalanceBalanceAfter.toString()
      );

      const poolsMinted = await subbalances.getPoolsMinted();
      expect(poolsMinted[0]).to.be.true;
      const poolsMintedAmounts = await subbalances.getPoolsMintedAmounts();
      console.log('first pool minted', poolsMintedAmounts[0].toString());
      expect(poolsMintedAmounts[0]).to.be.a.bignumber.that.not.zero;

      await helper.advanceTimeAndBlock(DAY * 3);

      const newStake1 = await subbalances.getStakeSession(stakeId);
      const newStake2 = await subbalances.getStakeSession(stakeId_2);

      const newEstimate_1 = await subbalances.calculateSessionPayout(
        newStake1.start, 
        newStake1.end, 
        newStake1.finishTime, 
        newStake1.shares, 
        newStake1.payDayEligible
      );

      const newEstimate_2 = await subbalances.calculateSessionPayout(
        newStake2.start, 
        newStake2.end, 
        newStake2.finishTime, 
        newStake2.shares, 
        newStake2.payDayEligible
      );

      console.log(
        'estimate 1',
        newEstimate_1[0].toString(),
        newEstimate_1[1].toString()
      );
      console.log(
        'estimate 2',
        newEstimate_2[0].toString(),
        newEstimate_2[1].toString()
      );

      const closestShares = await subbalances.getClosestYearShares();
      expect(closestShares).to.be.a.bignumber.that.not.zero;

      const userBalanceBefore_1 = await token.balanceOf(account1);
      const userBalanceBefore_2 = await token.balanceOf(account2);

      expect(userBalanceBefore_1).to.be.a.bignumber.zero;
      expect(userBalanceBefore_2).to.be.a.bignumber.zero;

      await subbalances.callOutcomeStakerTrigger(
        account1,
        stakeId,
        stakeStartTime,
        stakeEndTime,
        stakeShares,
        { from: stakingCaller }
      );

      await subbalances.callOutcomeStakerTrigger(
        account2,
        stakeId_2,
        stakeStartTime_2,
        stakeEndTime_2,
        stakingShares_2,
        { from: stakingCaller }
      );

      const eligibleAfter_1 = (await subbalances.stakeSessions(stakeId))
        .payDayEligible;
      const eligibleAfter_2 = (await subbalances.stakeSessions(stakeId_2))
        .payDayEligible;
      console.log(eligibleAfter_1);
      console.log(eligibleAfter_2);

      await subbalances.withdrawPayout(stakeId, { from: account1 });
      await subbalances.withdrawPayout(stakeId_2, { from: account2 });

      const userBalanceAfter_1 = await token.balanceOf(account1);
      console.log(userBalanceAfter_1.toString());
      expect(userBalanceAfter_1).to.be.a.bignumber.that.above(
        userBalanceBefore_1
      );

      const userBalanceAfter_2 = await token.balanceOf(account2);
      console.log(userBalanceAfter_2.toString());
      expect(userBalanceAfter_2).to.be.a.bignumber.that.above(
        userBalanceBefore_2
      );
    });

    // it("should withdraw payout for staker", async () => {

    //     const bpdAmountPercent = dividedAmountPart.div(new BN("100"));

    //     const currentPoolAmounts = await bpd.getPoolYearAmounts();
    //     const yearOnePool = currentPoolAmounts[0];

    //     // expect(
    //     //     yearOnePool
    //     // ).to.be.a.bignumber.that.equals(bpdAmountPercent.mul(new BN("10")));

    //     expect(
    //         await token.balanceOf(subbalances.address)
    //     ).to.be.a.bignumber.zero;

    //     // Switch time once again to 350
    //     await helper.advanceTimeAndBlock((DAY * (STAKE_PERIOD + 1)) + 5);

    //     const times = await subbalances.getStartTimes()

    //     expect(new BN(await getBlockchainTimestamp()))
    //     .to.be.a.bignumber.that.above(times[0]);

    //     const eligibleBefore = await subbalances.getSessionEligibility(stakeId);

    //     await subbalances.callOutcomeStakerTrigger(
    //       account1,
    //       stakeId,
    //       stakeStartTime,
    //       stakeEndTime,
    //       signAmount,
    //       { from: stakingCaller }
    //     )

    //     const eligibleAfter = await subbalances.getSessionEligibility(stakeId);

    //     expect(eligibleAfter[0]).to.be.equals(eligibleBefore[0]);

    //     await subbalances.generatePool();

    //     expect(
    //         (await subbalances.getPoolsMinted())[0]
    //     ).to.be.a.true;

    //     expect(
    //         await token.balanceOf(subbalances.address)
    //     ).to.be.a.bignumber.that.above(yearOnePool);

    //     // expect(
    //     //     await token.balanceOf(bpd.address)
    //     // ).to.be.a.bignumber.that.equals(dividedAmountPart.sub(yearOnePool));

    //     expect(
    //         (await subbalances.getPoolsMintedAmounts())[0]
    //     ).to.be.a.bignumber.that.above(yearOnePool);

    //     const payoutAmountsBefore = await subbalances.calculateSessionPayout(stakeId);
    //     const payoutBefore = payoutAmountsBefore[0];
    //     const penaltyBefore = payoutAmountsBefore[1];
    //     console.log("session payout before", payoutBefore.toString(), "", penaltyBefore.toString());

    //     const userBalanceBefore = await token.balanceOf(account1);
    //     // console.log(userBalanceBefore.toString());

    //     // const stakeSessions = await subbalances.getSessionEligibility(stakeId);
    //     // console.log(stakeSessions);

    //     const stakeStats = await subbalances.getSessionStats(stakeId);
    //     // console.log(stakeStats[2].toString(), "", stakeStats[3].toString());
    //     const stakeLength = stakeStats[3] - stakeStats[2];
    //     // console.log(stakeLength.toString());
    //     console.log((stakeLength / DAY).toString());

    //     await subbalances.withdrawPayout(stakeId, {from: account1});

    //     const userBalanceAfter = await token.balanceOf(account1);
    //     // console.log(userBalanceAfter.toString());

    //     expect(userBalanceAfter).to.be.a.bignumber.that.above(userBalanceBefore);
    //     console.log(userBalanceBefore.toString(), "", userBalanceAfter.toString())

    //     const payoutAmounts = await subbalances.calculateSessionPayout(stakeId);
    //     const payout = payoutAmountsBefore[0];
    //     const penalty = payoutAmountsBefore[1];
    //     console.log("session payout after", payout.toString(), "", penalty.toString());

    //     const payoutAmountsTest = await subbalances.calculateSessionPayoutTest(stakeId);
    //     const payoutTest = payoutAmountsBefore[0];
    //     const penaltyTest = payoutAmountsBefore[1];
    //     console.log("session payout after test", payoutTest.toString(), "", penaltyTest.toString());

    //     // expect(payout).to.be.not.a.bignumber.zero;

    // });
  }
);
