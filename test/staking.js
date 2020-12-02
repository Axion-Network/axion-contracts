const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
chai.use(require('chai-bn')(BN));

const TERC20 = artifacts.require('TERC20');
const Staking = artifacts.require('Staking');
const SubBalancesMock = artifacts.require('SubBalancesMock');
const AuctionMock = artifacts.require('AuctionMock');

const DAY = 86400;

contract('Staking', ([bank, foreignSwap, subBalances, staker1, staker2]) => {
  let token;
  let staking;
  let subbalances;
  let auction;

  beforeEach(async () => {
    token = await TERC20.new(
      '2X Token',
      '2X',
      web3.utils.toWei('10000'),
      bank,
      {
        from: bank,
      }
    );

    subbalances = await SubBalancesMock.new();
    auction = await AuctionMock.new();

    await token.transfer(staker1, web3.utils.toWei('100'), { from: bank });
    await token.transfer(staker2, web3.utils.toWei('100'), { from: bank });

    staking = await Staking.new();
    await staking.init(
      token.address,
      auction.address,
      subbalances.address,
      foreignSwap,
      DAY
    );
  });

  it('should stake', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker1,
    });

    await staking.stake(web3.utils.toWei('10'), 1, {
      from: staker1,
    });

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
  });

  it('should make payout', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker1,
    });

    await staking.stake(web3.utils.toWei('10'), 100, {
      from: staker1,
    });

    await token.transfer(staking.address, web3.utils.toWei('100'), {
      from: bank,
    });

    // Change node time and swap
    await helper.advanceTimeAndBlock(DAY * 1);

    await staking.makePayout();

    const { payout, sharesTotalSupply } = await staking.payouts(0);

    console.log({
      payout: payout.toString(),
      sharesTotalSupply: sharesTotalSupply.toString(),
    });

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
  });

  it("shouldn't allow a stake over 5555 days", async () => {
    expectRevert(await staking.stake(web3.utils.toWei("10"), 5556, {
      from: staker1,
    }));
    // Edge case
    await staking.stake(web3.utils.toWei("10"), 5555, {
        from: staker1,
    })
    expectRevert(await staking.stake(web3.utils.toWei("10"), 100000, {
      from: staker1,
    }));
  })

  it("should unstake", async () => {
    await token.approve(staking.address, web3.utils.toWei("10"), {
      from: staker1,
    });

    await staking.stake(web3.utils.toWei('10'), 100, {
      from: staker1,
    });

    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker2,
    });

    await staking.stake(web3.utils.toWei('10'), 100, {
      from: staker2,
    });

    await token.transfer(staker1, web3.utils.toWei('100'), { from: bank });

    // Forward to the end of the staking period
    await helper.advanceTimeAndBlock(DAY * 100);

    await staking.makePayout();

    const sessionId = await staking.sessionsOf(staker1, 0);
    await staking.unstake(sessionId, {
      from: staker1,
    });

    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
  });
});
