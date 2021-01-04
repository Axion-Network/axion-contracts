import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';

import {
  MAX_CLAIM_AMOUNT,
  SECONDS_IN_DAY,
  STAKE_PERIOD,
  TEST_SIGNER,
  TOTAL_SNAPSHOT_ADDRESS,
  TOTAL_SNAPSHOT_AMOUNT,
  TEST_SIGNER_PRIV,
} from '../utils/constants';
import { TestUtil } from '../utils/TestUtil';

describe.only('Fix Share Rates', () => {
  it('should not allow external use of sub balances addToShareTotalSupply and subFromShareTotalSupply', async () => {
    const [setter, recipient] = await ethers.getSigners();
    const { subbalances } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await expect(subbalances.addToShareTotalSupply('100')).to.be.revertedWith("Caller is not a caller")
    await expect(subbalances.subFromShareTotalSupply('100')).to.be.revertedWith("Caller is not a caller")
  })
  it('should set share rate', async () => {
    const [setter, recipient] = await ethers.getSigners();
    const { staking } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await staking.setShareRate('109000000000000000')
    expect(await staking.shareRate()).to.eq("109000000000000000");
  })

  it.only('should correctly update users share rate', async () => {
    const [setter, recipient, account1] = await ethers.getSigners();
    const { staking, token } = await initTestSmartContracts({
      setter: setter,
      recipient: recipient,
    });

    await staking.setShareRate('127000000000000000')
    await token.connect(setter).setupRole(ROLES.MINTER, setter.address);

    await token.connect(setter).mint(account1.address, '100')

    await staking.connect(account1).stake('100', '365');

    const data = await staking.sessionDataOf(account1.address, 1);
    const sharerate = getShareRate(data);

    console.log(sharerate);

  })
});

const getShareRate  = (data: any) => {
  const stakedays = (data.end.toNumber() - data.start.toNumber()) / SECONDS_IN_DAY;

  console.log("StakeDays:", stakedays, "amount:", data.amount.toNumber(), "shares:", data.shares.toNumber());

  return (data.amount.toNumber() * (1819 + stakedays)) / (1820 * data.shares.toNumber())
}
