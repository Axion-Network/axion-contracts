import { ethers, upgrades } from 'hardhat';
import {
  Auction,
  AuctionManager,
  BPD,
  ForeignSwap,
  NativeSwap,
  Staking,
  StakingV1,
  SubBalances,
  TERC20,
  Token,
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
  // stakingV1?: string;
  lastSessionIdV1?: number;
  bank?: SignerWithAddress;
  basePeriod?: number;
  secondsInDay?: number;
}

interface AxionContracts {
  nativeswap: NativeSwap;
  bpd: BPD;
  swaptoken: TERC20;
  foreignswap: ForeignSwap;
  token: Token;
  auction: Auction;
  uniswap: UniswapV2Router02Mock;
  subBalances: SubBalances;
  staking: Staking;
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
  // stakingV1,
  // lastSessionIdV1,
  basePeriod = STAKE_PERIOD,
  secondsInDay = SECONDS_IN_DAY,
  lastSessionIdV1 = 0
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
    await ContractFactory.getAuctionFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as Auction;

  const token = (await upgrades.deployProxy(
    await ContractFactory.getTokenFactory(),
    [setter.address, setter.address, 'Axion Token', 'AXN'],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as Token;

  const nativeswap = (await upgrades.deployProxy(
    await ContractFactory.getNativeSwapFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as NativeSwap;

  const bpd = (await upgrades.deployProxy(
    await ContractFactory.getBPDFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as BPD;

  const foreignswap = (await upgrades.deployProxy(
    await ContractFactory.getForeignSwapFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as ForeignSwap;

  const subBalances = (await upgrades.deployProxy(
    await ContractFactory.getSubBalancesFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as SubBalances;

  let staking = (await upgrades.deployProxy(
    await ContractFactory.getStakingFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as Staking;

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

  const stakingV1 = await (await ContractFactory.getStakingV1Factory()).deploy();

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
      stakingV1.address
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
