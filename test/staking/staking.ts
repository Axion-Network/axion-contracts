import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ContractFactory } from '../../libs/ContractFactory';
import { TestUtil } from '../utils/TestUtil';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Token, Staking, StakingV1, SubBalancesMock } from '../../typechain';
import { BigNumber } from 'ethers';
import { SECONDS_IN_DAY, STAKE_PERIOD } from '../utils/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const lastSessionIdV1 = 1;

describe('Staking', async () => {
  let _staker: SignerWithAddress;
  let token: Token;
  let staking: Staking;
  let stakingV1: StakingV1;
  let subBalancesMock: SubBalancesMock;
  let _setter: SignerWithAddress;

  beforeEach(async () => {
    const [setter, recipient, staker] = await ethers.getSigners();

    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();

    const contracts = await initTestSmartContracts({
      setter,
      recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: lastSessionIdV1,
    });

    _staker = staker;
    _setter = setter;
    token = contracts.token;
    staking = contracts.staking;
    stakingV1 = contracts.stakingV1;
  });

  it('should stake one day', async () => {
    const stakingDays = 1;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);
    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);

    const shareRate = await staking.shareRate();
    const daysStaked = sessionData.end
      .sub(sessionData.start)
      .div(SECONDS_IN_DAY);

    expect(shareRate).to.equal(ethers.utils.parseEther('1'));
    expect(daysStaked).to.equal(stakingDays);
    expect(sessionData.amount).to.equal(amount);
    expect(sessionData.shares).to.equal(ethers.utils.parseEther('10'));
  });

  it('should stake hundred days', async () => {
    await token
      .connect(_staker)
      .approve(staking.address, ethers.utils.parseEther('10'));

    const stakeAmount = 10;
    const stakingDays = 100;

    await staking
      .connect(_staker)
      .stake(ethers.utils.parseEther(stakeAmount.toString()), stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);
    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);

    expect(sessionData.amount).to.equal(
      ethers.utils.parseEther(stakeAmount.toString())
    );

    let expectedShares = TestUtil.calcShares(stakeAmount, stakingDays, 1.0);

    const actualShares = parseFloat(
      ethers.utils.formatEther(sessionData.shares)
    );

    expect(actualShares).to.be.closeTo(expectedShares, 0.001);

    const daysStaked = sessionData.end
      .sub(sessionData.start)
      .div(SECONDS_IN_DAY);
    expect(daysStaked).to.equal(stakingDays);
  });

  it('should stake 1820 days', async () => {
    await token
      .connect(_staker)
      .approve(staking.address, ethers.utils.parseEther('10'));

    const stakeAmount = 10;
    const stakingDays = 1820;

    await staking
      .connect(_staker)
      .stake(ethers.utils.parseEther(stakeAmount.toString()), stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);
    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);

    expect(sessionData.amount).to.equal(
      ethers.utils.parseEther(stakeAmount.toString())
    );

    let expectedShares = TestUtil.calcShares(stakeAmount, stakingDays, 1.0);

    const actualShares = parseFloat(
      ethers.utils.formatEther(sessionData.shares)
    );

    expect(actualShares).to.be.closeTo(expectedShares, 0.001);

    const daysStaked = sessionData.end
      .sub(sessionData.start)
      .div(SECONDS_IN_DAY);
    expect(daysStaked).to.equal(stakingDays);
  });

  it('should make payout', async () => {
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, 100);

    // Change node time and swap
    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    const sessionId = await staking.sessionsOf(_staker.address, 0);
    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);

    expect(sessionData.amount).to.equal(amount);
  });

  it("shouldn't allow a stake over 5555 days", async () => {
    const amount = ethers.utils.parseEther('10');
    const _stakerStaking = staking.connect(_staker);

    await expect(_stakerStaking.stake(amount, 5556)).to.be.revertedWith(
      'Staking: Staking days > 5555'
    );

    // Edge case
    await _stakerStaking.stake(amount, 5555);

    await expect(_stakerStaking.stake(amount, 100000)).to.be.revertedWith(
      'Staking: Staking days > 5555'
    );
  });

  it('should unstake and not allow second unstake', async () => {
    const length = 100;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, length);

    // Forward to the end of the staking period
    await TestUtil.increaseTime(SECONDS_IN_DAY * length);

    await staking.makePayout();

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    const preUnstakeSessionData = await staking.sessionDataOf(
      _staker.address,
      sessionId
    );

    expect(preUnstakeSessionData.withdrawn).equals(false);
    expect(preUnstakeSessionData.payout).to.equal(0);

    await TestUtil.timeout(1000);

    await staking.connect(_staker).unstake(sessionId);

    const afterUnstakeSessionData = await staking.sessionDataOf(
      _staker.address,
      sessionId
    );

    expect(afterUnstakeSessionData.amount).to.equal(amount);
    expect(afterUnstakeSessionData.withdrawn).equals(true);
    expect(afterUnstakeSessionData.payout).to.not.equal(0);
    expect(afterUnstakeSessionData.end.toNumber()).to.be.lessThan(Date.now());
    expect(afterUnstakeSessionData.end).to.not.equal(preUnstakeSessionData.end);

    await expect(
      staking.connect(_staker).unstake(sessionId)
    ).to.be.revertedWith('Staking: Stake withdrawn');
  });

  it('should unstake V1 and not allow second unstake', async () => {
    const length = 10;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await stakingV1.connect(_staker).stake(amount, length);

    // Forward to the end of the staking period
    await TestUtil.increaseTime(SECONDS_IN_DAY * length);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);

    const preUnstakeSessionData = await stakingV1.sessionDataOf(
      _staker.address,
      sessionId
    );

    await staking.setSharesTotalSupply(preUnstakeSessionData.shares);
    await staking.setTotalStakedAmount(preUnstakeSessionData.amount);

    await TestUtil.timeout(1000);

    await staking.connect(_staker).unstakeV1(sessionId);

    const afterUnstakeSessionData = await staking.sessionDataOf(
      _staker.address,
      sessionId
    );

    expect(preUnstakeSessionData.shares).to.not.equal(0);
    expect(afterUnstakeSessionData.amount).to.equal(amount);
    expect(afterUnstakeSessionData.withdrawn).equals(true);
    expect(afterUnstakeSessionData.payout).to.not.equal(0);
    expect(afterUnstakeSessionData.end.toNumber()).to.be.lessThan(Date.now());
    expect(afterUnstakeSessionData.end).to.not.equal(preUnstakeSessionData.end);

    await expect(
      staking.connect(_staker).unstakeV1(sessionId)
    ).to.be.revertedWith('Staking: Stake withdrawn');
  });

  it('should stop accruing interest after stake end date', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    const session = await staking.sessionDataOf(_staker.address, sessionId);

    let previousInterest = BigNumber.from('0');

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();

      const interest = await staking.calculateStakingInterest(
        session.firstPayout,
        session.lastPayout,
        session.shares
      );

      expect(interest).to.not.equal(previousInterest);

      previousInterest = interest;
    }

    // DAY 11
    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    const interest = await staking.calculateStakingInterest(
      session.firstPayout,
      session.lastPayout,
      session.shares
    );

    expect(interest).to.equal(previousInterest);
  });

  it('should calculate amount out and penalty correctly', async () => {
    const stakingDays = 2;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);

    let previousPayout = BigNumber.from('1');
    let previousPenalty = BigNumber.from('1');

    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    for (let i = 1; i <= 4; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY * 0.2);

      const stakingInterest = await staking.calculateStakingInterest(
        sessionData.firstPayout,
        sessionData.lastPayout,
        sessionData.shares
      );

      const result = await staking.getAmountOutAndPenalty(
        sessionData.amount,
        sessionData.start,
        sessionData.end,
        stakingInterest
      );

      expect(result[0]).to.not.equal(previousPayout);
      expect(result[1]).to.not.equal(previousPenalty);

      previousPayout = result[0];
      previousPenalty = result[1];
    }
  });

  it('should not call SubBalances on stake and unstake if stake length is less than base period', async () => {
    const stakingDays = STAKE_PERIOD - 1;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    expect(await subBalancesMock.callIncomeStakerTriggerCalledCount()).to.equal(
      0
    );

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    await staking.connect(_staker).unstake(sessionId);

    expect(
      await subBalancesMock.callOutcomeStakerTriggerCalledCount()
    ).to.equal(0);
  });

  it('should call SubBalances on stake and unstake if stake length is more than or equal to base period', async () => {
    const stakingDays = STAKE_PERIOD;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    expect(await subBalancesMock.callIncomeStakerTriggerCalledCount()).to.equal(
      1
    );

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    await staking.connect(_staker).unstake(sessionId);

    expect(
      await subBalancesMock.callOutcomeStakerTriggerCalledCount()
    ).to.equal(1);
  });

  it('should not call SubBalances on unstakeV1 if stake length is less than base period', async () => {
    const stakingDays = STAKE_PERIOD - 1;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);

    const preUnstakeSessionData = await stakingV1.sessionDataOf(
      _staker.address,
      sessionId
    );

    await staking.setSharesTotalSupply(preUnstakeSessionData.shares);
    await staking.setTotalStakedAmount(preUnstakeSessionData.amount);

    await staking.connect(_staker).unstakeV1(sessionId);

    expect(
      await subBalancesMock.callOutcomeStakerTriggerV1CalledCount()
    ).to.equal(0);
  });

  it('should call SubBalances on unstakeV1 if stake length is more than or equal to base period', async () => {
    const stakingDays = STAKE_PERIOD;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);

    const preUnstakeSessionData = await stakingV1.sessionDataOf(
      _staker.address,
      sessionId
    );

    await staking.setSharesTotalSupply(preUnstakeSessionData.shares);
    await staking.setTotalStakedAmount(preUnstakeSessionData.amount);

    await staking.connect(_staker).unstakeV1(sessionId);

    expect(
      await subBalancesMock.callOutcomeStakerTriggerV1CalledCount()
    ).to.equal(1);
  });

  it('should fail on unstake if shares is 0 or withdrawn', async () => {
    await expect(staking.connect(_staker).unstake(0)).to.be.revertedWith(
      'Staking: Stake withdrawn or not set'
    );
  });

  it('should fail on unstakeV1 if sessionId is higher than allowed', async () => {
    await expect(
      staking.connect(_staker).unstakeV1(lastSessionIdV1 + 1)
    ).to.be.revertedWith('Staking: Invalid sessionId');
  });

  it('should fail on unstakeV1 if shares is 0', async () => {
    await expect(
      staking.connect(_staker).unstakeV1(lastSessionIdV1)
    ).to.be.revertedWith('Staking: Stake withdrawn or not set');
  });

  it('should restake', async () => {
    const stakingDays = 10;
    const restakeDays = 15;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await staking.connect(_staker).stake(amount, stakingDays);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const preRestakeSessionId = await staking.sessionsOf(_staker.address, 0);

    await staking.connect(_staker).restake(preRestakeSessionId, restakeDays);

    const postRestakeSessionId = await staking.sessionsOf(_staker.address, 1);
    const preRestakeSessionData = await staking.sessionDataOf(
      _staker.address,
      preRestakeSessionId
    );
    const postRestakeSessionData = await staking.sessionDataOf(
      _staker.address,
      postRestakeSessionId
    );
    const daysStaked = postRestakeSessionData.end
      .sub(postRestakeSessionData.start)
      .div(SECONDS_IN_DAY);

    expect(daysStaked).to.equal(restakeDays);
    expect(preRestakeSessionData.payout).to.equal(
      postRestakeSessionData.amount
    );
  });

  it('should restakeV1', async () => {
    const stakingDays = 10;
    const restakeDays = 15;
    const amount = ethers.utils.parseEther('10');

    await token.connect(_staker).approve(staking.address, amount);

    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const preRestakeSessionV1Id = await stakingV1.sessionsOf(
      _staker.address,
      0
    );
    const preRestakeSessionV1Data = await stakingV1.sessionDataOf(
      _staker.address,
      preRestakeSessionV1Id
    );

    await staking.setLastSessionId(preRestakeSessionV1Id);
    await staking.setSharesTotalSupply(preRestakeSessionV1Data.shares);
    await staking.setTotalStakedAmount(preRestakeSessionV1Data.amount);

    await staking
      .connect(_staker)
      .restakeV1(preRestakeSessionV1Id, restakeDays);

    const preRestakeSessionId = await staking.sessionsOf(_staker.address, 0);
    const preRestakeSessionData = await staking.sessionDataOf(
      _staker.address,
      preRestakeSessionId
    );

    const postRestakeSessionId = await staking.sessionsOf(_staker.address, 1);
    const postRestakeSessionData = await staking.sessionDataOf(
      _staker.address,
      postRestakeSessionId
    );
    const daysStaked = postRestakeSessionData.end
      .sub(postRestakeSessionData.start)
      .div(SECONDS_IN_DAY);

    expect(daysStaked).to.equal(restakeDays);
    expect(preRestakeSessionData.payout).to.equal(
      postRestakeSessionData.amount
    );
  });

  it('should not upgrade stakes to max share if event is off', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');
    const eventActive = await staking.connect(_setter).getMaxShareEventActive();
    expect(eventActive).to.equal(false);

    await token.connect(_staker).approve(staking.address, amount);
    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await staking.setSharesTotalSupply(`10000000000000000000`);
    await staking.setTotalStakedAmount(`10000000000000000000`);

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);

    await expect(
      staking.connect(_staker).maxShareV1(sessionId)
    ).to.be.revertedWith('Max Share event is not active');
  });

  it('should upgrade v2 stakes to max share', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');
    await staking.connect(_setter).setMaxShareEventActive(true);

    await token.connect(_staker).approve(staking.address, amount);
    await staking.connect(_staker).stake(amount, stakingDays);

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);
    const sessionDataBefore = await staking.sessionDataOf(
      _staker.address,
      sessionId
    );

    await staking.connect(_staker).maxShare(sessionId);

    const sessionDataAfter = await staking.sessionDataOf(
      _staker.address,
      sessionId
    );

    expect(sessionDataAfter.firstPayout.toString()).to.equal('10');
    expect(sessionDataAfter.lastPayout.toString()).to.equal('5565');
  });

  it('should not upgrade v2 stakes that have been withdrawn', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');
    await staking.connect(_setter).setMaxShareEventActive(true);

    await token.connect(_staker).approve(staking.address, amount);
    await staking.connect(_staker).stake(amount, stakingDays);

    await staking.setSharesTotalSupply(`20000000000000000000`);
    await staking.setTotalStakedAmount(`20000000000000000000`);

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(_staker.address, 0);

    await staking.connect(_staker).unstake(sessionId);
    await expect(
      staking.connect(_staker).maxShareV1(sessionId)
    ).to.be.revertedWith('Stake withdrawn');
  });

  it('should upgrade v1 stakes to max share', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');
    await staking.connect(_setter).setMaxShareEventActive(true);

    await token.connect(_staker).approve(staking.address, amount);
    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await staking.setSharesTotalSupply(`10000000000000000000`);
    await staking.setTotalStakedAmount(`10000000000000000000`);

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);
    const sessionDataV1 = await stakingV1.sessionDataOf(
      _staker.address,
      sessionId
    );

    await staking.connect(_staker).maxShareV1(sessionId);

    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);
    expect(sessionData.firstPayout.toString()).to.equal('10');
    expect(sessionData.lastPayout.toString()).to.equal('5565');
  });

  it.only('should upgrade v1 5555 stakes to max share', async () => {
    const stakingDays = 5555;
    const amount = ethers.utils.parseEther('10');
    await staking.connect(_setter).setMaxShareEventActive(true);

    await token.connect(_staker).approve(staking.address, amount);
    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await staking.setSharesTotalSupply(`10000000000000000000`);
    await staking.setTotalStakedAmount(`10000000000000000000`);

    for (let i = 0; i < 10; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);
    const sessionDataV1 = await stakingV1.sessionDataOf(
      _staker.address,
      sessionId
    );
    console.log(sessionDataV1);

    await staking.connect(_staker).maxShareV1(sessionId);

    const sessionData = await staking.sessionDataOf(_staker.address, sessionId);
    console.log(sessionData);
    expect(sessionData.firstPayout.toString()).to.equal('10');
    expect(sessionData.lastPayout.toString()).to.equal('5565');
  });

  it('should not upgrade v1 stakes that have been withdrawn', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');
    await staking.connect(_setter).setMaxShareEventActive(true);

    await token.connect(_staker).approve(staking.address, amount);
    await stakingV1.connect(_staker).stake(amount, stakingDays);

    await staking.setSharesTotalSupply(`20000000000000000000`);
    await staking.setTotalStakedAmount(`20000000000000000000`);

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();
    }

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await stakingV1.sessionsOf(_staker.address, 0);

    await staking.connect(_staker).unstakeV1(sessionId);
    await expect(
      staking.connect(_staker).maxShareV1(sessionId)
    ).to.be.revertedWith('Stake withdrawn');
  });
});
