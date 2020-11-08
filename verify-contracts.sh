#!/bin/bash

network=$1

yarn run truffle run verify Token --network $network --license MIT
yarn run truffle run verify NativeSwap --network $network --license MIT
yarn run truffle run verify Auction --network $network --license MIT
yarn run truffle run verify Staking --network $network --license MIT
yarn run truffle run verify ForeignSwap --network $network --license MIT
yarn run truffle run verify BPD --network $network --license MIT
yarn run truffle run verify SubBalances --network $network --license MIT
