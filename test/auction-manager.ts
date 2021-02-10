import { initTestSmartContracts } from './utils/initTestSmartContracts';
import { ROLES } from '../constants/roles';
import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('Auction Pool', () => {
  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const {
        auctionManager,
        token,
        auction,
        bpd,
      } = await initTestSmartContracts({
        setter: setter,
        recipient: recipient,
      });

      expect(
        await auctionManager
          .getRoleMemberCount(ROLES.DEFAULT_ADMIN)
          .then(String)
      ).to.eq('1');

      expect(
        await auctionManager.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('1');

      const addresses = (await auctionManager.addresses()) as any;
      expect(addresses.axion).to.eq(token.address);
      expect(addresses.auction).to.eq(auction.address);
      expect(addresses.bpd).to.eq(bpd.address);

      expect(await auctionManager.mintedBPD().then(String)).to.eq('0');
      expect(await auctionManager.mintedAuction().then(String)).to.eq('0');
    });
  });

  describe('sendToAuction', () => {
    it('should fail if the caller is not a manager', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager
          .connect(account1)
          .sendToAuction(7, ethers.utils.parseEther('10'))
      ).to.be.revertedWith('Caller is not a manager role');
    });

    it('should fail if max mint has been reached', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager.sendToAuction(7, '250000000001')
      ).to.be.revertedWith('Max mint has been reached');
    });

    it('should send axion to the auction contract', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager, token, auction } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await auction.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await auction.grantRole(ROLES.CALLER, auctionManager.address);

      await auctionManager.sendToAuction(7, 100);

      expect(await token.balanceOf(auction.address).then(String)).to.eq(
        ethers.utils.parseEther('100')
      );
      expect(
        await auction
          .reservesOf(7)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('100'));

      expect(
        await auction
          .reservesOf(6)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('0'));

      expect(
        await auction
          .reservesOf(8)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('0'));
    });
  });

  describe('sendToAuctions', () => {
    it('should fail if the caller is not a manager', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager
          .connect(account1)
          .sendToAuctions([7], [ethers.utils.parseEther('10')])
      ).to.be.revertedWith('Caller is not a manager role');
    });

    it('should fail if max mint has been reached', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager.sendToAuctions([7], ['250000000001'])
      ).to.be.revertedWith('Max mint has been reached');
    });

    it('should fail if array lengths are not equal', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager.sendToAuctions([3, 7], [ethers.utils.parseEther('10')])
      ).to.be.revertedWith('Array lengths must be equal');
    });

    it('should send axion to the auction contract', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager, token, auction } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await auction.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await auction.grantRole(ROLES.CALLER, auctionManager.address);

      await auctionManager.sendToAuctions([3, 7], [100, 200]);

      expect(await token.balanceOf(auction.address).then(String)).to.eq(
        ethers.utils.parseEther('300')
      );

      expect(
        await auction
          .reservesOf(3)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('100'));
      expect(
        await auction
          .reservesOf(7)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('200'));

      expect(
        await auction
          .reservesOf(6)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('0'));

      expect(
        await auction
          .reservesOf(8)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(ethers.utils.parseEther('0'));
    });
  });

  describe('sendToBPD', () => {
    it('should fail if the caller is not a manager', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager
          .connect(account1)
          .sendToBPD(ethers.utils.parseEther('10'))
      ).to.be.revertedWith('Caller is not a manager role');
    });

    it('should fail if max mint has been reached', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager.sendToBPD('250000000001'),
        'Max mint has been reached'
      ).to.be.revertedWith('Max mint has been reached');
    });

    it('should send axion to the bpd contract', async () => {
      const [setter, recipient] = await ethers.getSigners();
      const { auctionManager, token, bpd } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await bpd.setupRole(ROLES.DEFAULT_ADMIN, setter.address);
      await bpd.grantRole(ROLES.SWAPPER, auctionManager.address);

      await auctionManager.sendToBPD(10000);

      expect(await token.balanceOf(bpd.address).then(String)).to.eq(
        ethers.utils.parseEther('10000')
      );

      expect(await bpd.poolYearAmounts(0).then(String)).to.eq(
        ethers.utils.parseEther('1000')
      );
      expect(await bpd.poolYearAmounts(1).then(String)).to.eq(
        ethers.utils.parseEther('1500')
      );
      expect(await bpd.poolYearAmounts(2).then(String)).to.eq(
        ethers.utils.parseEther('2000')
      );
      expect(await bpd.poolYearAmounts(3).then(String)).to.eq(
        ethers.utils.parseEther('2500')
      );
      expect(await bpd.poolYearAmounts(4).then(String)).to.eq(
        ethers.utils.parseEther('3000')
      );
    });
  });

  describe('setupRole', () => {
    it('should fail if the caller is not a manager', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expect(
        auctionManager
          .connect(account1)
          .setupRole(ROLES.DEFAULT_ADMIN, account1.address),
        'Caller is not a manager role.'
      ).to.be.revertedWith('Caller is not a manager role');
    });

    it('should grant the role', async () => {
      const [setter, recipient, account1] = await ethers.getSigners();
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await auctionManager.setupRole(ROLES.DEFAULT_ADMIN, account1.address);

      expect(
        await auctionManager
          .getRoleMemberCount(ROLES.DEFAULT_ADMIN)
          .then(String)
      ).to.eq('2');
      expect(
        await auctionManager.getRoleMember(ROLES.DEFAULT_ADMIN, 0).then(String)
      ).to.eq(setter.address);
      expect(
        await auctionManager.getRoleMember(ROLES.DEFAULT_ADMIN, 1).then(String)
      ).to.eq(account1.address);
    });
  });
});
