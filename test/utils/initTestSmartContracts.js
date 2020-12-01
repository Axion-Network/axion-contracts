const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const TERC20 = artifacts.require('TERC20');
const Token = artifacts.require('Token');
const NativeSwap = artifacts.require('NativeSwap');
const Auction = artifacts.require('Auction');
const SubBalances = artifacts.require('SubBalances');
const StakingMock = artifacts.require('StakingMock');
const ForeignSwap = artifacts.require('ForeignSwap');
const BPD = artifacts.require('BPD');

const UniswapV2Router02Mock = artifacts.require('UniswapV2Router02Mock');

const DAY = 86400;
const STAKE_PERIOD = 350;

const testSigner = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);

const MAX_CLAIM_AMOUNT = new BN(10 ** 7);
const TOTAL_SNAPSHOT_AMOUNT = new BN(10 ** 10);
const TOTAL_SNAPSHOT_ADDRESS = new BN(10);

async function initTestSmartContracts(setter, recipient, stakingAddress) {
  const nativeswap = await NativeSwap.new();

  const bpd = await BPD.new(setter);

  const swaptoken = await TERC20.new(
    '2T Token',
    '2T',
    web3.utils.toWei('10000000000'),
    setter
  );

  const foreignswap = await ForeignSwap.new(setter);

  const token = await Token.new(
    '2X Token',
    '2X',
    swaptoken.address,
    nativeswap.address,
    setter
  );

  const auction = await Auction.new();

  const uniswap = await UniswapV2Router02Mock.new();

  const subbalances = await SubBalances.new(setter);

  const staking = await StakingMock.new();

  const usedStakingAddress = stakingAddress ? stakingAddress : staking.address;

  await token.init([
    nativeswap.address,
    foreignswap.address,
    usedStakingAddress,
    auction.address,
    subbalances.address,
  ]);

  await nativeswap.init(
    new BN(STAKE_PERIOD.toString(), 10),
    new BN(DAY.toString(), 10),
    swaptoken.address,
    token.address,
    auction.address
  );

  await bpd.init(token.address, foreignswap.address, subbalances.address);

  await foreignswap.init(
    testSigner,
    new BN(DAY.toString(), 10),
    new BN(STAKE_PERIOD.toString(), 10),
    MAX_CLAIM_AMOUNT,
    token.address,
    auction.address,
    usedStakingAddress,
    bpd.address,
    TOTAL_SNAPSHOT_AMOUNT,
    TOTAL_SNAPSHOT_ADDRESS,
    { from: setter }
  );

  await auction.init(
    new BN(DAY.toString(), 10),
    setter,
    token.address,
    usedStakingAddress,
    uniswap.address,
    recipient,
    nativeswap.address,
    foreignswap.address,
    subbalances.address
  );

  await subbalances.init(
    token.address,
    foreignswap.address,
    bpd.address,
    auction.address,
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
