# Axion Contracts

- If you are new to hardhat, please read [Hardhat getting started](https://hardhat.org/getting-started/)
- [Waffle](https://getwaffle.io/): A framework for testing smart contracts

## Setup Instructions

1. install [node.js](https://nodejs.org/en/)
2. install yarn (if you don't have yet) run `npm install -g yarn`
3. clone repo
4. run `yarn` in axion-contracts directory
5. run `yarn compile`
   - this compiles the smart contracts and exports artifacts to a artifacts folder
   - generate definition types for TypeScript and put it in a typechain folder ([typechain](https://github.com/ethereum-ts/TypeChain))
6. run the unit tests

- `yarn test` - runs all unit tests
- `yarn test TEST_PATH` - run a specific test located at TEST_PATH

7. check code coverage run `yarn coverage`
- please make sure to increase the threshold of code coverage over time _coverage:check_ in __package.json__

## Useful commands

- `npx hardhat --help` - to see all of the available tasks
- `npx hardhat run scripts/FILENAME --network X` - to run the script of network X

## Manual Debugging
- `yarn dev` - will start a development blockchain (use --network dev to interact with the dev network)

## Additional resources

- [Hardhat Overview](https://hardhat.org/getting-started/#overview)
- [Debugging with Hardhat Network](https://hardhat.org/tutorial/debugging-with-hardhat-network.html)

## HOW TO VERIFY
npx hardhat verify --network live <contract address>
