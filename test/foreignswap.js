const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const helper = require('./utils/utils.js');
const expectRevert = require('./utils/expectRevert.js');
chai.use(require('chai-bn')(BN));
const EthCrypto = require('eth-crypto');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');

const DAY = 86400;

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

contract('ForeignSwap', ([setter, account1, account2, recipient]) => {
  let swaptoken;
  let foreignswap;
  let token;
  let auction;
  let staking;
  let bpd;
  let nativeswap;
  let uniswap;
  let subbalances;

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

    const contracts = await initTestSmartContracts({ setter, recipient });
    swaptoken = contracts.swaptoken;
    foreignswap = contracts.foreignswap;
    token = contracts.token;
    nativeswap = contracts.nativeswap;
    auction = contracts.auction;
    uniswap = contracts.uniswap;
    subbalances = contracts.subbalances;
    staking = contracts.staking;
    bpd = contracts.bpd;
  });

  it('should check signature and return true', async () => {
    const checkResult = await foreignswap.check(signAmount, testSignature, {
      from: account1,
    });
    expect(checkResult).to.be.true;
  });

  it('should return claim amount for user', async () => {
    const answer = await foreignswap.getUserClaimableAmountFor(signAmount);
    const claimableAmount = answer[0];
    expect(claimableAmount).to.be.a.bignumber.that.equals(signAmount);
  });

  it('should claim tokens', async () => {
    expect(await foreignswap.getCurrentClaimedAmount()).to.be.a.bignumber.zero;

    expect(await foreignswap.getCurrentClaimedAddresses()).to.be.a.bignumber
      .zero;

    await foreignswap.claimFromForeign(signAmount, testSignature, {
      from: account1,
    });
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(signAmount);

    expect(
      await foreignswap.getCurrentClaimedAmount()
    ).to.be.a.bignumber.that.equals(signAmount);

    expect(
      await foreignswap.getCurrentClaimedAddresses()
    ).to.be.a.bignumber.that.equals(new BN('1'));
  });

  it('should claim tokens after 175 days', async () => {
    const amountBefore = await foreignswap.getUserClaimableAmountFor(
      signAmount
    );

    await helper.advanceTimeAndBlock(DAY * 175);

    const amountAfter = await foreignswap.getUserClaimableAmountFor(signAmount);

    expect(amountAfter[0]).to.be.a.bignumber.that.equals(
      amountBefore[0].div(new BN('2'))
    );

    await foreignswap.claimFromForeign(signAmount, testSignature, {
      from: account1,
    });

    const dividedAmount = signAmount.div(new BN('2'));
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(dividedAmount);

    const dividedAmountPart = dividedAmount.div(new BN('350'));
    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN('349')));
    expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.that.equals(
      dividedAmountPart
    );
  });

  it('should claim tokens after 350 days', async () => {
    await foreignswap.claimFromForeign(signAmount, testSignature, {
      from: account1,
    });
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(signAmount);

    // Change node time and swap
    await helper.advanceTimeAndBlock(DAY * 350);

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

    expect(await token.balanceOf(account2)).to.be.a.bignumber.zero;

    const dividedAmountPart = signAmount.div(new BN('350'));
    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN('349')));
    expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.that.equals(
      dividedAmountPart
    );
  });

  it('should claim tokens after 351 days', async () => {
    await foreignswap.claimFromForeign(signAmount, testSignature, {
      from: account1,
    });
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(signAmount);

    // Change node time and swap
    await helper.advanceTimeAndBlock(DAY * 360);

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

    expect(await token.balanceOf(account2)).to.be.a.bignumber.zero;

    const dividedAmountPart = signAmount.div(new BN('350'));
    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(dividedAmountPart.mul(new BN('349')));
    expect(await token.balanceOf(bpd.address)).to.be.a.bignumber.that.equals(
      dividedAmountPart
    );
  });

  it('should send to weekly auction if claim amount more than max', async () => {
    const highClaimAmount = signAmount.mul(new BN('10'));
    const highAmountSignature = sign(
      testSigner,
      testSignerPriv,
      ['uint256', 'address'],
      [highClaimAmount.toString(), account1]
    );
    await foreignswap.claimFromForeign(highClaimAmount, highAmountSignature, {
      from: account1,
    });
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(maxClaimAmount);
    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(highClaimAmount.sub(maxClaimAmount));
  });

  it('should not claim twice from one address', async () => {
    await foreignswap.claimFromForeign(signAmount, testSignature, {
      from: account1,
    });
    // expect(
    //     await token.balanceOf(account1)
    // ).to.be.a.bignumber.that.equals(signAmount);

    await helper.advanceTimeAndBlock(DAY);
    await expectRevert(
      foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account1,
      }),
      'CLAIM: cannot claim twice'
    );
  });

  it('should not claim from wrong address', async () => {
    await expectRevert(
      foreignswap.claimFromForeign(signAmount, testSignature, {
        from: account2,
      }),
      'CLAIM: cannot claim because signature is not correct'
    );
  });

  it('should not claim with wrong amount', async () => {
    const wrongAmount = signAmount.add(new BN('1'));
    await expectRevert(
      foreignswap.claimFromForeign(wrongAmount, testSignature, {
        from: account2,
      }),
      'CLAIM: cannot claim because signature is not correct'
    );
  });

  it('should not claim with zero amount', async () => {
    const wrongAmount = new BN('0');
    await expectRevert(
      foreignswap.claimFromForeign(wrongAmount, testSignature, {
        from: account1,
      }),
      'CLAIM: amount <= 0'
    );
  });
});
