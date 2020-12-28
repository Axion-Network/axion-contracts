import BN from 'bn.js';
import chai from 'chai';
import { deployProxy } from '@openzeppelin/truffle-upgrades';
import {
  AuctionInstance,
  AuctionManagerInstance,
  BPDInstance,
  ForeignSwapInstance,
  NativeSwapInstance,
  StakingInstance,
  SubBalancesInstance,
  TERC20Instance,
  TokenInstance,
  UniswapV2Router02MockInstance,
} from '../../types/truffle-contracts';

chai.use(require('chai-bn')(BN));

const TERC20 = artifacts.require('TERC20');
const Token = artifacts.require('Token');
const NativeSwap = artifacts.require('NativeSwap');
const Auction = artifacts.require('Auction');
const SubBalances = artifacts.require('SubBalances');
const Staking = artifacts.require('Staking');
const ForeignSwap = artifacts.require('ForeignSwap');
const BPD = artifacts.require('BPD');
const AuctionManager = artifacts.require('AuctionManager');

const UniswapV2Router02Mock = artifacts.require('UniswapV2Router02Mock');

const DAY = 86400;
const STAKE_PERIOD = 350;

const V1Contracts = '0x0000000000000000000000000000000000000000';
const testSigner_ = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);

const MAX_CLAIM_AMOUNT = new BN(10 ** 7);
const TOTAL_SNAPSHOT_AMOUNT = new BN(10 ** 10);
const TOTAL_SNAPSHOT_ADDRESS = new BN(10);

interface InitAddresses {
  setter: string;
  recipient: string;
  auctionAddress?: string;
  subbalancesAddress?: string;
  stakingAddress?: string;
  tokenAddress?: string;
  maxClaimAmount?: string;
  testSigner?: string;
  bank?: string;
}

interface AxionContracts {
  nativeswap: NativeSwapInstance;
  bpd: BPDInstance;
  swaptoken: TERC20Instance;
  foreignswap: ForeignSwapInstance;
  token: TokenInstance;
  auction: AuctionInstance;
  uniswap: UniswapV2Router02MockInstance;
  subbalances: SubBalancesInstance;
  staking: StakingInstance;
  auctionManager: AuctionManagerInstance;
}

export async function initTestSmartContracts({
  setter,
  recipient,
  auctionAddress,
  subbalancesAddress,
  stakingAddress,
  tokenAddress,
  maxClaimAmount,
  testSigner,
  bank,
}: InitAddresses): Promise<AxionContracts> {
  /** None proxy */
  const uniswap = await UniswapV2Router02Mock.new();

  let swaptoken;
  if (bank) {
    swaptoken = await TERC20.new(
      '2T Token',
      '2T',
      web3.utils.toWei('1000'),
      bank,
      {
        from: bank,
      }
    );
  } else {
    swaptoken = await TERC20.new(
      'Hex3t Token',
      'Hex3t',
      web3.utils.toWei('10000000000'),
      setter
    );
  }

  /** All contracts init function had manager as first address then migrator as second address */
  /** Proxies */
  const auction = (await deployProxy(Auction as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as AuctionInstance;

  const token = (await deployProxy(
    Token as any,
    [setter, setter, 'Axion Token', 'AXN'],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as TokenInstance;

  const nativeswap = (await deployProxy(NativeSwap as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as NativeSwapInstance;

  const bpd = (await deployProxy(BPD as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as BPDInstance;

  const foreignswap = (await deployProxy(ForeignSwap as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as ForeignSwapInstance;

  const subbalances = (await deployProxy(SubBalances as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as SubBalancesInstance;

  const staking = (await deployProxy(Staking as any, [setter, setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  })) as StakingInstance;

  // ok....
  const usedStakingAddress = stakingAddress ? stakingAddress : staking.address;
  const usedTokenAddress = tokenAddress ? tokenAddress : token.address;
  const usedAuctionAddress = auctionAddress ? auctionAddress : auction.address;
  const usedSubBalancesAddress = subbalancesAddress
    ? subbalancesAddress
    : subbalances.address;

  const auctionManager = (await deployProxy(
    AuctionManager as any,
    [setter, usedTokenAddress, usedAuctionAddress, bpd.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as AuctionManagerInstance;

  await staking.init(
    usedTokenAddress,
    usedAuctionAddress,
    usedSubBalancesAddress,
    foreignswap.address,
    V1Contracts,
    new BN(DAY.toString(), 10),
    { from: setter }
  );

  await token.initSwapperAndSwapToken(swaptoken.address, nativeswap.address, {
    from: setter,
  });

  await token.init(
    [
      nativeswap.address,
      foreignswap.address,
      usedStakingAddress,
      usedAuctionAddress,
      usedSubBalancesAddress,
    ],
    { from: setter }
  );

  await nativeswap.init(
    new BN(STAKE_PERIOD.toString(), 10),
    new BN(DAY.toString(), 10),
    swaptoken.address,
    usedTokenAddress,
    usedAuctionAddress,
    { from: setter }
  );

  await bpd.init(
    usedTokenAddress,
    foreignswap.address,
    usedSubBalancesAddress,
    {
      from: setter,
    }
  );

  await foreignswap.init(
    testSigner ? testSigner : testSigner_,
    new BN(DAY.toString(), 10),
    new BN(STAKE_PERIOD.toString(), 10),
    maxClaimAmount ? maxClaimAmount : MAX_CLAIM_AMOUNT,
    usedTokenAddress,
    usedAuctionAddress,
    usedStakingAddress,
    bpd.address,
    TOTAL_SNAPSHOT_AMOUNT,
    TOTAL_SNAPSHOT_ADDRESS,
    { from: setter }
  );

  await auction.init(
    new BN(DAY.toString(), 10),
    usedTokenAddress,
    usedStakingAddress,
    uniswap.address,
    recipient,
    nativeswap.address,
    foreignswap.address,
    usedSubBalancesAddress,
    V1Contracts,
    { from: setter }
  );

  await subbalances.init(
    usedTokenAddress,
    foreignswap.address,
    bpd.address,
    usedAuctionAddress,
    V1Contracts,
    usedStakingAddress,
    new BN(DAY.toString(), 10),
    new BN(STAKE_PERIOD.toString(), 10),
    { from: setter }
  );

  return {
    nativeswap,
    bpd,
    swaptoken,
    foreignswap,
    token,
    auction,
    uniswap,
    subbalances,
    staking,
    auctionManager,
  };
}
