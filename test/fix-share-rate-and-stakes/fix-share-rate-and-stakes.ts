import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';

import {
  SECONDS_IN_DAY,
} from '../utils/constants';

describe.only('Fix Share Rates & Stakes', () => {
  it('should not allow external use of sub balances addToShareTotalSupply and subFromShareTotalSupply', async () => {
    const [setter, recipient] = await ethers.getSigners();
    const { subbalances } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await expect(subbalances.addToShareTotalSupply('100')).to.be.revertedWith("Caller is not a caller") // Ensure subbalances shares can't be messed with
    await expect(subbalances.subFromShareTotalSupply('100')).to.be.revertedWith("Caller is not a caller") // Ensure subbalances shares can't be messed with
  })
  it('should set share rate', async () => {
    const [setter, recipient] = await ethers.getSigners();
    const { staking } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await staking.setShareRate('109000000000000000') // set share rate
    expect(await staking.shareRate()).to.eq("109000000000000000"); // expect share rate to be 1.09
  })

  it('should correctly update users share rate', async () => {
    const [setter, recipient, account1] = await ethers.getSigners();
    const { staking, token, subbalances } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    /** Add a 1.27 stakes */
    await staking.setShareRate('127000000000000000') // set share rate to 1.27
    await token.connect(setter).setupRole(ROLES.MINTER, setter.address); // setup role

    await token.connect(setter).mint(account1.address, '100') // mint 100 for account 1

    await staking.connect(account1).stake('100', 365); // set a 1.27 stake
    const data = await staking.sessionDataOf(account1.address, 1); // get session data from stake
    const sharerate = getShareRate(data); // get share rate
    
    const shares = data.shares.toNumber(); // get shares from data
    expect(sharerate.toFixed(2)).to.be.eq('1.27'); // expect sharerate to be 1.27
    expect(await staking.sharesTotalSupply().then(Number)).to.be.eq(shares) // expect staking shares total supply === account 1
    expect(await subbalances.currentSharesTotalSupply().then(Number)).to.be.eq(shares) // expect subbalances shares total supply === account 1

    // Update share rate to 1.09 and then update the stake
    await staking.setShareRate('109000000000000000') // set share rate to 1.09 
    await staking.connect(setter).fixShareRateOnStake(account1.address, 1); // run fix share rate on stake

    const data2 = await staking.sessionDataOf(account1.address, 1); // get session data from stake
    const sharerate2 = getShareRate(data2); // get share rate 2 
    
    const shares2 = data2.shares.toNumber(); // get shares from data
    expect(sharerate2.toFixed(2)).to.be.eq('1.09'); // expect sharerate to be 1.27
    expect(await staking.sharesTotalSupply().then(Number)).to.be.eq(shares2) // expect staking shares total supply === account 1
    expect(await subbalances.currentSharesTotalSupply().then(Number)).to.be.eq(shares2) // expect subbalances shares total supply === account 1
  })

  it('should fix a v1 stake that has been withdrawn because people are dumbshits', () => {

  })
});

const getShareRate  = (data: any) => {
  const stakedays = (data.end.toNumber() - data.start.toNumber()) / SECONDS_IN_DAY;
  return (data.amount.toNumber() * (1819 + stakedays)) / (1820 * (data.shares.toNumber() / 10))
}
