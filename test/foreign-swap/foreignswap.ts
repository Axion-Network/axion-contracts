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

  describe('free claim', async () => {
    it('should check signature and return true', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      const testSignature = TestUtil.sign(
        TEST_SIGNER_PRIV,
        ['uint256', 'address'],
        [MAX_CLAIM_AMOUNT.toString(), account1.address]
      );

      const checkResult = await foreignswap
        .connect(account1)
        .check(MAX_CLAIM_AMOUNT, testSignature);

      expect(checkResult).to.be.true;
    });
    it('should get user claimable amount', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      let userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);

      expect(userClaimableAmt[0].toString()).to.be.eq('10000000');
      expect(userClaimableAmt[1].toString()).to.be.eq('0');
    });
  });

  describe('claim', async () => {
    xit('should claim', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap, token } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      const testSignature = TestUtil.sign(
        TEST_SIGNER_PRIV,
        ['uint256', 'address'],
        [MAX_CLAIM_AMOUNT.toString(), account1.address]
      );

      // const checkResult = await foreignswap
      //   .connect(account1)
      //   .check(MAX_CLAIM_AMOUNT, testSignature);

      // expect(checkResult).to.be.true;
      await foreignswap
        .connect(account1)
        .claimFromForeign(MAX_CLAIM_AMOUNT, testSignature);
    });
  });

  describe('penalties & auction', async () => {
    it('should penalize for late claims - inner boundary', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      let userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);

      let daysFromStart, claimable;

      /** Inner Boundary Test */
      daysFromStart = 7;
      await TestUtil.increaseTime(SECONDS_IN_DAY * daysFromStart); // Set block to 7 days in future
      userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);
      claimable = TestUtil.claimableAmount(daysFromStart, MAX_CLAIM_AMOUNT);

      expect(userClaimableAmt[0].toString()).to.be.eq(claimable[0].toString());
      expect(userClaimableAmt[1].toString()).to.be.eq(claimable[1].toString());
      expect(0).to.be.eq(claimable[2]);
    });

    it('should penalize for late claims - boundary test', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      let userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);

      let daysFromStart, claimable;

      daysFromStart = 177;
      await TestUtil.increaseTime(SECONDS_IN_DAY * daysFromStart);

      userClaimableAmt = await foreignswap.getUserClaimableAmountFor(
        MAX_CLAIM_AMOUNT
      );
      claimable = TestUtil.claimableAmount(daysFromStart, MAX_CLAIM_AMOUNT);

      expect(userClaimableAmt[0].toString()).to.be.eq(claimable[0].toString());
      expect(userClaimableAmt[1].toString()).to.be.eq(claimable[1].toString());
      expect(0).to.be.eq(claimable[2]);
    });
    it('should penalize for late claims - outer boundary test', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { foreignswap } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      let userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);

      let daysFromStart, claimable;

      daysFromStart = 350;
      await TestUtil.increaseTime(SECONDS_IN_DAY * daysFromStart);

      userClaimableAmt = await foreignswap
        .connect(account1)
        .getUserClaimableAmountFor(MAX_CLAIM_AMOUNT);
      claimable = TestUtil.claimableAmount(daysFromStart, MAX_CLAIM_AMOUNT);

      expect(userClaimableAmt[0].toString()).to.be.eq(claimable[0].toString());
      expect(userClaimableAmt[1].toString()).to.be.eq(claimable[1].toString());
      expect(0).to.be.eq(claimable[2]);
    });
  });
});
