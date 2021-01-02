import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

export const DAY = 86400;
export const STAKE_PERIOD = 350;
export const SECONDS_IN_DAY = 86400;
export const MILLISECONDS_IN_A_SECOND = 1000;

export const V1Contracts = '0x0000000000000000000000000000000000000000';
export const TEST_SIGNER = ethers.utils.getAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);

export const MAX_CLAIM_AMOUNT = BigNumber.from(10 ** 7);
export const TOTAL_SNAPSHOT_AMOUNT = BigNumber.from(10 ** 10);
export const TOTAL_SNAPSHOT_ADDRESS = BigNumber.from(10);
