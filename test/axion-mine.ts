import { initMineTestContracts } from './utils/initMineTestContracts';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  AxionMine,
  TERC20,
  TERC721,
} from '../typechain';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { min } from 'bn.js';

const REWARD_AMOUNT = ethers.utils.parseEther('10000000');
const BLOCK_REWARD = ethers.utils.parseEther('1');
const START_BLOCK = 1;

describe('Axion Mine', () => {
  let _manager: SignerWithAddress;
  let rewardToken: TERC20;
  let lpToken: TERC20;
  let nft1: TERC721
  let nft2: TERC721
  let nft3: TERC721
  let mine: AxionMine;

  beforeEach(async () => {
    const [manager, bank] = await ethers.getSigners();
    const contracts = await initMineTestContracts({
      manager,
      rewardAmount: REWARD_AMOUNT,
      startBlock: START_BLOCK,
      blockReward: BLOCK_REWARD
    });

    _manager = manager;
    rewardToken = contracts.rewardToken;
    lpToken = contracts.lpToken;
    nft1 = contracts.nft1;
    nft2 = contracts.nft2;
    nft3 = contracts.nft3;
    mine = contracts.mine;
  });

  describe('initialize', () => {
    it('should init the contract correctly', async () => {
      const mineInfo = await mine.mineInfo();

      expect(mineInfo.lpToken).to.equal(lpToken.address);
      expect(mineInfo.rewardToken).to.equal(rewardToken.address);
      expect(mineInfo.startBlock).to.equal(START_BLOCK);
      expect(mineInfo.blockReward).to.equal(BLOCK_REWARD);
      expect(mineInfo.liqRepNFT).to.equal(nft1.address);
      expect(mineInfo.OG5555_25NFT).to.equal(nft2.address);
      expect(mineInfo.OG5555_100NFT).to.equal(nft3.address);
    });
  });

  describe('depositLPTokens', () => {	
    it.only(`should deposit`, async () => {	
      await nft1.mint(_manager.address);
      await nft2.mint(_manager.address);
      await nft3.mint(_manager.address);

      await mine.connect(_manager).depositLPTokens(ethers.utils.parseEther('1'));
    });	
  });
});
