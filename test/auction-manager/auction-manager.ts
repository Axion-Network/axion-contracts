import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../constants';
const expectRevert = require('../utils/expectRevert.js');

contract.only('Auction Pool', ([setter, recipient, account1]) => {
  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const {
        auctionManager,
        token,
        auction,
        bpd,
      } = await initTestSmartContracts({
        setter,
        recipient,
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
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToAuction(7, web3.utils.toWei('10'), {
          from: account1,
        }),
        'Caller is not a manager role.'
      );
    });

    it('should fail if max mint has been reached', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToAuction(7, '250000000001'),
        'Max mint has been reached'
      );
    });

    it('should send axion to the auction contract', async () => {
      const { auctionManager, token, auction } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await auction.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await auction.grantRole(ROLES.CALLER, auctionManager.address);

      await auctionManager.sendToAuction(7, 100);

      expect(await token.balanceOf(auction.address).then(String)).to.eq(
        web3.utils.toWei('100')
      );
      expect(
        await auction
          .reservesOf(7)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('100'));

      expect(
        await auction
          .reservesOf(6)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('0'));

      expect(
        await auction
          .reservesOf(8)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('0'));
    });
  });

  describe('sendToAuctions', () => {
    it('should fail if the caller is not a manager', async () => {
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToAuctions([7], [web3.utils.toWei('10')], {
          from: account1,
        }),
        'Caller is not a manager role.'
      );
    });

    it('should fail if max mint has been reached', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToAuctions([7], ['250000000001']),
        'Max mint has been reached'
      );
    });

    it('should fail if array lengths are not equal', async () => {
      const { auctionManager, token } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToAuctions([3, 7], [web3.utils.toWei('10')]),
        'Array lengths must be equal'
      );
    });

    it('should send axion to the auction contract', async () => {
      const { auctionManager, token, auction } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await auction.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await auction.grantRole(ROLES.CALLER, auctionManager.address);

      await auctionManager.sendToAuctions([3, 7], [100, 200]);

      expect(await token.balanceOf(auction.address).then(String)).to.eq(
        web3.utils.toWei('300')
      );

      expect(
        await auction
          .reservesOf(3)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('100'));
      expect(
        await auction
          .reservesOf(7)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('200'));

      expect(
        await auction
          .reservesOf(6)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('0'));

      expect(
        await auction
          .reservesOf(8)
          .then((reserves: any) => reserves['token'].toString())
      ).eq(web3.utils.toWei('0'));
    });
  });

  describe('sendToBPD', () => {
    it('should fail if the caller is not a manager', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToBPD(web3.utils.toWei('10'), {
          from: account1,
        }),
        'Caller is not a manager role.'
      );
    });

    it('should fail if max mint has been reached', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.sendToBPD('250000000001'),
        'Max mint has been reached'
      );
    });

    it('should send axion to the bpd contract', async () => {
      const { auctionManager, token, bpd } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await token.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await token.grantRole(ROLES.MINTER, auctionManager.address);

      await bpd.setupRole(ROLES.DEFAULT_ADMIN, setter);
      await bpd.grantRole(ROLES.SWAPPER, auctionManager.address);

      await auctionManager.sendToBPD(10000);

      expect(await token.balanceOf(bpd.address).then(String)).to.eq(
        web3.utils.toWei('10000')
      );

      expect(
        await bpd.poolYearAmounts(0).then(String).then(web3.utils.fromWei)
      ).to.eq('1000');
      expect(
        await bpd.poolYearAmounts(1).then(String).then(web3.utils.fromWei)
      ).to.eq('1500');
      expect(
        await bpd.poolYearAmounts(2).then(String).then(web3.utils.fromWei)
      ).to.eq('2000');
      expect(
        await bpd.poolYearAmounts(3).then(String).then(web3.utils.fromWei)
      ).to.eq('2500');
      expect(
        await bpd.poolYearAmounts(4).then(String).then(web3.utils.fromWei)
      ).to.eq('3000');
    });
  });

  describe('setupRole', () => {
    it('should fail if the caller is not a manager', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await expectRevert(
        auctionManager.setupRole(ROLES.DEFAULT_ADMIN, account1, {
          from: account1,
        }),
        'Caller is not a manager role.'
      );
    });

    it('should grant the role', async () => {
      const { auctionManager } = await initTestSmartContracts({
        setter,
        recipient,
      });

      await auctionManager.setupRole(ROLES.DEFAULT_ADMIN, account1);

      expect(
        await auctionManager
          .getRoleMemberCount(ROLES.DEFAULT_ADMIN)
          .then(String)
      ).to.eq('2');
      expect(
        await auctionManager.getRoleMember(ROLES.DEFAULT_ADMIN, 0).then(String)
      ).to.eq(setter);
      expect(
        await auctionManager.getRoleMember(ROLES.DEFAULT_ADMIN, 1).then(String)
      ).to.eq(account1);
    });
  });
});
