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
} from '../utils/constants';
import { TestUtil } from '../utils/TestUtil';

describe('Foreign Swap', () => {
  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const {
        foreignswap,
        token,
        staking,
        bpd,
        auction,
      } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      expect(
        await foreignswap.getRoleMemberCount(ROLES.DEFAULT_ADMIN).then(String)
      ).to.eq('0'); // Test that admin has 0 members

      expect(
        await foreignswap.getRoleMemberCount(ROLES.MIGRATOR).then(String)
      ).to.eq('1'); // Test that migrator has only 1 member

      expect(await foreignswap.hasRole(ROLES.MIGRATOR, setter.address)).to.eq(
        true
      ); // Ensure migrator role is the setters

      expect(
        await foreignswap.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('1'); // Test that manager has only 1 member

      expect(await foreignswap.hasRole(ROLES.MANAGER, setter.address)).to.eq(
        true
      ); // Ensure manager roles is the setters

      const stepTimeStamp = await foreignswap.stepTimestamp(); // Get time stamp from foreignswap
      const period = await foreignswap.stakePeriod(); // get valid period from native swap
      const snapshotAmt = await foreignswap.getTotalSnapshotAmount(); // get valid period from native swap
      const snapshotAddresses = await foreignswap.getTotalSnapshotAddresses(); // get valid period from native swap
      const maxClaimAmount = await foreignswap.maxClaimAmount(); // get valid period from native swap

      expect(maxClaimAmount.toString()).to.eq(`${MAX_CLAIM_AMOUNT}`); // Ensure snapshot amount is set correct
      expect(snapshotAmt.toString()).to.eq(`${TOTAL_SNAPSHOT_AMOUNT}`); // Ensure snapshot amount is set correct
      expect(snapshotAddresses.toString()).to.eq(`${TOTAL_SNAPSHOT_ADDRESS}`); // Ensure snapshot addreses is set correct
      expect(stepTimeStamp.toString()).to.eq(`${SECONDS_IN_DAY}`); // Ensure stepTimestamp is set correct
      expect(period.toString()).to.eq(`${STAKE_PERIOD}`); // Ensure period is set correct
      expect(await foreignswap.mainToken()).to.eq(token.address); // Ensure token address set correct
      expect(await foreignswap.staking()).to.eq(staking.address); // Ensure staking token is set correct
      expect(await foreignswap.auction()).to.eq(auction.address); // Ensure auction address is set correct
      expect(await foreignswap.bigPayDayPool()).to.eq(bpd.address); // Ensure bpd address is set correct
      expect(await foreignswap.signerAddress()).to.eq(TEST_SIGNER); // Ensure singer address is set correct
    });

    it('should allow manager to setup role', async () => {
      const [setter, recipient, setToManager] = await ethers.getSigners();
      const { nativeswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      await nativeswap
        .connect(setter)
        .setupRole(ROLES.MANAGER, setToManager.address);
      expect(
        await nativeswap.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('2'); // Test that manager has only 1 member

      expect(
        await nativeswap.hasRole(ROLES.MANAGER, setToManager.address)
      ).to.eq(true); // Ensure manager roles is the setters
    });
  });
});
