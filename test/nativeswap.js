const BN = require('bn.js');
const chai = require('chai');
const { expect } = require('chai');
const initTestSmartContracts = require('./utils/initTestSmartContracts.js');
const helper = require('./utils/utils.js');
chai.use(require('chai-bn')(BN));

const DAY = 86400;

contract('NativeSwap', ([bank, setter, account1, recipient]) => {
  let swaptoken;
  let token;
  let nativeswap;
  let auction;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient, bank });

    swaptoken = contracts.swaptoken;
    token = contracts.token;
    nativeswap = contracts.nativeswap;
    auction = contracts.auction;

    swaptoken.transfer(account1, web3.utils.toWei('100'), { from: bank });
  });

  it('should deposit swap token', async () => {
    await swaptoken.approve(nativeswap.address, web3.utils.toWei('100'), {
      from: account1,
    });

    await nativeswap.deposit(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));
  });

  it('should withdraw swap token', async () => {
    await swaptoken.approve(nativeswap.address, web3.utils.toWei('100'), {
      from: account1,
    });

    await nativeswap.deposit(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));

    await nativeswap.withdraw(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('0'));
  });

  it('should swap tokens', async () => {
    await swaptoken.approve(nativeswap.address, web3.utils.toWei('100'), {
      from: account1,
    });

    await nativeswap.deposit(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));

    await nativeswap.swapNativeToken({ from: account1 });

    const swapTokenBalanceAccount1 = await nativeswap.swapTokenBalanceOf(
      account1
    );

    const tokenBalanceAccount1 = await token.balanceOf(account1);

    const tokenBalanceAuction = await token.balanceOf(auction.address);

    expect(swapTokenBalanceAccount1).to.be.a.bignumber.that.equals(
      web3.utils.toWei('0')
    );

    expect(tokenBalanceAccount1).to.be.a.bignumber.that.equals(
      web3.utils.toWei('100')
    );

    expect(tokenBalanceAuction).to.be.a.bignumber.that.equals(
      web3.utils.toWei('0')
    );
  });

  it('should swap tokens after 175 days', async () => {
    await swaptoken.approve(nativeswap.address, web3.utils.toWei('100'), {
      from: account1,
    });

    await nativeswap.deposit(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));

    // Change node time and swap
    await helper.advanceTimeAndBlock(DAY * 175);
    await nativeswap.swapNativeToken({ from: account1 });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('0'));

    expect(await token.balanceOf(account1)).to.be.a.bignumber.that.equals(
      web3.utils.toWei('50')
    );

    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('50'));
  });

  it('should swap tokens after 350 days', async () => {
    await swaptoken.approve(nativeswap.address, web3.utils.toWei('100'), {
      from: account1,
    });

    await nativeswap.deposit(web3.utils.toWei('100'), {
      from: account1,
    });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));

    // Change node time and swap
    await helper.advanceTimeAndBlock(DAY * 350);
    await nativeswap.swapNativeToken({ from: account1 });

    expect(
      await nativeswap.swapTokenBalanceOf(account1)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('0'));

    expect(await token.balanceOf(account1)).to.be.a.bignumber.that.equals(
      web3.utils.toWei('0')
    );

    expect(
      await token.balanceOf(auction.address)
    ).to.be.a.bignumber.that.equals(web3.utils.toWei('100'));
  });
});
