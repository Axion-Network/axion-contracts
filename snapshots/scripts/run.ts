import { generateAuctionSnapshot } from './generate-auction-snapshot'
import { generateBPDSnapshot } from './generate-bpd-snapshot'
import { generateForeignSwapSnapshot } from './generate-foreign-swap-snapshot'
import { generateMainTokenSnapshot } from './generate-main-token-snapshot'
import { generateNatievSwapSnapshot } from './generate-native-swap-snapshot'
import { generateStakingSnapshot } from './generate-staking-snapshot'
import { generateSubBalancesSnapshot } from './generate-sub-balances-snapshot'

const run = async () => {
  await generateAuctionSnapshot()
  console.log(
    '------------------ Done: generateAuctionSnapshot ------------------'
  )

  await generateBPDSnapshot()
  console.log('------------------ Done: generateBPDSnapshot ------------------')

  await generateForeignSwapSnapshot()
  console.log(
    '------------------ Done: generateForeignSwapSnapshot ------------------'
  )

  await generateNatievSwapSnapshot()
  console.log(
    '------------------ Done: generateNatievSwapSnapshot ------------------'
  )

  await generateStakingSnapshot()
  console.log(
    '------------------ Done: generateStakingSnapshot ------------------'
  )

  await generateSubBalancesSnapshot()
  console.log(
    '------------------ Done: generateSubBalancesSnapshot ------------------'
  )

  await generateMainTokenSnapshot()
  console.log(
    '------------------ Done: generateMainTokenSnapshot ------------------'
  )

  console.log(
    '------------------ Done: Crl + C to exit the script ------------------'
  )
}

run()
