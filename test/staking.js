const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const expectRevert = require('./utils/expectRevert.js');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');
const helper = require('./utils/utils.js');
const mathHelper = require('./utils/axion_helper_funcs');
const TERC20 = artifacts.require('TERC20');

const DAY = 86400;

function get_as_string(value) {
  return web3.utils.toWei(value.toString());
}

function get_list(arr) {
  out = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(get_as_string(arr[i]));
  }
  return out;
}
function get_slice(arr, start, length) {
  out = [];
  for (let i = start; i < start + length; i++) {
    out.push(get_as_string(arr[i]));
  }
  return out;
}
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

  it('should stake one day', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker1,
    });

    await staking.stake(web3.utils.toWei('10'), 1, {
      from: staker1,
    });

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    const shareRate_got = await staking.shareRate();
    expect(shareRate_got).to.be.a.bignumber.that.equals(web3.utils.toWei('1'));
    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
    expect(sessionData.shares).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );
  });
  it('should stake hundred days', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker1,
    });
    const stakeAmount = 10;
    const stakingDays = 100;
    await staking.stake(web3.utils.toWei(stakeAmount.toString()), stakingDays, {
      from: staker1,
    });

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei(stakeAmount.toString())
    );
    let shares_exp = mathHelper.calc_shares(stakeAmount, stakingDays, 1.0);

    const shares_got = parseFloat(
      web3.utils.fromWei(sessionData.shares.toString())
    );
    expect(shares_got).to.be.closeTo(shares_exp, 0.001);
  });
  it('should stake 1820 days', async () => {
    await token.approve(staking.address, web3.utils.toWei('10'), {
      from: staker1,
    });
    const stakeAmount = 10;
    const stakingDays = 1820;
    await staking.stake(web3.utils.toWei(stakeAmount.toString()), stakingDays, {
      from: staker1,
    });

    const sessionId = await staking.sessionsOf(staker1, 0);
    const sessionData = await staking.sessionDataOf(staker1, sessionId);

    expect(sessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei(stakeAmount.toString())
    );
    let shares_exp = mathHelper.calc_shares(stakeAmount, stakingDays, 1.0);

    const shares_got = parseFloat(
      web3.utils.fromWei(sessionData.shares.toString())
    );
    expect(shares_got).to.be.closeTo(shares_exp, 0.001);
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

  it('should unstake and not allow second unstake', async () => {
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

    const preUnstakeSessionData = await staking.sessionDataOf(
      staker1,
      sessionId
    );

    expect(preUnstakeSessionData.withdrawn).equals(false);
    expect(preUnstakeSessionData.payout).to.be.a.bignumber.that.is.zero;

    await helper.timeout(1000);

    await staking.unstake(sessionId, {
      from: staker1,
    });

    const afterUnstakeSessionData = await staking.sessionDataOf(
      staker1,
      sessionId
    );

    expect(afterUnstakeSessionData.amount).to.be.a.bignumber.that.equals(
      web3.utils.toWei('10')
    );

    expect(afterUnstakeSessionData.withdrawn).equals(true);
    expect(afterUnstakeSessionData.payout).to.not.be.a.bignumber.that.is.zero;
    expect(afterUnstakeSessionData.end).to.be.a.bignumber.that.is.lessThan(Date.now().toString());
    expect(afterUnstakeSessionData.end).to.not.be.a.bignumber.that.is.equals(preUnstakeSessionData.end);

    await expectRevert(
      staking.unstake(sessionId, {
        from: staker1,
      }),
      'Staking: Stake withdrawn'
    );
  });
});
