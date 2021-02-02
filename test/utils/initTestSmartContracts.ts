import { ethers, upgrades } from 'hardhat';
import {
  AuctionRestorable,
  AuctionManager,
  BPDRestorable,
  ForeignSwapRestorable,
  NativeSwapRestorable,
  StakingRestorable,
  StakingV1,
  SubBalancesRestorable,
  TERC20,
  TokenRestorable,
  UniswapV2Router02Mock,
} from '../../typechain';
import { ContractFactory } from '../../libs/ContractFactory';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import {
  SECONDS_IN_DAY,
  STAKE_PERIOD,
  ZERO_ADDRESS,
  TEST_SIGNER,
  MAX_CLAIM_AMOUNT,
  TOTAL_SNAPSHOT_AMOUNT,
  TOTAL_SNAPSHOT_ADDRESS,
} from './constants';

interface InitOptions {
  setter: SignerWithAddress;
  recipient: SignerWithAddress;
  fakeAuction?: SignerWithAddress;
  fakeSubBalances?: string;
  fakeStaking?: SignerWithAddress;
  fakeToken?: SignerWithAddress;
  maxClaimAmount?: string;
  testSigner?: string;
  /** If this value is passed Token and SwapToken will be minted to this address */
  lastSessionIdV1?: number;
  bank?: SignerWithAddress;
  basePeriod?: number;
  secondsInDay?: number;
}

interface AxionContracts {
  nativeswap: NativeSwapRestorable;
  bpd: BPDRestorable;
  swaptoken: TERC20;
  foreignswap: ForeignSwapRestorable;
  token: TokenRestorable;
  auction: AuctionRestorable;
  uniswap: UniswapV2Router02Mock;
  subBalances: SubBalancesRestorable;
  staking: StakingRestorable;
  stakingV1: StakingV1;
  auctionManager: AuctionManager;
}

export async function initTestSmartContracts({
  setter,
  recipient,
  fakeAuction,
  fakeSubBalances,
  fakeStaking,
  bank,
  maxClaimAmount,
  testSigner,
  fakeToken,
  basePeriod = STAKE_PERIOD,
  secondsInDay = SECONDS_IN_DAY,
  lastSessionIdV1 = 0,
}: InitOptions): Promise<AxionContracts> {
  /** None proxy */
  const uniswap = await ContractFactory.getUniswapV2Router02MockFactory().then(
    (factory) => factory.deploy()
  );

  let swaptoken;
  if (bank) {
    swaptoken = await ContractFactory.getTERC20Factory().then((factory) =>
      factory
        .connect(bank)
        .deploy(
          '2T Token',
          '2T',
          ethers.utils.parseEther('10000000000'),
          bank.address
        )
    );
  } else {
    swaptoken = await ContractFactory.getTERC20Factory().then((factory) =>
      factory.deploy(
        'Hex3t Token',
        'Hex3t',
        ethers.utils.parseEther('10000000000'),
        setter.address
      )
    );
  }

  /** All contracts init function had manager as first address then migrator as second address */
  /** Proxies */
  const auction = (await upgrades.deployProxy(
    await ContractFactory.getAuctionRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as AuctionRestorable;

  const token = (await upgrades.deployProxy(
    await ContractFactory.getTokenRestorableFactory(),
    [setter.address, setter.address, 'Axion Token', 'AXN'],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as TokenRestorable;

  const nativeswap = (await upgrades.deployProxy(
    await ContractFactory.getNativeSwapRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as NativeSwapRestorable;

  const bpd = (await upgrades.deployProxy(
    await ContractFactory.getBPDRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as BPDRestorable;

  const foreignswap = (await upgrades.deployProxy(
    await ContractFactory.getForeignSwapRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as ForeignSwapRestorable;

  const subBalances = (await upgrades.deployProxy(
    await ContractFactory.getSubBalancesRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as SubBalancesRestorable;

  const staking = (await upgrades.deployProxy(
    await ContractFactory.getStakingRestorableFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as StakingRestorable;

  const usedStakingAddress = fakeStaking
    ? fakeStaking.address
    : staking.address;
  const usedTokenAddress = fakeToken ? fakeToken.address : token.address;
  const usedAuctionAddress = fakeAuction
    ? fakeAuction.address
    : auction.address;
  const usedSubBalancesAddress = fakeSubBalances
    ? fakeSubBalances
    : subBalances.address;

  const auctionManager = (await upgrades.deployProxy(
    await ContractFactory.getAuctionManagerFactory(),
    [setter.address, usedTokenAddress, usedAuctionAddress, bpd.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as AuctionManager;

  const stakingV1 = await (
    await ContractFactory.getStakingV1Factory()
  ).deploy();

  await stakingV1.init(
    usedTokenAddress,
    usedAuctionAddress,
    usedSubBalancesAddress,
    foreignswap.address,
    secondsInDay
  );

  await staking.init(
    usedTokenAddress,
    usedAuctionAddress,
    usedSubBalancesAddress,
    foreignswap.address,
    stakingV1.address,
    secondsInDay,
    lastSessionIdV1
  );

  await staking.setBasePeriod(basePeriod);

  await token.initSwapperAndSwapToken(swaptoken.address, nativeswap.address);

  await token.init(
    [
      nativeswap.address,
      foreignswap.address,
      usedStakingAddress,
      usedAuctionAddress,
      usedSubBalancesAddress,
      bank ? bank.address : '',
      stakingV1.address,
    ].filter(Boolean)
  );

  if (bank) {
    await token
      .connect(bank)
      .mint(bank.address, ethers.utils.parseEther('10000000000'));
  }

  await nativeswap.init(
    basePeriod,
    secondsInDay,
    swaptoken.address,
    usedTokenAddress,
    usedAuctionAddress
  );

  await bpd.init(usedTokenAddress, foreignswap.address, usedSubBalancesAddress);

  await foreignswap.init(
    testSigner ? testSigner : TEST_SIGNER,
    secondsInDay,
    basePeriod,
    maxClaimAmount ? maxClaimAmount : MAX_CLAIM_AMOUNT,
    usedTokenAddress,
    usedAuctionAddress,
    usedStakingAddress,
    bpd.address,
    TOTAL_SNAPSHOT_AMOUNT,
    TOTAL_SNAPSHOT_ADDRESS
  );

  await auction.init(
    secondsInDay,
    usedTokenAddress,
    usedStakingAddress,
    uniswap.address,
    recipient.address,
    nativeswap.address,
    foreignswap.address,
    usedSubBalancesAddress,
    ZERO_ADDRESS
  );

  await subBalances.init(
    usedTokenAddress,
    foreignswap.address,
    bpd.address,
    usedAuctionAddress,
    ZERO_ADDRESS,
    usedStakingAddress,
    secondsInDay,
    basePeriod
  );

  return {
    nativeswap,
    bpd,
    swaptoken,
    foreignswap,
    token,
    auction,
    uniswap,
    subBalances,
    staking,
    stakingV1,
    auctionManager,
  };
}
