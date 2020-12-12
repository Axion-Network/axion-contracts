const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');
/** Helper Vars */
const DAY = 86400;
const DEADLINE = web3.utils.toWei('10000000');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
// Artifacts
const Auction = artifacts.require('./Auction.sol');
const NativeSwap = artifacts.require('./NativeSwap.sol');
const Staking = artifacts.require('./Staking.sol');
const ForeignSwap = artifacts.require('./ForeignSwap.sol');
const BPD = artifacts.require('./BPD.sol');
const SubBalances = artifacts.require('./SubBalances.sol');
const Token = artifacts.require('./Token.sol');
const TERC20 = artifacts.require('TERC20');

chai.use(require('chai-bn')(BN));

contract('Upgradeability', ([setter, recipient, bank, account1, account2]) => {
  let swaptoken;
  let foreignswap;
  let token;
  let nativeswap;
  let auction;
  let subBalances;
  let staking;
  let bpd;

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

    const contracts = await initTestSmartContracts({
      setter,
      recipient,
      bank,
      tokenAddress: token.address,
    });
    // token = contracts.token;
    swaptoken = contracts.swaptoken;
    foreignswap = contracts.foreignswap;
    nativeswap = contracts.nativeswap;
    auction = contracts.auction;
    subBalances = contracts.subbalances;
    staking = contracts.staking;
    bpd = contracts.bpd;
  });

  describe('upgrades', () => {
    it('works with simple numbers', async () => {
      await auction.setReferrerPercentage(5, { from: setter });
      const value1 = (await auction.options()).referrerPercent;
      const auctionUpgrade = await upgradeProxy(auction.address, Auction, {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });
      const value2 = (await auctionUpgrade.options()).referrerPercent;

      expect(value1.toString()).to.eq(value2.toString());
      expect(auction.address).to.eq(auctionUpgrade.address);
    });

    it('should upgrade stakes with states', async () => {
      await token.transfer(account1, web3.utils.toWei('1000'), { from: bank });
      await token.transfer(account2, web3.utils.toWei('1000'), { from: bank });
      await token.approve(staking.address, web3.utils.toWei('10'), {
        from: account1,
      });

      await staking.stake(web3.utils.toWei('100'), 3, {
        from: account1,
      });
      const sessionOfBefore = await staking.sessionsOf(account1, 0);
      const dataBefore = await staking.sessionDataOf(
        account1,
        sessionOfBefore.toString()
      );

      const stakingUpgrade = await upgradeProxy(staking.address, Staking, {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });
      const sessionOfAfter = await stakingUpgrade.sessionsOf(account1, 0);
      const dataAfter = await stakingUpgrade.sessionDataOf(
        account1,
        sessionOfAfter.toString()
      );

      expect(staking.address).to.eq(stakingUpgrade.address);
      expect(sessionOfBefore.toString()).to.eq(sessionOfAfter.toString());
      expect(dataBefore.amount.toString()).to.eq(dataAfter.amount.toString());
      expect(dataBefore.start.toString()).to.eq(dataAfter.start.toString());
      expect(dataBefore.end.toString()).to.eq(dataAfter.end.toString());
      expect(dataBefore.shares.toString()).to.eq(dataAfter.shares.toString());
      expect(dataBefore.firstPayout.toString()).to.eq(dataAfter.firstPayout.toString());
      expect(dataBefore.lastPayout.toString()).to.eq(dataAfter.lastPayout.toString());
    });

    it('should upgrade auction', async () => {
      // Advance the date to day 100 after launch
      await helper.advanceTimeAndBlock(DAY * 100);
      // Bid with 10 eth
      await auction.bid(0, DEADLINE, account2, {
        from: account1,
        value: web3.utils.toWei('10'),
      });
      const currentAuctionIdBefore = await auction.lastAuctionEventId();
      const auctionBidOfBefore = await auction.auctionBidOf(
        currentAuctionIdBefore,
        account1
      );
      const auctionsOfBefore = await auction.auctionsOf(account1, 0);
      const reservesBefore = await auction.reservesOf(currentAuctionIdBefore);

      const auctionUpgrade = await upgradeProxy(auction.address, Auction, {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      });

      const currentAuctionIdAfter = await auctionUpgrade.lastAuctionEventId();
      const auctionsOfAfter = await auction.auctionsOf(account1, 0);
      const auctionBidOfAfter = await auctionUpgrade.auctionBidOf(
        currentAuctionIdAfter,
        account1
      );
      const reservesAfter = await auctionUpgrade.reservesOf(
        currentAuctionIdAfter
      );

      expect(auctionsOfAfter.toString()).to.eq(auctionsOfBefore.toString());
      expect(currentAuctionIdBefore.toString()).to.eq(
        currentAuctionIdAfter.toString()
      );
      expect(auctionBidOfBefore.eth.toString()).to.eq(
        auctionBidOfAfter.eth.toString()
      );
      expect(auctionBidOfBefore.ref.toString()).to.eq(
        auctionBidOfAfter.ref.toString()
      );
      expect(reservesBefore.eth.toString()).to.eq(reservesAfter.eth.toString());
      expect(reservesBefore.token.toString()).to.eq(
        reservesAfter.token.toString()
      );
      expect(reservesBefore.uniswapLastPrice.toString()).to.eq(
        reservesAfter.uniswapLastPrice.toString()
      );
      expect(reservesBefore.uniswapMiddlePrice.toString()).to.eq(
        reservesAfter.uniswapMiddlePrice.toString()
      );
    });
  });
});
