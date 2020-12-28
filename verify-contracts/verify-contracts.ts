import { exec } from 'child_process';
import { promisify } from 'util';

// 1: (manual) - verify ProxyAdmin.sol

// 2: (manual) - get addresses from migration-output/address.json and verify AdminUpgradeabilityProxy.sol

// 3: (run the script) - use addresses from 2 and get implementation addresses from here https://etherscan.io/proxyContractChecker
const contracts = {
  Auction: '0x5be60cfC143d32E3d15745D332f343241f0Ba95B',
  BPD: '0x129CD06caBd3DE5e50bE2D51b5c3805d7cfeDd4B',
  ForeignSwap: '0x017B838BCc3d0395321BD2B359afa07107c5fD25',
  NativeSwap: '0x4EbBEd1d75E5acCbaf338d7C2D30c6dB67F3EF8D',
  Staking: '0xfD18572F7005899A4cb63e55E5A233D181375AEE',
  SubBalances: '0xb4bB25f53d23913c0E955467219C8C6922929124',
  Token: '0xBA9890ABf2bc488A6ba8982fb2B65B0Cf4d6404C',
};

const execPromise = promisify(exec);

async function run() {
  for (const [contractName, address] of Object.entries(contracts)) {
    await execPromise(
      `npx truffle run verify ${contractName}@${address} --network live`
    ).then(console.log);
    console.log(`verified ${contractName} ${address}`);
  }
}

run();
