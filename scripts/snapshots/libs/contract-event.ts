import * as _ from 'lodash'
import Web3 from 'web3'
import { Contract, EventData as Web3EventData } from 'web3-eth-contract'

import { ArrayUtil } from './array.util'
import { ConfigUtil } from './config.util'
import { PromiseUtil } from './promise.util'
import { Web3Util } from './web3.util'

interface EventData extends Web3EventData {
  blockTimestamp?: string
}

export class ContractEvent {
  static async getPastEvents(
    contractInstance: Contract,
    eventName: string,
    numDaysAgo: number,
    batchSize: number,
    withBlockTimestamp: boolean,
    web3: Web3
  ): Promise<EventData[]> {
    const latestBlockNumber = await web3.eth.getBlockNumber()
    console.log('latestBlockNumber', latestBlockNumber)
    const blockCountPerDay = 12500
    const daysAgo = numDaysAgo
    const totalBlockCount = blockCountPerDay * daysAgo
    const startBlockNumber = latestBlockNumber - totalBlockCount
    const batchCount = daysAgo * 100
    const eventsPerBatch = totalBlockCount / batchCount

    const allEvents: EventData[] = []
    const promiseFns1 = _.range(0, batchCount).map((idx) => async () => {
      const lastIdx = idx === batchCount - 1
      const fromBlock = startBlockNumber + eventsPerBatch * idx
      const toBlock = lastIdx
        ? 'latest'
        : startBlockNumber + eventsPerBatch * (idx + 1)
      console.log('idx', idx)
      console.log('from', fromBlock)
      console.log('to', toBlock)
      console.log('num events', Number(toBlock) - fromBlock)
      const events = await contractInstance.getPastEvents(eventName, {
        fromBlock,
        toBlock,
      })
      console.log('events found', events.length)

      if (withBlockTimestamp) {
        const promiseFns2 = events.map((event) => async () => {
          const block = await web3.eth.getBlock(event.blockHash)
          ;(event as any).blockTimestamp = block.timestamp
        })
        await PromiseUtil.batchPromises(promiseFns2, 100, 'blockTimestamp', 0.1)
      }

      allEvents.push(...events)
    })

    await PromiseUtil.batchPromises(
      promiseFns1,
      batchSize,
      `event: ${eventName}`,
      1
    )

    return allEvents
  }

  static async getPastEventsUsingBlockNumber(
    contractInstances: Contract[],
    eventName: string,
    batchSize: number,
    withBlockTimestamp: boolean,
    numBlocksPerBatch = 500
  ): Promise<EventData[]> {
    console.log(`Start getting ${eventName} events`)
    console.log('Start block', ConfigUtil.getStartBlock())
    console.log('End block', ConfigUtil.getEndBlock())
    const totalBlockCount =
      ConfigUtil.getEndBlock() - ConfigUtil.getStartBlock()
    console.log('totalBlockCount', totalBlockCount)
    const startBlockNumber = ConfigUtil.getStartBlock()
    const batchCount = Math.ceil(totalBlockCount / numBlocksPerBatch)

    const allEvents: EventData[] = []
    const promiseFns1 = _.range(0, batchCount).map((idx) => async () => {
      const lastIdx = idx === batchCount - 1
      const fromBlock = startBlockNumber + numBlocksPerBatch * idx
      const toBlock = lastIdx
        ? ConfigUtil.getEndBlock()
        : startBlockNumber + numBlocksPerBatch * (idx + 1)
      console.log('idx', idx)
      console.log('from', fromBlock)
      console.log('to', toBlock)
      console.log('num blocks', Number(toBlock) - fromBlock)
      const events = await ArrayUtil.getRandomElement(
        contractInstances
      ).getPastEvents(eventName, {
        fromBlock,
        toBlock,
      })
      console.log('events found', events.length)

      if (withBlockTimestamp) {
        const promiseFns2 = events.map((event) => async () => {
          const block = await Web3Util.getNextWeb3().eth.getBlock(
            event.blockHash
          )
          ;(event as any).blockTimestamp = block.timestamp
        })
        await PromiseUtil.batchPromises(promiseFns2, 100, 'blockTimestamp', 0.1)
      }

      allEvents.push(...events)
    })

    await PromiseUtil.batchPromises(
      promiseFns1,
      batchSize,
      `event: ${eventName}`,
      1
    )

    console.log(`Done getting ${eventName} events`)

    return allEvents
  }
}
