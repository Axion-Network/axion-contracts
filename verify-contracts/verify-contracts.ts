import { exec } from 'child_process';
import { promisify } from 'util';

// 1: (manual) - verify ProxyAdmin.sol

// 2: (manual) - get addresses from migration-output/address.json and verify AdminUpgradeabilityProxy.sol

// 3: (run the script) - use addresses from 2 and get implementation addresses from here https://etherscan.io/proxyContractChecker
const contracts = {
  Auction: '',
  BPD: '',
  ForeignSwap: '',
  NativeSwap: '',
  Staking: '',
  SubBalances: '',
  Token: '',
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
