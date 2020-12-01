const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
const expectRevert = require('./utils/expectRevert.js');
chai.use(require('chai-bn')(BN));
const EthCrypto = require('eth-crypto');

const TERC20 = artifacts.require('TERC20');
const Token = artifacts.require('Token');
const ForeignSwap = artifacts.require('ForeignSwap');
const AuctionMock = artifacts.require('AuctionMock');
const StakingMock = artifacts.require('StakingMock');
const BPD = artifacts.require('BPD');
const totalSnapshotAmount = new BN(10 ** 10);
const totalSnapshotAddresses = new BN(10);

const DAY = 86400;
const STAKE_PERIOD = 350;

const testSigner = web3.utils.toChecksumAddress(
  '0xCC64d26Dab6c7B971d26846A4B2132985fe8C358'
);
const testSignerPriv =
  'eaac3bee2ca2316bc2dad3f2efcc91c17cee394d45cebc8529bfa250061dac89';

const getMessageHash = (encodeTypes, args) => {
  let encoded = web3.eth.abi.encodeParameters(encodeTypes, args);
  return web3.utils.soliditySha3(encoded);
};

const sign = (address, pkey, messageParamsTypes, messageParams) => {
  const messageHash = getMessageHash(messageParamsTypes, messageParams);

  return EthCrypto.sign(pkey, messageHash);
};

contract(
  'BigPayDay',
  ([bank, setter, signer, nativeSwap, subbalances, account1, account2]) => {
    let swaptoken;
    let token;
    let foreignswap;
    let auction;
    let staking;
    let bpd;
    let signAmount;
    let testSignature;
    let maxClaimAmount;

    beforeEach(async () => {
      maxClaimAmount = new BN(10 ** 7);
      signAmount = maxClaimAmount;
      testSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [signAmount.toString(), account1]
      );

      swaptoken = await TERC20.new(
        '2T Token',
        '2T',
        web3.utils.toWei('1000'),
        bank,
        { from: bank }
      );
      token = await Token.new(
        '2X Token',
        '2X',
        swaptoken.address,
        setter,
        setter
      );

      auction = await AuctionMock.new();
      staking = await StakingMock.new();

      // Deploy BigPayDay Pool
      bpd = await BPD.new(setter);

      // Deploy and init native swap
      foreignswap = await ForeignSwap.new(setter);

      // Init token
      token.init(
        [
          nativeSwap,
          foreignswap.address,
          auction.address,
          staking.address,
          subbalances,
        ],
        { from: setter }
      );

      foreignswap.init(
        testSigner,
        new BN(DAY.toString(), 10),
        new BN(STAKE_PERIOD.toString(), 10),
        maxClaimAmount,
        token.address,
        auction.address,
        staking.address,
        bpd.address,
        totalSnapshotAmount,
        totalSnapshotAddresses,
        { from: setter }
      );

      // Init BPD Pool
      bpd.init(token.address, foreignswap.address, subbalances, {
        from: setter,
      });
    });

    it('should not receiving amounts if no penalty', async () => {
      await foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      });

      // expect(
      //     await token.balanceOf(account1)
      // ).to.be.a.bignumber.that.equals(signAmount);

      expect(await token.balanceOf(auction.address)).to.be.a.bignumber.zero;
      expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.zero;
    });

    it('should receive penalty amount on 175 day', async () => {
      await foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      });
      // expect(
      //     await token.balanceOf(account1)
      // ).to.be.a.bignumber.that.equals(signAmount);

      // Change node time and swap
      await helper.advanceTimeAndBlock(DAY * 175);

      // generate second signature
      const secondSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [signAmount.toString(), account2]
      );

      await foreignswap.claimFromForeign(signAmount, secondSignature, {
        from: account2,
      });

      const dividedAmount = signAmount.div(new BN('2'));
      // expect(
      //     await token.balanceOf(account2)
      // ).to.be.a.bignumber.that.equals(dividedAmount);

      const dividedAmountPart = dividedAmount.div(new BN('350'));
      expect(
        await token.balanceOf(auction.address)
      ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN('349')));
      expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.that.equals(
        dividedAmountPart
      );

      const bpdAmountPercent = dividedAmountPart.div(new BN('100'));

      const currentPoolAmounts = await bpd.getPoolYearAmounts();
      expect(currentPoolAmounts[0]).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('10'))
      );
      expect(currentPoolAmounts[1]).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('15'))
      );
      expect(currentPoolAmounts[2]).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('20'))
      );
      expect(currentPoolAmounts[3]).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('25'))
      );
      expect(currentPoolAmounts[4]).to.be.a.bignumber.that.above(
        bpdAmountPercent.mul(new BN('30'))
      );
      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('10'))
      );
    });

    it('should transfer year amount', async () => {
      await foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      });
      // expect(
      //     await token.balanceOf(account1)
      // ).to.be.a.bignumber.that.equals(signAmount);

      // Change node time and swap
      await helper.advanceTimeAndBlock(DAY * 175);

      // generate second signature
      const secondSignature = sign(
        testSigner,
        testSignerPriv,
        ['uint256', 'address'],
        [signAmount.toString(), account2]
      );

      await foreignswap.claimFromForeign(signAmount, secondSignature, {
        from: account2,
      });

      const dividedAmount = signAmount.div(new BN('2'));
      // expect(
      //     await token.balanceOf(account2)
      // ).to.be.a.bignumber.that.equals(dividedAmount);

      const dividedAmountPart = dividedAmount.div(new BN('350'));
      expect(
        await token.balanceOf(auction.address)
      ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN('349')));
      expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.that.equals(
        dividedAmountPart
      );

      const bpdAmountPercent = dividedAmountPart.div(new BN('100'));

      const currentPoolAmounts = await bpd.getPoolYearAmounts();
      const firstYearBalance = bpdAmountPercent.mul(new BN('10'));
      const secondYearBalance = bpdAmountPercent.mul(new BN('15'));
      const thirdYearBalance = bpdAmountPercent.mul(new BN('20'));
      const fourthYearBalance = bpdAmountPercent.mul(new BN('25'));
      const fifthYearBalance = bpdAmountPercent.mul(new BN('30'));

      expect(currentPoolAmounts[0]).to.be.a.bignumber.that.equals(
        firstYearBalance
      );
      expect(currentPoolAmounts[1]).to.be.a.bignumber.that.equals(
        secondYearBalance
      );
      expect(currentPoolAmounts[2]).to.be.a.bignumber.that.equals(
        thirdYearBalance
      );
      expect(currentPoolAmounts[3]).to.be.a.bignumber.that.equals(
        fourthYearBalance
      );
      expect(currentPoolAmounts[4]).to.be.a.bignumber.that.above(
        fifthYearBalance
      );

      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('10'))
      );

      await bpd.transferYearlyPool(new BN('0'), { from: subbalances });

      expect(await token.balanceOf(subbalances)).to.be.a.bignumber.that.equals(
        firstYearBalance
      );

      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('15'))
      );

      await bpd.transferYearlyPool(new BN('1'), { from: subbalances });

      const secondAmount = firstYearBalance.add(secondYearBalance);
      expect(await token.balanceOf(subbalances)).to.be.a.bignumber.that.equals(
        secondAmount
      );
      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('20'))
      );

      await bpd.transferYearlyPool(new BN('2'), { from: subbalances });

      const thirdAmount = secondAmount.add(thirdYearBalance);
      expect(await token.balanceOf(subbalances)).to.be.a.bignumber.that.equals(
        thirdAmount
      );

      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('25'))
      );

      await bpd.transferYearlyPool(new BN('3'), { from: subbalances });

      const fourthAmount = thirdAmount.add(fourthYearBalance);
      expect(await token.balanceOf(subbalances)).to.be.a.bignumber.that.equals(
        fourthAmount
      );

      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.above(
        bpdAmountPercent.mul(new BN('30'))
      );

      await bpd.transferYearlyPool(new BN('4'), { from: subbalances });

      const fifthAmount = fourthAmount.add(fifthYearBalance);
      expect(await token.balanceOf(subbalances)).to.be.a.bignumber.that.above(
        fifthAmount
      );

      expect(await bpd.getClosestPoolAmount()).to.be.a.bignumber.that.equals(
        bpdAmountPercent.mul(new BN('0'))
      );
    });
  }
);
