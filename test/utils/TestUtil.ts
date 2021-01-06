import { ethers } from 'hardhat';
import web3 from 'web3';
import { MAX_CLAIM_AMOUNT, STAKE_PERIOD } from './constants';

const EthCrypto = require('eth-crypto');

const decimals_div = 1e18;
const seconds_in_day = 86400;
const apy = 0.08; // annual percentage yield
const daily_compound_rate = 0.00021087439837685906; // (1+p)^365=1.08 --> p = 1.08^(1/365)-1
const MAX_HEX_FREECLAIM = 10e6;
const LATE_STAKE_GRACEPERIOD = 14;
const WEEKLY_LATE_UNSTAKE_PENALTY = 0.01;
const DAILY_LATE_UNSTAKE_PENALTY = WEEKLY_LATE_UNSTAKE_PENALTY / 7;

export class TestUtil {
  static async reset() {
    await ethers.provider.send('hardhat_reset', []);
  }

  static async increaseTime(seconds: number) {
    await ethers.provider.send('evm_increaseTime', [seconds]);
    await ethers.provider.send('evm_mine', []);
  }

  static async resetBlockTimestamp() {
    const blockNumber = ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const secondsDiff = currentTimestamp - block.timestamp;
    await ethers.provider.send('evm_increaseTime', [secondsDiff]);
    await ethers.provider.send('evm_mine', []);
  }

  static async timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static calcShares(amount: any, stakingDays: any, shareRate: any) {
    let sd = stakingDays > 1820 ? 1820 : stakingDays;
    return amount * (1819 + sd) / (1820 * shareRate);
  }

  static calcSharesFromStakeEvent(amount: any, start: any, end: any, shareRate: any) {
    amount /= decimals_div;
    let stakingDays = (end - start) / seconds_in_day;
    return TestUtil.calcShares(amount, stakingDays, shareRate);
  }

  static calcPayoutNoRewards(amountStaked: any, shares: any, stakingDays: any) {
    let earnings_by_inflation = shares * Math.pow(1 + daily_compound_rate, stakingDays);
    return (amountStaked + earnings_by_inflation);
  }

  static calcLateClaimPenalty(daysSinceMainnetStart: any, claim: any) {
    let daysPenalised = daysSinceMainnetStart > 350 ? 350 : daysSinceMainnetStart; // after 350 days there is no eligible claim left
    let lateConvertPenalty = 1 - (daysPenalised / 350); // both hex and hex2t has same late claim penalty
    let eligibleAmount = claim * lateConvertPenalty;
    return eligibleAmount;
  }

  static calcHEXFreeClaimPenalty(daysSinceMainnetStart: any, hexWalletAmount: any) {
    let maxAmount = hexWalletAmount > MAX_HEX_FREECLAIM ? MAX_HEX_FREECLAIM : hexWalletAmount; // freeclaim limited to 10M
    let bigPenaltyAmount = maxAmount < MAX_HEX_FREECLAIM ? 0 : hexWalletAmount - maxAmount; // everything above 10M is sent to auction / bpd
    let eligibleClaimAmount = TestUtil.calcLateClaimPenalty(daysSinceMainnetStart, maxAmount); // this is the amount eligible after late claim penalty
    let claimPenaltyToAuction = maxAmount - eligibleClaimAmount; // this is late claim penalty also sent to auction
    return { bigPenaltyAmount, eligibleClaimAmount, claimPenaltyToAuction };
  }

  // NOTE: with shares, it is meant principal + earnings
  static calcEarlyUnstakePenalty(shares: any, stakingDays: any, daysSinceStakeStarted: any) {
    if (daysSinceStakeStarted > stakingDays) { // not an early unstake
      return shares;
    }

    let stakingProgress = daysSinceStakeStarted / stakingDays;
    return stakingProgress * shares;

  }

  // NOTE: with shares, it is meant principal + earnings
  static calcLateUnstakePenalty(shares: any, stakingDays: any, daysSinceStakeStarted: any) {
    if (daysSinceStakeStarted < stakingDays) {
      return shares;
    }

    let daysSinceStakeEnded = daysSinceStakeStarted - stakingDays;
    if (daysSinceStakeEnded <= LATE_STAKE_GRACEPERIOD) { // grace period of 14 days
      return shares;
    }
    let numPenaltyDays = daysSinceStakeEnded - LATE_STAKE_GRACEPERIOD;
    let penalty = numPenaltyDays * DAILY_LATE_UNSTAKE_PENALTY;
    penalty = penalty > 1.0 ? 1.0 : penalty;
    return shares * (1 - penalty);
  }

  /** Signing functions */
  static getMessageHash = (encodeTypes: string[], args: string[]) => {
    const encoded = ethers.utils.defaultAbiCoder.encode(encodeTypes, args);
    return web3.utils.soliditySha3(encoded);
  };

  static sign = (
    pkey: String,
    messageParamsTypes: string[],
    messageParams: string[]
  ) => {
    const messageHash = TestUtil.getMessageHash(
      messageParamsTypes,
      messageParams
    );

    return EthCrypto.sign(pkey, messageHash);
  };

  /** Foreignswap Claimable Amounts */
  static claimableAmount(daysFromStart: any, amount: any) {
    let deltaAuctionWeekly = 0;
    if (amount > MAX_CLAIM_AMOUNT.toNumber()) {
      deltaAuctionWeekly = amount - MAX_CLAIM_AMOUNT.toNumber();
      amount = MAX_CLAIM_AMOUNT.toNumber();
    }

    let stepsFromStart = daysFromStart;
    let daysPassed =
      stepsFromStart > STAKE_PERIOD ? STAKE_PERIOD : stepsFromStart;
    let delta = Math.floor((amount * daysPassed) / STAKE_PERIOD);
    let amountOut = amount - delta;

    return [
      Math.floor(amountOut),
      Math.ceil(delta),
      Math.ceil(deltaAuctionWeekly),
    ];
  }
}
