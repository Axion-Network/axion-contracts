import { ethers, upgrades } from 'hardhat';
import { BigNumber } from 'ethers';
import {
  Auction,
  AuctionManager,
  BPD,
  ForeignSwap,
  NativeSwap,
  Staking,
  SubBalances,
  TERC20,
  Token,
  UniswapV2Router02Mock,
} from '../../typechain';
import { ContractFactory } from '../../libs/ContractFactory';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const DAY = 86400;
const STAKE_PERIOD = 350;

const V1Contracts = '0x0000000000000000000000000000000000000000';
const TEST_SIGNER = ethers.utils.getAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);

const MAX_CLAIM_AMOUNT = BigNumber.from(10 ** 7);
const TOTAL_SNAPSHOT_AMOUNT = BigNumber.from(10 ** 10);
const TOTAL_SNAPSHOT_ADDRESS = BigNumber.from(10);

interface InitAddresses {
  setter: SignerWithAddress;
  recipient: SignerWithAddress;
  fakeAuction?: SignerWithAddress;
  fakeSubBalances?: SignerWithAddress;
  fakeStaking?: SignerWithAddress;
  fakeToken?: SignerWithAddress;
  maxClaimAmount?: string;
  testSigner?: string;
  /** If this value is passed Token and SwapToken will be minted to this address */
  fakeBank?: SignerWithAddress;
}

interface AxionContracts {
  nativeswap: NativeSwap;
  bpd: BPD;
  swaptoken: TERC20;
  foreignswap: ForeignSwap;
  token: Token;
  auction: Auction;
  uniswap: UniswapV2Router02Mock;
  subbalances: SubBalances;
  staking: Staking;
  auctionManager: AuctionManager;
}

export async function initTestSmartContracts({
  setter,
  recipient,
  fakeAuction,
  fakeSubBalances,
  fakeStaking,
  fakeBank,
  maxClaimAmount,
  testSigner,
  fakeToken,
}: InitAddresses): Promise<AxionContracts> {

  /** None proxy */
  const uniswap = await ContractFactory.getUniswapV2Router02MockFactory().then(
    (factory) => factory.deploy()
  );

  let swaptoken;
  if (fakeBank) {
    swaptoken = await ContractFactory.getTERC20Factory().then((factory) =>
      factory
        .connect(fakeBank)
        .deploy(
          '2T Token',
          '2T',
          ethers.utils.parseEther('10000000000'),
          fakeBank.address
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

  const subbalances = (await upgrades.deployProxy(
    await ContractFactory.getSubBalancesFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as SubBalances;

  const staking = (await upgrades.deployProxy(
    await ContractFactory.getStakingFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as Staking;

  // ok....
  const usedStakingAddress = fakeStaking
    ? fakeStaking.address
    : staking.address;
  const usedTokenAddress = fakeToken ? fakeToken.address : token.address;
  const usedAuctionAddress = fakeAuction
    ? fakeAuction.address
    : auction.address;
  const usedSubBalancesAddress = fakeSubBalances
    ? fakeSubBalances.address
    : subbalances.address;

  const auctionManager = (await upgrades.deployProxy(
    await ContractFactory.getAuctionManagerFactory(),
    [setter.address, usedTokenAddress, usedAuctionAddress, bpd.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as AuctionManager;

  await staking.init(
    usedTokenAddress,
    usedAuctionAddress,
    usedSubBalancesAddress,
    foreignswap.address,
    V1Contracts,
    '10'
  );

  await token.initSwapperAndSwapToken(swaptoken.address, nativeswap.address);

  await token.init(
    [
      nativeswap.address,
      foreignswap.address,
      usedStakingAddress,
      usedAuctionAddress,
      usedSubBalancesAddress,
      fakeBank ? fakeBank.address : '',
    ].filter(Boolean)
  );

  if (fakeBank) {
    await token
      .connect(fakeBank)
      .mint(fakeBank.address, ethers.utils.parseEther('10000000000'));
  }

  await nativeswap.init(
    STAKE_PERIOD,
    DAY,
    swaptoken.address,
    usedTokenAddress,
    usedAuctionAddress
  );

  await bpd.init(usedTokenAddress, foreignswap.address, usedSubBalancesAddress);

  await foreignswap.init(
    testSigner ? testSigner : TEST_SIGNER,
    DAY,
    STAKE_PERIOD,
    maxClaimAmount ? maxClaimAmount : MAX_CLAIM_AMOUNT,
    usedTokenAddress,
    usedAuctionAddress,
    usedStakingAddress,
    bpd.address,
    TOTAL_SNAPSHOT_AMOUNT,
    TOTAL_SNAPSHOT_ADDRESS
  );

  await auction.init(
    DAY,
    usedTokenAddress,
    usedStakingAddress,
    uniswap.address,
    recipient.address,
    nativeswap.address,
    foreignswap.address,
    usedSubBalancesAddress,
    V1Contracts
  );

  await subbalances.init(
    usedTokenAddress,
    foreignswap.address,
    bpd.address,
    usedAuctionAddress,
    V1Contracts,
    usedStakingAddress,
    DAY,
    STAKE_PERIOD
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
