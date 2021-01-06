import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ContractFactory } from '../../libs/ContractFactory';
import { TestUtil } from '../utils/TestUtil';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
    Token,
    Staking,
    SubBalancesMock
} from '../../typechain';
import { BigNumber } from 'ethers';
import { SECONDS_IN_DAY, STAKE_PERIOD } from '../utils/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

describe('Staking', async () => {
  let token: Token;
  let staking: Staking;
  let subBalancesMock: SubBalancesMock;
  let staker1: SignerWithAddress;

  beforeEach(async () => {
    const [setter, recipient, staker] = await ethers.getSigners();

    subBalancesMock = await (await ContractFactory.getSubBalancesMockFactory()).deploy();

    const contracts = await initTestSmartContracts({
      setter,
      recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address
    });

    staker1 = staker;
    token = contracts.token;
    staking = contracts.staking;
  });

  it('should stake one day', async () => {
    const amount = ethers.utils.parseEther('10');

    await token
        .connect(staker1)
        .approve(staking.address, amount);

    await staking
        .connect(staker1)
        .stake(amount, 1);

    const sessionId = await staking.sessionsOf(staker1.address, 0);
    const sessionData = await staking.sessionDataOf(staker1.address, sessionId);

    const shareRate = await staking.shareRate();
    expect(shareRate).to.equal(ethers.utils.parseEther('1'));
    expect(sessionData.amount).to.equal(amount);
    expect(sessionData.shares).to.equal(ethers.utils.parseEther('10'));
  });

  it('should stake hundred days', async () => {
    await token
      .connect(staker1)
      .approve(staking.address, ethers.utils.parseEther('10'));

    const stakeAmount = 10;
    const stakingDays = 100;

    await staking
      .connect(staker1)
      .stake(ethers.utils.parseEther(stakeAmount.toString()), stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);
    const sessionData = await staking.sessionDataOf(staker1.address, sessionId);

    expect(sessionData.amount).to.equal(
      ethers.utils.parseEther(stakeAmount.toString())
    );
    
    let expectedShares = TestUtil.calcShares(stakeAmount, stakingDays, 1.0);

    const actualShares = parseFloat(
      ethers.utils.formatEther(sessionData.shares));

    expect(actualShares).to.be.closeTo(expectedShares, 0.001);
  });

  it('should stake 1820 days', async () => {
    await token
      .connect(staker1)
      .approve(staking.address, ethers.utils.parseEther('10'));

    const stakeAmount = 10;
    const stakingDays = 1820;

    await staking.connect(staker1).stake(ethers.utils.parseEther(stakeAmount.toString()), stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);
    const sessionData = await staking.sessionDataOf(staker1.address, sessionId);

    expect(sessionData.amount).to.equal(
      ethers.utils.parseEther(stakeAmount.toString())
    );

    let expectedShares = TestUtil.calcShares(stakeAmount, stakingDays, 1.0);

    const actualShares = parseFloat(
      ethers.utils.formatEther(sessionData.shares));

    expect(actualShares).to.be.closeTo(expectedShares, 0.001);
  });

  it('should make payout', async () => {
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)  
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, 100);

    // Change node time and swap
    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    const sessionId = await staking.sessionsOf(staker1.address, 0);
    const sessionData = await staking.sessionDataOf(staker1.address, sessionId);

    expect(sessionData.amount).to.equal(amount);
  });

  it("shouldn't allow a stake over 5555 days", async () => {
    const amount = ethers.utils.parseEther('10');
    const staker1Staking = staking.connect(staker1);
    
    await expect(
      staker1Staking
        .stake(amount, 5556))
          .to.be.revertedWith('stakingDays > 5555');

    // Edge case
    await staker1Staking
      .stake(amount, 5555);
    
    await expect(
      staker1Staking
        .stake(amount, 100000))
          .to.be.revertedWith('stakingDays > 5555');
  });

  it('should unstake and not allow second unstake', async () => {
    const length = 100;
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, length);

    // Forward to the end of the staking period
    await TestUtil.increaseTime(SECONDS_IN_DAY * length);

    await staking.makePayout();
    
    const sessionId = await staking.sessionsOf(staker1.address, 0);

    const preUnstakeSessionData = await staking.sessionDataOf(
      staker1.address,
      sessionId
    );

    expect(preUnstakeSessionData.withdrawn).equals(false);
    expect(preUnstakeSessionData.payout).to.equal(0);

    await TestUtil.timeout(1000);

    await staking
      .connect(staker1)
      .unstake(sessionId);

    const afterUnstakeSessionData = await staking.sessionDataOf(
      staker1.address,
      sessionId
    );

    expect(afterUnstakeSessionData.amount).to.equal(amount);
    expect(afterUnstakeSessionData.withdrawn).equals(true);
    expect(afterUnstakeSessionData.payout).to.not.equal(0);
    expect(afterUnstakeSessionData.end.toNumber()).to.be.lessThan(Date.now());
    expect(afterUnstakeSessionData.end).to.not.equal(preUnstakeSessionData.end);

    await expect(
      staking.connect(staker1).unstake(sessionId))
        .to.be.revertedWith('Staking: Stake withdrawn');
  });

  it('should stop accruing interest after stake end date', async () => {
    const stakingDays = 10;
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);

    const session = await staking.sessionDataOf(
      staker1.address,
      sessionId
    );

    let previousInterest = BigNumber.from("0");

    for (let i = 0; i < stakingDays; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);

      await staking.makePayout();

      const interest = await staking.calculateStakingInterest(
        session.firstPayout, session.lastPayout, session.shares);

      expect(interest).to.not.equal(previousInterest);

      previousInterest = interest;
    }

    // DAY 11
    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    const interest = await staking.calculateStakingInterest(
      session.firstPayout, session.lastPayout, session.shares);

    expect(interest).to.equal(previousInterest);
  });

  it('should calculate amount out and penalty correctly', async () => {
    const stakingDays = 2;
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);

    const sessionData = await staking.sessionDataOf(staker1.address, sessionId);

    let previousPayout = BigNumber.from("1");
    let previousPenalty = BigNumber.from("1");

    await TestUtil.increaseTime(SECONDS_IN_DAY);

    await staking.makePayout();

    for (let i = 1; i <= 4; i++){
      await TestUtil.increaseTime(SECONDS_IN_DAY * (0.2));
  
      const stakingInterest = await staking.calculateStakingInterest(
        sessionData.firstPayout, sessionData.lastPayout, sessionData.shares);

      const result = await staking.getAmountOutAndPenalty(
        sessionData.amount, sessionData.start, sessionData.end, stakingInterest);
    
      expect(result[0]).to.not.equal(previousPayout);
      expect(result[1]).to.not.equal(previousPenalty);

      previousPayout = result[0];
      previousPenalty = result[1];
    }
  });

  it('should not call SubBalances on stake and unstake if stake length is less than base period', async () => {
    const stakingDays = STAKE_PERIOD - 1;
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, stakingDays);

    expect(await subBalancesMock.callIncomeStakerTriggerCalledCount()).to.equal(0);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);

    await staking
      .connect(staker1)
      .unstake(sessionId);

    expect(await subBalancesMock.callOutcomeStakerTriggerCalledCount()).to.equal(0);  
  });

  it('should call SubBalances on stake and unstake if stake length is more than or equal to base period', async () => {
    const stakingDays = STAKE_PERIOD;
    const amount = ethers.utils.parseEther('10');

    await token
      .connect(staker1)
      .approve(staking.address, amount);

    await staking
      .connect(staker1)
      .stake(amount, stakingDays);

    expect(await subBalancesMock.callIncomeStakerTriggerCalledCount()).to.equal(1);

    await TestUtil.increaseTime(SECONDS_IN_DAY * stakingDays);

    const sessionId = await staking.sessionsOf(staker1.address, 0);

    await staking
      .connect(staker1)
      .unstake(sessionId);

    expect(await subBalancesMock.callOutcomeStakerTriggerCalledCount()).to.equal(1); 
  });
});