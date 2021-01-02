import { ethers } from 'hardhat';
import web3 from 'web3';
import { MAX_CLAIM_AMOUNT, STAKE_PERIOD } from './constants';

const EthCrypto = require('eth-crypto');

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
