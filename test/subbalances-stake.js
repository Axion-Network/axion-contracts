const { expect } = require('chai');
const BN = require('bn.js');

const initTestSmartContracts = require('./utils/initTestSmartContracts.js');

const DAY = 86400;

const getBlockchainTimestamp = async () => {
  const latestBlock = await web3.eth.getBlock('latest');
  return latestBlock.timestamp;
};

contract(
  'Auction',
  ([
    setter,
    foreignSwapAddress,
    weeklyAuction,
    stakingAddress,
    bigPayDayAddress,
    recipient,
    account1,
    account2,
    account3,
    account4,
  ]) => {
    let swaptoken;
    let foreignswap;
    let token;
    let nativeswap;
    let dailyauction;
    let uniswap;
    let subBalances;
    let staking;
    let bpd;

    beforeEach(async () => {
      const contracts = await initTestSmartContracts(
        setter,
        recipient,
        stakingAddress
      );
      swaptoken = contracts.swaptoken;
      foreignswap = contracts.foreignswap;
      token = contracts.token;
      nativeswap = contracts.nativeswap;
      dailyauction = contracts.auction;
      uniswap = contracts.uniswap;
      subBalances = contracts.subbalances;
      staking = contracts.staking;
      bpd = contracts.bpd;
    });

    describe('subBalances.callIncomeStakerTrigger', () => {
      it('should not put shares in any bpd pool if stake until day 350', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(0));
        expect(subBalance2.totalShares.toString()).to.eq(String(0));
        expect(subBalance3.totalShares.toString()).to.eq(String(0));
        expect(subBalance4.totalShares.toString()).to.eq(String(0));
        expect(subBalance5.totalShares.toString()).to.eq(String(0));
      });

      it('should put shares in bpd pool 1 if stake until day 351', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350 + DAY));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance2.totalShares.toString()).to.eq(String(0));
        expect(subBalance3.totalShares.toString()).to.eq(String(0));
        expect(subBalance4.totalShares.toString()).to.eq(String(0));
        expect(subBalance5.totalShares.toString()).to.eq(String(0));
      });

      it('should put shares in bpd pool 1 and 2 if stake until day 701', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350 * 2 + DAY));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance2.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance3.totalShares.toString()).to.eq(String(0));
        expect(subBalance4.totalShares.toString()).to.eq(String(0));
        expect(subBalance5.totalShares.toString()).to.eq(String(0));
      });

      it('should put shares in bpd pool 1, 2 and 3 if stake until day 1051', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350 * 3 + DAY));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance2.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance3.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance4.totalShares.toString()).to.eq(String(0));
        expect(subBalance5.totalShares.toString()).to.eq(String(0));
      });

      it('should put shares in bpd pool 1, 2, 3 and 4 if stake until day 1401', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350 * 4 + DAY));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance2.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance3.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance4.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance5.totalShares.toString()).to.eq(String(0));
      });

      it('should put shares in bpd pool 1, 2, 3, 4 and 5 if stake until day 1751', async () => {
        let afterInitTime = new BN(await getBlockchainTimestamp());
        let stakeId = new BN(1);
        let stakeStartTime = afterInitTime;
        let stakeEndTime = stakeStartTime.add(new BN(DAY * 350 * 5 + DAY));
        let stakeShares = new BN(1_000_000);

        await subBalances.callIncomeStakerTrigger(
          account1,
          stakeId,
          stakeStartTime,
          stakeEndTime,
          stakeShares,
          { from: stakingAddress }
        );

        let [
          subBalance1,
          subBalance2,
          subBalance3,
          subBalance4,
          subBalance5,
        ] = await Promise.all([
          subBalances.subBalanceList(0),
          subBalances.subBalanceList(1),
          subBalances.subBalanceList(2),
          subBalances.subBalanceList(3),
          subBalances.subBalanceList(4),
        ]);

        expect(subBalance1.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance2.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance3.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance4.totalShares.toString()).to.eq(String(1_000_000));
        expect(subBalance5.totalShares.toString()).to.eq(String(1_000_000));
      });
    });
  }
);
