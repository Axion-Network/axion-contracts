const { expect } = require("chai");
const BN = require("bn.js");

const helper = require("./utils/utils.js");
const initTestSmartContracts = require("./utils/initTestSmartContracts.js");

const DAY = 86400;
const STAKE_PERIOD = 350;

const getBlockchainTimestamp = async () => {
  const latestBlock = await web3.eth.getBlock("latest");
  return latestBlock.timestamp;
};

contract(
  "Auction",
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

    it("subBalances.callOutcomeStakerTrigger bug", async () => {
      let afterInitTime = new BN(await getBlockchainTimestamp());
      let firstAccountStakeId = new BN(1);
      let stakeStartTime = afterInitTime;
      let firstAccountStakeEndTime = stakeStartTime.add(
        new BN(DAY * STAKE_PERIOD * 2 + DAY)
      );
      let firstAccountStakeShares = new BN(1_000_000);

      /** ------------------------- callIncomeStakerTrigger ------------------------- */

      // Account 1 deposit 1M to subbalance 1 and 2
      await subBalances.callIncomeStakerTrigger(
        account1,
        firstAccountStakeId,
        stakeStartTime,
        firstAccountStakeEndTime,
        firstAccountStakeShares,
        { from: stakingAddress }
      );

      // Account 2 deposit 5M to subalance 1, 2, 3, 4 and 5
      let secondAccountStakeId = new BN(2);
      let secondAccountStakeEndTime = stakeStartTime.add(new BN(DAY * STAKE_PERIOD * 5 + DAY));
      let secondAccountStakeShares = new BN(5_000_000);

      await subBalances.callIncomeStakerTrigger(
        account2,
        secondAccountStakeId,
        stakeStartTime,
        secondAccountStakeEndTime,
        secondAccountStakeShares,
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

      // Account 1 deposit 1M to subbalance 1 and 2
      // Account 2 deposit 5M to subalance 1, 2, 3, 4 and 5
      // This is correct
      expect(subBalance1.totalShares.toString()).to.eq("6000000");
      expect(subBalance2.totalShares.toString()).to.eq("6000000");
      expect(subBalance3.totalShares.toString()).to.eq("5000000");
      expect(subBalance4.totalShares.toString()).to.eq("5000000");
      expect(subBalance5.totalShares.toString()).to.eq("5000000");

      /** ------------------------- callOutcomeStakerTrigger ------------------------- */

      stakeShares = new BN(1_000_000);

      // Account 1 withdraw 1M to subbalance 1 and 2
      await subBalances.callOutcomeStakerTrigger(
        account1,
        firstAccountStakeId,
        stakeStartTime,
        firstAccountStakeEndTime,
        firstAccountStakeShares,
        { from: stakingAddress }
      );

      [
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

      // Account 1 withdraw 1M to subbalance 1 and 2
      expect(subBalance1.totalShares.toString()).to.eq("5000000");
      expect(subBalance2.totalShares.toString()).to.eq("5000000");

      // The is in correct: it should reduce the amount only in subbalance 1 and 2
      // but now subbalance 3,4 ,5 amount also get decreased
      // expect(subBalance3.totalShares.toString()).to.eq("4000000"); // correct value should be "5000000"
      // expect(subBalance4.totalShares.toString()).to.eq("4000000"); // correct value should be "5000000"
      // expect(subBalance5.totalShares.toString()).to.eq("4000000"); // correct value should be "5000000"

      expect(subBalance3.totalShares.toString()).to.eq("5000000"); // correct value should be "5000000"
      expect(subBalance4.totalShares.toString()).to.eq("5000000"); // correct value should be "5000000"
      expect(subBalance5.totalShares.toString()).to.eq("5000000"); // correct value should be "5000000"
    });
  }
);
