# Axion Contracts

## Setup Instructions
1. install [node.js](https://nodejs.org/en/)
2. install [truffle](https://www.trufflesuite.com/truffle)
3. clone repo
4. run `npm install` in axion-contracts directory
5. run `truffle compile` - this compiles the smart contracts and exports artifacts to a build folder
6. run the unit tests
  * `npm run build` - compile the contracts and generate the types
  * `npx truffle test` - runs all unit tests
  * `npx truffle test TEST_PATH` - run a specific test located at TEST_PATH

## Manual Debugging
 * `truffle develop` - will start a truffle development blockchain and drop you into a truffle cli
 * `migrate` - run inside truffle cli to compile and migrate smart contracts onto the truffle development blockchain

## Additional resources
 * [Guide for debugging smart contracts with truffle develop](https://www.trufflesuite.com/tutorials/debugging-a-smart-contract)
 * [More info for unit testing with truffle](https://www.trufflesuite.com/docs/truffle/testing/testing-your-contracts)