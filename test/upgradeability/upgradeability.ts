import {
  Auction,
  BPD,
  ForeignSwap,
  NativeSwap,
  Staking,
  SubBalances,
  TERC20,
  Token,
} from '../../typechain';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ContractFactory } from '../../libs/ContractFactory';
import { TestUtil } from '../utils/TestUtil';

/** Helper Vars */
const DAY = 86400;
const AUTOSTAKE_LENGTH = 350;
const DEADLINE = ethers.utils.parseEther('10000000');

describe('Upgradeability', () => {
  let swaptoken: TERC20;
  let foreignswap: ForeignSwap;
  let token: Token;
  let nativeswap: NativeSwap;
  let auction: Auction;
  let subBalances: SubBalances;
  let staking: Staking;
  let bpd: BPD;

  beforeEach(async () => {
    const [setter, recipient, fakeBank] = await ethers.getSigners();
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
      bank: fakeBank,
    });
    // token = contracts.token;
    swaptoken = contracts.swaptoken;
    foreignswap = contracts.foreignswap;
    token = contracts.token;
    nativeswap = contracts.nativeswap;
    auction = contracts.auction;
    subBalances = contracts.subBalances;
    staking = contracts.staking;
    bpd = contracts.bpd;
  });

  describe('upgrades', () => {
    it('works with simple numbers', async () => {
      await auction.setReferrerPercentage(5);
      const value1 = (await auction.options()).referrerPercent;
      const auctionUpgrade = await upgrades.upgradeProxy(
        auction.address,
        await ContractFactory.getAuctionFactory(),
        {
          unsafeAllowCustomTypes: true,
          unsafeAllowLinkedLibraries: true,
        }
      );
      const value2 = (await auctionUpgrade.options()).referrerPercent;

      expect(value1.toString()).to.eq(value2.toString());
      expect(auction.address).to.eq(auctionUpgrade.address);
    });

    it('should upgrade stakes with states', async () => {
      const [
        setter,
        recipient,
        fakeBank,
        account1,
        account2,
      ] = await ethers.getSigners();
      await token
        .connect(fakeBank)
        .transfer(account1.address, ethers.utils.parseEther('1000'));
      await token
        .connect(fakeBank)
        .transfer(account2.address, ethers.utils.parseEther('1000'));
      await token
        .connect(account1)
        .approve(staking.address, ethers.utils.parseEther('10'));

      await staking.connect(account1).stake(ethers.utils.parseEther('100'), 3);
      const sessionOfBefore = await staking.sessionsOf(account1.address, 0);
      const dataBefore = await staking.sessionDataOf(
        account1.address,
        sessionOfBefore.toString()
      );

      const stakingUpgrade = (await upgrades.upgradeProxy(
        staking.address,
        await ContractFactory.getStakingFactory(),
        {
          unsafeAllowCustomTypes: true,
          unsafeAllowLinkedLibraries: true,
        }
      )) as Staking;
      const sessionOfAfter = await stakingUpgrade.sessionsOf(
        account1.address,
        0
      );
      const dataAfter = await stakingUpgrade.sessionDataOf(
        account1.address,
        sessionOfAfter.toString()
      );

      expect(staking.address).to.eq(stakingUpgrade.address);
      expect(sessionOfBefore.toString()).to.eq(sessionOfAfter.toString());
      expect(dataBefore.amount.toString()).to.eq(dataAfter.amount.toString());
      expect(dataBefore.start.toString()).to.eq(dataAfter.start.toString());
      expect(dataBefore.end.toString()).to.eq(dataAfter.end.toString());
      expect(dataBefore.shares.toString()).to.eq(dataAfter.shares.toString());
      expect(dataBefore.firstPayout.toString()).to.eq(
        dataAfter.firstPayout.toString()
      );
      expect(dataBefore.lastPayout.toString()).to.eq(
        dataAfter.lastPayout.toString()
      );
    });

    it('should upgrade auction', async () => {
      const [
        setter,	
        recipient,
        fakeBank,
        account1,
        account2,
      ] = await ethers.getSigners();

      // Advance the date to day 100 after launch
      await TestUtil.increaseTime(DAY * 100);
      // Bid with 10 eth
      await auction.connect(account1).bid(0, DEADLINE, account2.address, {
        value: ethers.utils.parseEther('10'),
      });
      const currentAuctionIdBefore = await auction.lastAuctionEventId();
      const auctionBidOfBefore = await auction.auctionBidOf(
        currentAuctionIdBefore,
        account1.address
      );

      const autoStakeDaysOfBefore = await auction.autoStakeDaysOf(
        currentAuctionIdBefore,
        account1.address
      );
      const auctionsOfBefore = await auction.auctionsOf(account1.address, 0);
      const reservesBefore = await auction.reservesOf(currentAuctionIdBefore);

      const auctionUpgrade = (await upgrades.upgradeProxy(
        auction.address,
        await ContractFactory.getAuctionFactory(),
        {
          unsafeAllowCustomTypes: true,
          unsafeAllowLinkedLibraries: true,
        }
      )) as Auction;

      const currentAuctionIdAfter = await auctionUpgrade.lastAuctionEventId();
      const auctionsOfAfter = await auction.auctionsOf(account1.address, 0);
      const auctionBidOfAfter = await auctionUpgrade.auctionBidOf(
        currentAuctionIdAfter,
        account1.address
      );
      const autoStakeDaysOfAfter = await auction.autoStakeDaysOf(
        currentAuctionIdAfter,
        account1.address
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
      expect(autoStakeDaysOfBefore.toString()).to.eq(
        autoStakeDaysOfAfter.toString()
      );
    });
  });
});
