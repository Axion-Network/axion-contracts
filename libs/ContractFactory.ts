import { ethers } from 'hardhat';

import {
  Auction,
  Auction__factory,
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
  SubBalances__factory,
  SubBalancesMock__factory,
  TERC20__factory,
  Token,
  Token__factory,
  UniswapV2Router02Mock__factory,

  // V1
  StakingV1,
  StakingV1__factory,
  AuctionV1,
  AuctionV1__factory,
  BPDV1,
  BPDV1__factory,
  ForeignSwapV1,
  ForeignSwapV1__factory,
  NativeSwapV1,
  NativeSwapV1__factory,
  SubBalancesV1,
  SubBalancesV1__factory,
  TokenV1,
  TokenV1__factory,
} from '../typechain';

enum AxionContract {
  Auction = 'Auction',
  AuctionManager = 'AuctionManager',
  BPD = 'BPD',
  ForeignSwap = 'ForeignSwap',
  NativeSwap = 'NativeSwap',
  Staking = 'Staking',
  SubBalances = 'SubBalances',
  SubBalancesMock = 'SubBalancesMock',
  Token = 'Token',
  UniswapV2Router02Mock = 'UniswapV2Router02Mock',
  TERC20 = 'TERC20',

  // V1
  StakingV1 = 'StakingV1',
  AuctionV1 = 'AuctionV1',
  BPDV1 = 'BPDV1',
  ForeignSwapV1 = 'ForeignSwapV1',
  NativeSwapV1 = 'NativeSwapV1',
  SubBalancesV1 = 'SubBalancesV1',
  TokenV1 = 'TokenV1',
}

export class ContractFactory {
  // Auction
  static getAuctionFactory(): Promise<Auction__factory> {
    return ethers.getContractFactory(
      AxionContract.Auction
    ) as Promise<Auction__factory>;
  }

  static getAuctionAt(address: string): Promise<Auction> {
    return ethers.getContractAt(
      AxionContract.Auction,
      address
    ) as Promise<Auction>;
  }

  // Auction Manager
  static getAuctionManagerFactory(): Promise<AuctionManager__factory> {
    return ethers.getContractFactory(
      AxionContract.AuctionManager
    ) as Promise<AuctionManager__factory>;
  }

  static getAuctionManagerAt(address: string): Promise<AuctionManager> {
    return ethers.getContractAt(
      AxionContract.AuctionManager,
      address
    ) as Promise<AuctionManager>;
  }

  // BPD
  static getBPDFactory(): Promise<BPD__factory> {
    return ethers.getContractFactory(
      AxionContract.BPD
    ) as Promise<BPD__factory>;
  }

  static getBPDAt(address: string): Promise<BPD> {
    return ethers.getContractAt(AxionContract.BPD, address) as Promise<BPD>;
  }

  // Foreign Swap
  static getForeignSwapFactory(): Promise<ForeignSwap__factory> {
    return ethers.getContractFactory(
      AxionContract.ForeignSwap
    ) as Promise<ForeignSwap__factory>;
  }

  static getForeignSwapAt(address: string): Promise<ForeignSwap> {
    return ethers.getContractAt(
      AxionContract.ForeignSwap,
      address
    ) as Promise<ForeignSwap>;
  }

  // Native Swap
  static getNativeSwapFactory(): Promise<NativeSwap__factory> {
    return ethers.getContractFactory(
      AxionContract.NativeSwap
    ) as Promise<NativeSwap__factory>;
  }

  static getNativeSwapAt(address: string): Promise<NativeSwap> {
    return ethers.getContractAt(
      AxionContract.NativeSwap,
      address
    ) as Promise<NativeSwap>;
  }

  // Staking
  static getStakingFactory(): Promise<Staking__factory> {
    return ethers.getContractFactory(
      AxionContract.Staking
    ) as Promise<Staking__factory>;
  }

  static getStakingAt(address: string): Promise<Staking> {
    return ethers.getContractAt(
      AxionContract.Staking,
      address
    ) as Promise<Staking>;
  }

  // Sub Balances
  static getSubBalancesFactory(): Promise<SubBalances__factory> {
    return ethers.getContractFactory(
      AxionContract.SubBalances
    ) as Promise<SubBalances__factory>;
  }

  static getSubBalancesAt(address: string): Promise<SubBalances> {
    return ethers.getContractAt(
      AxionContract.SubBalances,
      address
    ) as Promise<SubBalances>;
  }

  static getSubBalancesMockFactory(): Promise<SubBalancesMock__factory> {
    return ethers.getContractFactory(
      AxionContract.SubBalancesMock
    ) as Promise<SubBalancesMock__factory>;
  }

  // Token
  static getTokenFactory(): Promise<Token__factory> {
    return ethers.getContractFactory(
      AxionContract.Token
    ) as Promise<Token__factory>;
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

  // V1
  static getStakingV1Factory(): Promise<StakingV1__factory> {
    return ethers.getContractFactory(
      AxionContract.StakingV1
    ) as Promise<StakingV1__factory>;
  }
  static getBPDV1Factory(): Promise<BPDV1__factory> {
    return ethers.getContractFactory(
      AxionContract.BPDV1
    ) as Promise<BPDV1__factory>;
  }
  static getAuctionV1Factory(): Promise<AuctionV1__factory> {
    return ethers.getContractFactory(
      AxionContract.AuctionV1
    ) as Promise<StakingV1__factory>;
  }
  static getForeignSwapV1Factory(): Promise<ForeignSwapV1__factory> {
    return ethers.getContractFactory(
      AxionContract.ForeignSwapV1
    ) as Promise<ForeignSwapV1__factory>;
  }
  static getNativeSwapV1Factory(): Promise<NativeSwapV1__factory> {
    return ethers.getContractFactory(
      AxionContract.NativeSwapV1
    ) as Promise<NativeSwapV1__factory>;
  }
  static getSubBalancesV1Factory(): Promise<SubBalancesV1__factory> {
    return ethers.getContractFactory(
      AxionContract.SubBalancesV1
    ) as Promise<SubBalancesV1__factory>;
  }
  static getTokenV1Factory(): Promise<TokenV1__factory> {
    return ethers.getContractFactory(
      AxionContract.TokenV1
    ) as Promise<TokenV1__factory>;
  }
}
