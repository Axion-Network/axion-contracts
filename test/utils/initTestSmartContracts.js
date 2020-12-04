const BN = require('bn.js');
const chai = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
chai.use(require('chai-bn')(BN));

const TERC20 = artifacts.require('TERC20');
const Token = artifacts.require('Token');
const NativeSwap = artifacts.require('NativeSwap');
const Auction = artifacts.require('Auction');
const SubBalances = artifacts.require('SubBalances');
const Staking = artifacts.require('Staking');
const ForeignSwap = artifacts.require('ForeignSwap');
const BPD = artifacts.require('BPD');

const UniswapV2Router02Mock = artifacts.require('UniswapV2Router02Mock');

const DAY = 86400;
const STAKE_PERIOD = 350;

const testSigner_ = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);

const MAX_CLAIM_AMOUNT = new BN(10 ** 7);
const TOTAL_SNAPSHOT_AMOUNT = new BN(10 ** 10);
const TOTAL_SNAPSHOT_ADDRESS = new BN(10);

async function initTestSmartContracts({
  setter,
  recipient,
  auctionAddress,
  subbalancesAddress,
  stakingAddress,
  tokenAddress,
  maxClaimAmount,
  testSigner,
  bank,
}) {
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

  /** Proxies */
  const auction = await deployProxy(Auction, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  const token = await deployProxy(Token, [setter, 'Axion Token', 'AXN'], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  const nativeswap = await deployProxy(NativeSwap, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  const bpd = await deployProxy(BPD, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  const foreignswap = await deployProxy(ForeignSwap, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  const subbalances = await deployProxy(SubBalances, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });
  const staking = await deployProxy(Staking, [setter], {
    unsafeAllowCustomTypes: true,
    unsafeAllowLinkedLibraries: true,
  });

  // ok....
  const usedStakingAddress = stakingAddress ? stakingAddress : staking.address;
  const usedTokenAddress = tokenAddress ? tokenAddress : token.address;
  const usedAuctionAddress = auctionAddress ? auctionAddress : auction.address;
  const usedSubBalancesAddress = subbalancesAddress
    ? subbalancesAddress
    : subbalances.address;

  await staking.init(
    usedTokenAddress,
    usedAuctionAddress,
    usedSubBalancesAddress,
    foreignswap.address,
    new BN(DAY.toString(), 10)
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
    setter,
    usedTokenAddress,
    usedStakingAddress,
    uniswap.address,
    recipient,
    nativeswap.address,
    foreignswap.address,
    usedSubBalancesAddress,
    { from: setter }
  );

  await subbalances.init(
    usedTokenAddress,
    foreignswap.address,
    bpd.address,
    usedAuctionAddress,
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
  };
}

module.exports = initTestSmartContracts;
