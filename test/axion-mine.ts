import { initMineTestContracts } from './utils/initMineTestContracts';
import { ROLES } from './../constants/roles';
import { ethers } from 'hardhat';c
import { BigNumber } from 'ethers';
import { expect } from 'chai';
import {
  AxionMine,
  TERC20,
  TERC721,
} from '../typechain';
import { TestUtil } from './utils/TestUtil';
import { ContractFactory } from '../libs/ContractFactory';

import { SECONDS_IN_DAY, AUCTIONSTAKE_MIN } from './utils/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

/** Helper Vars */
const DEADLINE = ethers.utils.parseEther('10000000');
const REWARD_AMOUNT = ethers.utils.parseEther('10000000');
const BLOCK_REWARD = ethers.utils.parseEther('1');
const START_BLOCK = 1;

describe('Axion Mine', () => {
  let _manager: SignerWithAddress;
  let _bank: SignerWithAddress;
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
      bank,
      rewardAmount: REWARD_AMOUNT,
      startBlock: START_BLOCK,
      blockReward: BLOCK_REWARD
    });

    _manager = manager;
    _bank = bank;
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

      expect(mineInfo.lpToken).to.equal(lpToken);
      expect(mineInfo.rewardToken).to.equal(lpToken);
      expect(mineInfo.startBlock).to.equal(lpToken);
      expect(mineInfo.blockReward).to.equal(BLOCK_REWARD);
      expect(mineInfo.liqRepNFT).to.equal(nft1);
      expect(mineInfo.OG5555_25NFT).to.equal(nft2);
      expect(mineInfo.OG5555_100NFT).to.equal(nft3);
    });
  });

  describe('depositLPTokens', () => {	
    it(`should deposit`, async () => {	
      
    });	
  });
});
