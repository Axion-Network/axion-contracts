const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config({ path: '.env' })

const {
  ETHERSCAN_API_KEY,
  INFURA_PROJECT_ID,
  INFURA_PROJECT_SECRET,
  SETTER_PRIV,
  DEPLOY_GAS_LIMIT,
  DEPLOY_GAS_PRICE
} = process.env;

const ganache = require('ganache-core');
const BN = require('bn.js');

module.exports = {
  // Uncommenting the defaults below
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    // development: {
    //     host: "127.0.0.1", // Localhost (default: none)
    //     port: 8545, // Standard Ethereum port (default: none)
    //     network_id: "*" // Any network (default: none)
    // },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8554, // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
    },
    // Another network with more advanced options...
    // advanced: {
    // port: 8777,             // Custom port
    // network_id: 1342,       // Custom network
    // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
    // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
    // from: <address>,        // Account to send txs from (default: accounts[0])
    // websockets: true        // Enable EventEmitter interface for web3 (default: false)
    // },
    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          SETTER_PRIV.toString(),
          'wss://:' + INFURA_PROJECT_SECRET + '@ropsten.infura.io/ws/v3/' + INFURA_PROJECT_ID,
        ),
      network_id: 3, // Ropsten's id
      gas: DEPLOY_GAS_LIMIT, // Ropsten has a lower block limit than mainnet
      gasPrice: DEPLOY_GAS_PRICE * 1000000000,  
      //confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          SETTER_PRIV.toString(),
          'wss://:' + INFURA_PROJECT_SECRET + '@' + 'kovan.infura.io/ws/v3/' + INFURA_PROJECT_ID,
        ),
      network_id: 42, // Kovan's id
      gas: DEPLOY_GAS_LIMIT, // Ropsten has a lower block limit than mainnet
      gasPrice: DEPLOY_GAS_PRICE * 1000000000,  // 20 gwei (in wei) (default: 100 gwei)
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          SETTER_PRIV.toString(),
          'wss://:' + INFURA_PROJECT_SECRET + '@' + 'rinkeby.infura.io/ws/v3/' + INFURA_PROJECT_ID,
        ),
      network_id: 4, // Rinkeby's id
      gas: DEPLOY_GAS_LIMIT, // Ropsten has a lower block limit than mainnet
      gasPrice: DEPLOY_GAS_PRICE * 1000000000,  // 20 gwei (in wei) (default: 100 gwei)
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
    live: {
      provider: () =>
        new HDWalletProvider(
          SETTER_PRIV.toString(),
          'wss://:' + INFURA_PROJECT_SECRET + '@' + 'mainnet.infura.io/ws/v3/' + INFURA_PROJECT_ID,
        ),
      network_id: 1, // Mainnet's id
      gas: DEPLOY_GAS_LIMIT, // gas block limit
      gasPrice: DEPLOY_GAS_PRICE * 1000000000,  // 20 gwei (in wei) (default: 100 gwei)
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 1000, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
    },
    ganache: {
      network_id: '*', // eslint-disable-line camelcase
      provider: ganache.provider({
          total_accounts: 15, // eslint-disable-line camelcase
          default_balance_ether: new BN(1e+5), // eslint-disable-line camelcase
          mnemonic: 'ganache',
          time: new Date('2020-04-21T12:00:00Z'),
          debug: false,
    gasLimit: 9000000,
          // ,logger: console
      }),
      gas: 8500000, // gas block limit
    },
    // Useful for private networks
    // private: {
    // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
    // network_id: 2111,   // This network is yours, in the cloud.
    // production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.6', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 0,
        },
      },
      //  evmVersion: "byzantium"
      // }
    },
  },
  plugins: [
    'solidity-coverage',
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
};
