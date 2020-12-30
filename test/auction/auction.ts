import { initTestSmartContracts } from '../utils/initTestSmartContracts';
import { ROLES } from '../../constants/roles';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import {
  Auction,
  Token,
  Staking,
  UniswapV2Router02Mock,
  Auction20201219,
} from '../../typechain';
import { ContractFactory } from '../../libs/ContractFactory';
import { TestUtil } from '../utils/TestUtil';

/** Helper Vars */
const DAY = 86400;
const AUTOSTAKE_MIN = 60;
const DEADLINE = ethers.utils.parseEther('10000000');

describe('Auction', () => {
  let token: Token;
  let auction: Auction;
  let staking: Staking;
  let uniswap: UniswapV2Router02Mock;

  beforeEach(async () => {
    const [setter, recipient] = await ethers.getSigners();
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
    });

    token = contracts.token;
    auction = contracts.auction;
    staking = contracts.staking;
    uniswap = contracts.uniswap;
  });

  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const addresses = (await auction.addresses()) as any;

      expect(
        await auction.getRoleMemberCount(ROLES.MANAGER).then(String)
      ).to.eq('1');
      expect(addresses.mainToken).to.eq(token.address);
      expect(addresses.staking).to.eq(staking.address);
      expect(addresses.uniswap).to.eq(uniswap.address);
    });
  });

  describe('bid', () => {
    it(`should correctly send bids with a custom autostake duration, and fail if not between ${AUTOSTAKE_MIN} and 5555 days`, async () => {
      const [account1, account2] = await ethers.getSigners();

      // Bid with 1 eth for AUTOSTAKE_MIN days
      await auction
        .connect(account1)
        .bid(0, DEADLINE, account2.address, AUTOSTAKE_MIN, {
          value: ethers.utils.parseEther('1'),
        });
      const auctionID = await auction.lastAuctionEventId();
      const autoStakeDays = await auction.autoStakeDaysOf(
        auctionID,
        account1.address
      );
      expect(autoStakeDays.toString()).to.eq(AUTOSTAKE_MIN.toString());

      // Bid with 2 eth for 350 days
      await auction.connect(account1).bid(0, DEADLINE, account2.address, 350, {
        value: ethers.utils.parseEther('2'),
      });
      const auction350ID = await auction.lastAuctionEventId();
      const autoStake350Days = await auction.autoStakeDaysOf(
        auction350ID,
        account1.address
      );
      expect(autoStake350Days.toString()).to.eq('350');

      // Try to bid with 1 eth for 5556 days
      await expect(
        auction.connect(account1).bid(0, DEADLINE, account2.address, 5556, {
          value: ethers.utils.parseEther('1'),
        })
      ).to.be.revertedWith('stakeDays > 5555 days');

      // Try to bid with 1 eth for 1 day
      await expect(
        auction.connect(account1).bid(0, DEADLINE, account2.address, 1, {
          value: ethers.utils.parseEther('1'),
        })
      ).to.be.revertedWith('stakeDays < minimum days');
    });

    it(`should correctly set autoStake days to ${AUTOSTAKE_MIN} if it has not been set`, async () => {
      const [
        setter,
        recipient,
        subBalances,
        v1Contract,
        nativeSwap,
        foreignSwap,
        account1,
        account2,
      ] = await ethers.getSigners();

      // Deploy the old auction contract (Auction20201229)
      // Bid with 1 eth (old Auction contract, doesnt have stakeDays param)
      // If no param is found in the new contract, it should set to default min stakeDays
      const auction20201219 = (await upgrades.deployProxy(
        await ContractFactory.getAuction20201219Factory(),
        [setter.address, setter.address],
        {
          unsafeAllowCustomTypes: true,
          unsafeAllowLinkedLibraries: true,
        }
      )) as Auction20201219;

      await auction20201219.init(
        DAY,
        token.address,
        staking.address,
        uniswap.address,
        recipient.address,
        nativeSwap.address,
        foreignSwap.address,
        subBalances.address,
        v1Contract.address
      );

      await token.setupRole(ROLES.MINTER, auction20201219.address);
      await staking.setupRole(ROLES.EXTERNAL_STAKER, auction20201219.address);

      await auction20201219
        .connect(account1)
        .bid(0, DEADLINE, account2.address, {
          value: ethers.utils.parseEther('1'),
        });

      const idWithoutAutostakeDays = await auction20201219.lastAuctionEventId();

      // Upgrade the contract
      const auctionUpgrade = (await upgrades.upgradeProxy(
        auction20201219.address,
        await ContractFactory.getAuctionFactory(),
        {
          unsafeAllowCustomTypes: true,
          unsafeAllowLinkedLibraries: true,
        }
      )) as Auction;

      expect(auction20201219.address).to.eq(auctionUpgrade.address);

      expect(
        await auctionUpgrade.autoStakeDaysOf(
          idWithoutAutostakeDays,
          account1.address
        )
      ).to.eq('0');

      // Withdraw (with stakeDays currently set to 0)
      await TestUtil.increaseTime(DAY);
      await auctionUpgrade.connect(account1).withdraw(idWithoutAutostakeDays);

      const withdrawalEvents = await auctionUpgrade.queryFilter(
        auctionUpgrade.filters.Withdraval(null, null, null, null, null)
      );

      expect(withdrawalEvents).to.have.lengthOf(1);
      expect(withdrawalEvents[0].args?.stakeDays).to.eq(14); // 14 is minimum stakeDays (options.autoStakeDays)
    });
  });
});
