import { ethers } from 'hardhat';

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
}
