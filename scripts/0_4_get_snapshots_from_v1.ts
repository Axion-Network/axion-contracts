import { generateAuctionSnapshot } from './snapshots/scripts/generate-auction-snapshot'
import { generateBPDSnapshot } from './snapshots/scripts/generate-bpd-snapshot'
import { generateForeignSwapSnapshot } from './snapshots/scripts/generate-foreign-swap-snapshot'
import { generateMainTokenSnapshot } from './snapshots/scripts/generate-main-token-snapshot'
import { generateNatievSwapSnapshot } from './snapshots/scripts/generate-native-swap-snapshot'
import { generateStakingSnapshot } from './snapshots/scripts/generate-staking-snapshot'
import { generateSubBalancesSnapshot } from './snapshots/scripts/generate-sub-balances-snapshot'

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
