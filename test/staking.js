const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const expectRevert = require('./utils/expectRevert.js');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');
const helper = require('./utils/utils.js');
chai.use(require('chai-bn')(BN));

const TERC20 = artifacts.require('TERC20');
const DAY = 86400;

contract('Staking', ([bank, setter, recipient, staker1, staker2]) => {
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

    /** Since we need to mint token, we'll use a seperate token address */
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
      bank,
      tokenAddress: token.address,
    });
    staking = contracts.staking;
    subbalances = contracts.subbalances;
    auction = contracts.auction;

    await token.transfer(staker1, web3.utils.toWei('100'), { from: bank });
    await token.transfer(staker2, web3.utils.toWei('100'), { from: bank });
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

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
  });

  it("shouldn't allow a stake over 5555 days", async () => {
    await expectRevert(
      staking.stake(web3.utils.toWei('10'), 5556, {
        from: staker1,
      }),
      'stakingDays > 5555'
    );

    // Edge case
    await staking.stake(web3.utils.toWei('10'), 5555, {
      from: staker1,
    });
    await expectRevert(
      staking.stake(web3.utils.toWei('10'), 100000, {
        from: staker1,
      }),
      'stakingDays > 5555'
    );
  });

  it('should unstake', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
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

    const preUnstakeSessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(preUnstakeSessionData.withdrawn).equals(false);
    expect(preUnstakeSessionData.interest).to.be.a.bignumber.that.is.zero;
    expect(preUnstakeSessionData.penalty).to.be.a.bignumber.that.is.zero;

    await staking.unstake(sessionId, {
      from: staker1,
    });

    const afterUnstakeSessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(afterUnstakeSessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );

    expect(afterUnstakeSessionData.withdrawn).equals(true);
    expect(afterUnstakeSessionData.interest).to.not.be.a.bignumber.that.is.zero;
    expect(afterUnstakeSessionData.penalty).to.be.a.bignumber.that.is.zero;
  });
});
