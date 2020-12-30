import { ethers } from 'hardhat';

import {
  Auction,
  Auction__factory,
  Auction20201219,
  Auction20201219__factory,
  AuctionManager,
  AuctionManager__factory,
  BPD,
  BPD__factory,
  ForeignSwap,
  ForeignSwap__factory,
  NativeSwap,
  NativeSwap__factory,
  Staking,
  Staking__factory,
  SubBalances,
  SubBalances__factory, TERC20__factory,
  Token,
  Token__factory,
  UniswapV2Router02Mock__factory,
} from '../typechain';

enum AxionContract {
  Auction = 'Auction',
  Auction20201219 = 'Auction20201219',
  AuctionManager = 'AuctionManager',
  BPD = 'BPD',
  ForeignSwap = 'ForeignSwap',
  NativeSwap = 'NativeSwap',
  Staking = 'Staking',
  SubBalances = 'SubBalances',
  Token = 'Token',
  UniswapV2Router02Mock = 'UniswapV2Router02Mock',
  TERC20 = 'TERC20'
}

export class ContractFactory {
  // Auction
  static getAuctionFactory(): Promise<Auction__factory> {
    return ethers.getContractFactory(AxionContract.Auction) as Promise<Auction__factory>;
  }

  static getAuctionAt(address: string): Promise<Auction> {
    return ethers.getContractAt(AxionContract.Auction, address) as Promise<Auction>;
  }

  // Auction20201219
  static getAuction20201219Factory(): Promise<Auction20201219__factory> {
    return ethers.getContractFactory(AxionContract.Auction20201219) as Promise<Auction20201219__factory>;
  }

  static getAuction20201219At(address: string): Promise<Auction20201219> {
    return ethers.getContractAt(AxionContract.Auction20201219, address) as Promise<Auction20201219>;
  }

  // Auction Manager
  static getAuctionManagerFactory(): Promise<AuctionManager__factory> {
    return ethers.getContractFactory(AxionContract.AuctionManager) as Promise<AuctionManager__factory>;
  }

  static getAuctionManagerAt(address: string): Promise<AuctionManager> {
    return ethers.getContractAt(AxionContract.AuctionManager, address) as Promise<AuctionManager>;
  }

  // BPD
  static getBPDFactory(): Promise<BPD__factory> {
    return ethers.getContractFactory(AxionContract.BPD) as Promise<BPD__factory>;
  }

  static getBPDAt(address: string): Promise<BPD> {
    return ethers.getContractAt(AxionContract.BPD, address) as Promise<BPD>;
  }

  // Foreign Swap
  static getForeignSwapFactory(): Promise<ForeignSwap__factory> {
    return ethers.getContractFactory(AxionContract.ForeignSwap) as Promise<ForeignSwap__factory>;
  }

  static getForeignSwapAt(address: string): Promise<ForeignSwap> {
    return ethers.getContractAt(AxionContract.ForeignSwap, address) as Promise<ForeignSwap>;
  }

  // Native Swap
  static getNativeSwapFactory(): Promise<NativeSwap__factory> {
    return ethers.getContractFactory(AxionContract.NativeSwap) as Promise<NativeSwap__factory>;
  }

  static getNativeSwapAt(address: string): Promise<NativeSwap> {
    return ethers.getContractAt(AxionContract.NativeSwap, address) as Promise<NativeSwap>;
  }

  // Staking
  static getStakingFactory(): Promise<Staking__factory> {
    return ethers.getContractFactory(AxionContract.Staking) as Promise<Staking__factory>;
  }

  static getStakingAt(address: string): Promise<Staking> {
    return ethers.getContractAt(AxionContract.Staking, address) as Promise<Staking>;
  }

  // Sub Balances
  static getSubBalancesFactory(): Promise<SubBalances__factory> {
    return ethers.getContractFactory(AxionContract.SubBalances) as Promise<SubBalances__factory>;
  }

  static getSubBalancesAt(address: string): Promise<SubBalances> {
    return ethers.getContractAt(AxionContract.SubBalances, address) as Promise<SubBalances>;
  }

  // Token
  static getTokenFactory(): Promise<Token__factory> {
    return ethers.getContractFactory(AxionContract.Token) as Promise<Token__factory>;
  }

  static getTokenAt(address: string): Promise<Token> {
    return ethers.getContractAt(AxionContract.Token, address) as Promise<Token>;
  }

  // UniswapV2Router02Mock
  static getUniswapV2Router02MockFactory(): Promise<UniswapV2Router02Mock__factory> {
    return ethers.getContractFactory(
      AxionContract.UniswapV2Router02Mock
    ) as Promise<UniswapV2Router02Mock__factory>;
  }

  // TERC20
  static getTERC20Factory(): Promise<TERC20__factory> {
    return ethers.getContractFactory(
        AxionContract.TERC20
    ) as Promise<TERC20__factory>;
  }
}
