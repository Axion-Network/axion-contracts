import { ContractFactory } from '../../libs/ContractFactory';
import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SubBalancesMock } from '../../typechain';
import { SECONDS_IN_DAY } from '../utils/constants';
import { TestUtil } from '../utils/TestUtil';

describe('Fix Share Rates & Stakes', () => {
  it('should set share rate', async () => {
    const [setter, recipient] = await ethers.getSigners();
    const { staking } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await staking.setShareRate('109000000000000000'); // set share rate
    expect(await staking.shareRate()).to.eq('109000000000000000'); // expect share rate to be 1.09
  });

  it('should correctly update users share rate', async () => {
    const [setter, recipient, account1] = await ethers.getSigners();
    const { staking, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    /** Add a 1.27 stakes */
    await staking.setShareRate('127000000000000000'); // set share rate to 1.27
    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role

    await token.connect(setter).mint(account1.address, '100'); // mint 100 for account 1

    await staking.connect(account1).stake('100', 365); // set a 1.27 stake
    const data = await staking.sessionDataOf(account1.address, 1); // get session data from stake
    const sharerate = TestUtil.getShareRate(data); // get share rate

    const shares = data.shares.toNumber(); // get shares from data
    expect(sharerate.toFixed(2)).to.be.eq('1.27'); // expect sharerate to be 1.27
    expect(await staking.sharesTotalSupply().then(Number)).to.be.eq(shares); // expect staking shares total supply === account 1

    // Update share rate to 1.09 and then update the stake
    await staking.setShareRate('109000000000000000'); // set share rate to 1.09
    await staking.connect(setter).fixShareRateOnStake(account1.address, 1); // run fix share rate on stake

    const data2 = await staking.sessionDataOf(account1.address, 1); // get session data from stake
    const sharerate2 = TestUtil.getShareRate(data2); // get share rate 2

    const shares2 = data2.shares.toNumber(); // get shares from data
    expect(sharerate2.toFixed(2)).to.be.eq('1.09'); // expect sharerate to be 1.27
    expect(await staking.sharesTotalSupply().then(Number)).to.be.eq(shares2); // expect staking shares total supply === account 1
  });

  it('should fix a v1 stake that has been withdrawn', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 1,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '100'); // mint 100 for account 1

    await token.connect(staker).approve(stakingV1.address, '100');
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 0);

    await TestUtil.increaseTime(SECONDS_IN_DAY * length);
    const sessionDataV1 = await stakingV1.sessionDataOf(
      staker.address,
      sessionId
    );
    await stakingV1.connect(staker).unstakeTest(sessionId);

    await staking.connect(setter).fixV1Stake(staker.address, sessionId);
    const sessionData = await staking.sessionDataOf(staker.address, sessionId);

    expect(sessionData.start.toNumber()).to.be.eq(
      sessionDataV1.start.toNumber()
    );
    expect(sessionData.amount.toNumber()).to.be.eq(
      sessionDataV1.amount.toNumber()
    );
  });

  it('should fix a v1 stake with no penalty', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 2,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '200'); // mint 200 for account 1

    await token.connect(staker).approve(stakingV1.address, '100');
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 0);

    // // So payout gets values ?
    await token.connect(staker).approve(staking.address, '100');
    await staking.connect(staker).stake('100', length);

    const days = length + 18;
    for (let i = 0; i < days; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);
    }

    await stakingV1.connect(staker).unstakeTest(sessionId);

    await staking.connect(setter).fixV1Stake(staker.address, sessionId);
    await staking.connect(staker).unstake(sessionId);
  });

  it('should correctly update shares total supply', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 2,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '200'); // mint 200 for account 1

    await token.connect(staker).approve(stakingV1.address, '100');
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 0);

    // // So payout gets values ?
    await token.connect(staker).approve(staking.address, '100');
    await staking.connect(staker).stake('100', length);

    const days = length + 18;
    for (let i = 0; i < days; i++) {
      await TestUtil.increaseTime(SECONDS_IN_DAY);
    }

    await stakingV1.connect(staker).unstakeTest(sessionId);

    expect(await staking.sharesTotalSupply().then(String)).to.be.eq('100');
    await staking.connect(setter).fixV1Stake(staker.address, sessionId);
    expect(await staking.sharesTotalSupply().then(String)).to.be.eq('201');
  });

  it('should not fix a stake which has already been fixed', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 1,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '100'); // mint 100 for account 1

    await token.connect(staker).approve(stakingV1.address, '100');
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 0);

    await TestUtil.increaseTime(SECONDS_IN_DAY * length);
    await stakingV1.connect(staker).unstakeTest(sessionId);

    await staking.connect(setter).fixV1Stake(staker.address, sessionId);

    await expect(
      staking.connect(setter).fixV1Stake(staker.address, sessionId)
    ).to.be.revertedWith('Stake already fixed and or withdrawn');
  });

  it('should not fix a stake which has not been unstaked', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 1,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '100'); // mint 100 for account 1

    await token.connect(staker).approve(stakingV1.address, '100');
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 0);

    await TestUtil.increaseTime(SECONDS_IN_DAY * length);

    await expect(
      staking.connect(setter).fixV1Stake(staker.address, sessionId)
    ).to.be.revertedWith('Stake has not been withdrawn');
  });
  it('should not fix a stake which was staked AFTER last session id', async () => {
    const length = 10;

    const [setter, recipient, staker] = await ethers.getSigners();
    let subBalancesMock: SubBalancesMock;
    subBalancesMock = await (
      await ContractFactory.getSubBalancesMockFactory()
    ).deploy();
    const { staking, stakingV1, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
      bank: staker,
      fakeSubBalances: subBalancesMock.address,
      lastSessionIdV1: 1,
    });

    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role
    await token.connect(setter).mint(staker.address, '200'); // mint 200 for account 1

    await token.connect(staker).approve(stakingV1.address, '200');
    await stakingV1.connect(staker).stake('100', length);
    await stakingV1.connect(staker).stake('100', length);
    const sessionId = await stakingV1.sessionsOf(staker.address, 1);

    await TestUtil.increaseTime(SECONDS_IN_DAY * length);

    await expect(
      staking.connect(setter).fixV1Stake(staker.address, sessionId)
    ).to.be.revertedWith('Invalid sessionId');
  });
});
