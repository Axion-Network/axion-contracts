import { ethers } from 'hardhat';

import {
  // V2
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
  TERC20,
  TERC20__factory,
  TERC721,
  TERC721__factory,
  Token,
  Token__factory,
  UniswapV2Router02Mock__factory,
  // V2 Restorable
  AuctionRestorable,
  AuctionRestorable__factory,
  BPDRestorable,
  BPDRestorable__factory,
  ForeignSwapRestorable,
  ForeignSwapRestorable__factory,
  NativeSwapRestorable,
  NativeSwapRestorable__factory,
  StakingRestorable,
  StakingRestorable__factory,
  SubBalancesRestorable,
  SubBalancesRestorable__factory,
  TokenRestorable,
  TokenRestorable__factory,

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
  // Miner Manager
  AxionMine,
  AxionMine__factory,
  AxionMineManager,
  AxionMineManager__factory,
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
  TERC721 = 'TERC721',

  // V1
  StakingRestorable = 'StakingRestorable',
  AuctionRestorable = 'AuctionRestorable',
  BPDRestorable = 'BPDRestorable',
  ForeignSwapRestorable = 'ForeignSwapRestorable',
  NativeSwapRestorable = 'NativeSwapRestorable',
  SubBalancesRestorable = 'SubBalancesRestorable',
  TokenRestorable = 'TokenRestorable',

  // V1
  StakingV1 = 'StakingV1',
  AuctionV1 = 'AuctionV1',
  BPDV1 = 'BPDV1',
  ForeignSwapV1 = 'ForeignSwapV1',
  NativeSwapV1 = 'NativeSwapV1',
  SubBalancesV1 = 'SubBalancesV1',
  TokenV1 = 'TokenV1',

  // Mine
  AxionMine = 'AxionMine',
  AxionMineManager = 'AxionMineManager',
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

  static getTERC20At(address: string): Promise<TERC20> {
    return ethers.getContractAt(
      AxionContract.TERC20,
      address
    ) as Promise<TERC20>;
  }

  // V1
  static getStakingV1Factory(): Promise<StakingV1__factory> {
    return ethers.getContractFactory(
      AxionContract.StakingV1
    ) as Promise<StakingV1__factory>;
  }
  static getStakingV1At(address: string): Promise<StakingV1> {
    return ethers.getContractAt(
      AxionContract.StakingV1,
      address
    ) as Promise<StakingV1>;
  }

  static getBPDV1Factory(): Promise<BPDV1__factory> {
    return ethers.getContractFactory(
      AxionContract.BPDV1
    ) as Promise<BPDV1__factory>;
  }
  static getBPDV1At(address: string): Promise<BPDV1> {
    return ethers.getContractAt(AxionContract.BPDV1, address) as Promise<BPDV1>;
  }

  static getAuctionV1Factory(): Promise<AuctionV1__factory> {
    return ethers.getContractFactory(
      AxionContract.AuctionV1
    ) as Promise<AuctionV1__factory>;
  }
  static getAuctionV1At(address: string): Promise<AuctionV1> {
    return ethers.getContractAt(
      AxionContract.AuctionV1,
      address
    ) as Promise<AuctionV1>;
  }

  static getForeignSwapV1Factory(): Promise<ForeignSwapV1__factory> {
    return ethers.getContractFactory(
      AxionContract.ForeignSwapV1
    ) as Promise<ForeignSwapV1__factory>;
  }
  static getForeignSwapV1At(address: string): Promise<ForeignSwapV1> {
    return ethers.getContractAt(
      AxionContract.ForeignSwapV1,
      address
    ) as Promise<ForeignSwapV1>;
  }

  static getNativeSwapV1Factory(): Promise<NativeSwapV1__factory> {
    return ethers.getContractFactory(
      AxionContract.NativeSwapV1
    ) as Promise<NativeSwapV1__factory>;
  }
  static getNativeSwapV1At(address: string): Promise<NativeSwapV1> {
    return ethers.getContractAt(
      AxionContract.NativeSwapV1,
      address
    ) as Promise<NativeSwapV1>;
  }

  static getSubBalancesV1Factory(): Promise<SubBalancesV1__factory> {
    return ethers.getContractFactory(
      AxionContract.SubBalancesV1
    ) as Promise<SubBalancesV1__factory>;
  }
  static getSubBalancesV1At(address: string): Promise<SubBalancesV1> {
    return ethers.getContractAt(
      AxionContract.SubBalancesV1,
      address
    ) as Promise<SubBalancesV1>;
  }

  static getTokenV1Factory(): Promise<TokenV1__factory> {
    return ethers.getContractFactory(
      AxionContract.TokenV1
    ) as Promise<TokenV1__factory>;
  }
  static getTokenV1At(address: string): Promise<TokenV1> {
    return ethers.getContractAt(
      AxionContract.TokenV1,
      address
    ) as Promise<TokenV1>;
  }

  // Restore
  static getStakingRestorableFactory(): Promise<StakingRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.StakingRestorable
    ) as Promise<StakingRestorable__factory>;
  }
  static getStakingRestorableAt(address: string): Promise<StakingRestorable> {
    return ethers.getContractAt(
      AxionContract.StakingRestorable,
      address
    ) as Promise<StakingRestorable>;
  }

  static getBPDRestorableFactory(): Promise<BPDRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.BPDRestorable
    ) as Promise<BPDRestorable__factory>;
  }
  static getBPDRestorableAt(address: string): Promise<BPDRestorable> {
    return ethers.getContractAt(
      AxionContract.BPDRestorable,
      address
    ) as Promise<BPDRestorable>;
  }

  static getAuctionRestorableFactory(): Promise<AuctionRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.AuctionRestorable
    ) as Promise<AuctionRestorable__factory>;
  }
  static getAuctionRestorableAt(address: string): Promise<AuctionRestorable> {
    return ethers.getContractAt(
      AxionContract.AuctionRestorable,
      address
    ) as Promise<AuctionRestorable>;
  }

  static getForeignSwapRestorableFactory(): Promise<ForeignSwapRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.ForeignSwapRestorable
    ) as Promise<ForeignSwapRestorable__factory>;
  }
  static getForeignSwapRestorableAt(
    address: string
  ): Promise<ForeignSwapRestorable> {
    return ethers.getContractAt(
      AxionContract.ForeignSwapRestorable,
      address
    ) as Promise<ForeignSwapRestorable>;
  }

  static getNativeSwapRestorableFactory(): Promise<NativeSwapRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.NativeSwapRestorable
    ) as Promise<NativeSwapRestorable__factory>;
  }
  static getNativeSwapRestorableAt(
    address: string
  ): Promise<NativeSwapRestorable> {
    return ethers.getContractAt(
      AxionContract.NativeSwapRestorable,
      address
    ) as Promise<NativeSwapRestorable>;
  }

  static getSubBalancesRestorableFactory(): Promise<SubBalancesRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.SubBalancesRestorable
    ) as Promise<SubBalancesRestorable__factory>;
  }
  static getSubBalancesRestorableAt(
    address: string
  ): Promise<SubBalancesRestorable> {
    return ethers.getContractAt(
      AxionContract.SubBalancesRestorable,
      address
    ) as Promise<SubBalancesRestorable>;
  }

  static getTokenRestorableFactory(): Promise<TokenRestorable__factory> {
    return ethers.getContractFactory(
      AxionContract.TokenRestorable
    ) as Promise<TokenRestorable__factory>;
  }
  static getTokenRestorableAt(address: string): Promise<TokenRestorable> {
    return ethers.getContractAt(
      AxionContract.TokenRestorable,
      address
    ) as Promise<TokenRestorable>;
  }

  // 721
  static getTERC721Factory(): Promise<TERC721__factory> {
    return ethers.getContractFactory(
      AxionContract.TERC721
    ) as Promise<TERC721__factory>;
  }
  static getTERC721At(address: string): Promise<TERC721> {
    return ethers.getContractAt(
      AxionContract.TERC721,
      address
    ) as Promise<TERC721>;
  }

  // Mine
  static getAxionMineManagerFactory(): Promise<AxionMineManager__factory> {
    return ethers.getContractFactory(
      AxionContract.AxionMineManager
    ) as Promise<AxionMineManager__factory>;
  }
  static getAxionMineManagerAt(address: string): Promise<AxionMineManager> {
    return ethers.getContractAt(
      AxionContract.AxionMineManager,
      address
    ) as Promise<AxionMineManager>;
  }

  static getAxionMineFactory(): Promise<AxionMine__factory> {
    return ethers.getContractFactory(
      AxionContract.AxionMine
    ) as Promise<AxionMine__factory>;
  }
  static getAxionMineAt(address: string): Promise<AxionMine> {
    return ethers.getContractAt(
      AxionContract.AxionMine,
      address
    ) as Promise<AxionMine>;
  }
}
