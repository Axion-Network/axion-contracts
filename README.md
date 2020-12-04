# Axion Contracts

- Please make sure you work on the tasks from this [board](https://dev.azure.com/axion-network/Smart%20Contracts/_boards/board/t/Smart%20Contracts%20Team/Stories), 
if the task you are working on is not there, please add one.


## Setup Instructions
1. install [node.js](https://nodejs.org/en/)
2. install [truffle](https://www.trufflesuite.com/truffle)
3. clone repo
4. run `npm install` in axion-contracts directory
5. run `npm run build` (on Windows `npm run build:win`)
    - this compiles the smart contracts and exports artifacts to a build folder
    - generate definition types for TypeScript and put it in a types folder ([typechain](https://github.com/ethereum-ts/TypeChain))
6. run the unit tests
  * `npx truffle test` - runs all unit tests
  * `npx truffle test TEST_PATH` - run a specific test located at TEST_PATH
  
Example of the test file in TypeScript: _subbalances.unstake.bug.ts_

## Manual Debugging
 * `truffle develop` - will start a truffle development blockchain and drop you into a truffle cli
 * `migrate` - run inside truffle cli to compile and migrate smart contracts onto the truffle development blockchain

## Additional resources
 * [Guide for debugging smart contracts with truffle develop](https://www.trufflesuite.com/tutorials/debugging-a-smart-contract)
 * [More info for unit testing with truffle](https://www.trufflesuite.com/docs/truffle/testing/testing-your-contracts)