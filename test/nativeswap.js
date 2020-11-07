const BN = require("bn.js");
const chai = require("chai");
const { expect } = require("chai");
const helper = require("./utils/utils.js");
chai.use(require("chai-bn")(BN));

const TERC20 = artifacts.require("TERC20");
const Token = artifacts.require("Token");
const NativeSwap = artifacts.require("NativeSwap");
const AuctionMock = artifacts.require("AuctionMock");

const DAY = 86400;
const STAKE_PERIOD = 350;

contract(
  "NativeSwap",
  ([
    bank,
    setter,
    foreignSwap,
    weeklyAuction,
    staking,
    bigPayDay,
    account1,
  ]) => {
    let swaptoken;
    let token;
    let nativeswap;
    let dailyauction;

    beforeEach(async () => {
      swaptoken = await TERC20.new(
        "2T Token",
        "2T",
        web3.utils.toWei("1000"),
        bank
      );

      // Deploy and init native swap
      nativeswap = await NativeSwap.new();

      token = await Token.new("2X Token", "2X", swaptoken.address, nativeswap.address, setter);

      await swaptoken.transfer(account1, web3.utils.toWei("100"), { from: bank });

      dailyauction = await AuctionMock.new();

      await nativeswap.init(
        new BN(STAKE_PERIOD.toString(), 10),
        new BN(DAY.toString(), 10),
        swaptoken.address,
        token.address,
        dailyauction.address
      );

      // Init token
      await token.init(
        [
          nativeswap.address,
          foreignSwap,
          dailyauction.address,
          weeklyAuction,
          staking
        ],
        { from: setter }
      );
    });

    it("should deposit swap token", async () => {
      await swaptoken.approve(nativeswap.address, web3.utils.toWei("100"), {
        from: account1,
      });

      await nativeswap.deposit(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));
    });

    it("should withdraw swap token", async () => {
      await swaptoken.approve(nativeswap.address, web3.utils.toWei("100"), {
        from: account1,
      });

      await nativeswap.deposit(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));

      await nativeswap.withdraw(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("0"));
    });

    it("should swap tokens", async () => {
      await swaptoken.approve(nativeswap.address, web3.utils.toWei("100"), {
        from: account1,
      });

      await nativeswap.deposit(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));

      await nativeswap.swapNativeToken({ from: account1 });

      const swapTokenBalanceAccount1 = await nativeswap.swapTokenBalanceOf(
        account1
      );

      const tokenBalanceAccount1 = await token.balanceOf(account1);

      const tokenBalanceDailyAuction = await token.balanceOf(
        dailyauction.address
      );

      expect(swapTokenBalanceAccount1).to.be.a.bignumber.that.equals(
        web3.utils.toWei("0")
      );

      expect(tokenBalanceAccount1).to.be.a.bignumber.that.equals(
        web3.utils.toWei("100")
      );

      expect(tokenBalanceDailyAuction).to.be.a.bignumber.that.equals(
        web3.utils.toWei("0")
      );
    });

    it("should swap tokens after 175 days", async () => {
      await swaptoken.approve(nativeswap.address, web3.utils.toWei("100"), {
        from: account1,
      });

      await nativeswap.deposit(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));

      // Change node time and swap
      await helper.advanceTimeAndBlock(DAY * 175);
      await nativeswap.swapNativeToken({ from: account1 });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("0"));

      expect(await token.balanceOf(account1)).to.be.a.bignumber.that.equals(
        web3.utils.toWei("50")
      );

      expect(
        await token.balanceOf(dailyauction.address)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("50"));
    });

    it("should swap tokens after 350 days", async () => {
      await swaptoken.approve(nativeswap.address, web3.utils.toWei("100"), {
        from: account1,
      });

      await nativeswap.deposit(web3.utils.toWei("100"), {
        from: account1,
      });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));

      // Change node time and swap
      await helper.advanceTimeAndBlock(DAY * 350);
      await nativeswap.swapNativeToken({ from: account1 });

      expect(
        await nativeswap.swapTokenBalanceOf(account1)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("0"));

      expect(await token.balanceOf(account1)).to.be.a.bignumber.that.equals(
        web3.utils.toWei("0")
      );

      expect(
        await token.balanceOf(dailyauction.address)
      ).to.be.a.bignumber.that.equals(web3.utils.toWei("100"));
    });
  }
);
