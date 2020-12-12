import { SubBalancesInstance } from '../../types/truffle-contracts';
const subBalancesSnapshot = require('../../real-snapshots/sub-balances-snapshot.json');
import _ from 'lodash';

export async function restoreSubBalancesSnapshot(
  subBalances: SubBalancesInstance
) {
  console.log('restoreSubBalancesSnapshot');
  const {
    currentSharesTotalSupply,
    PERIODS,
    startTimestamp,
  } = subBalancesSnapshot;
  await subBalances.setNormalVariables(
    currentSharesTotalSupply,
    PERIODS,
    startTimestamp
  );
  console.log(
    'setNormalVariables',
    currentSharesTotalSupply,
    PERIODS,
    startTimestamp
  );

  await setSubBalanceList(subBalances);

  console.log('restoreSubBalancesSnapshot - Done');
  console.log('---------------------------------');
}

async function setSubBalanceList(subBalances: SubBalancesInstance) {
  console.log('setSubBalanceList');
  const { subBalanceList } = subBalancesSnapshot;

  const totalSharesList: string[] = [];
  const totalWithdrawAmountList: string[] = [];
  const payDayTimeList: string[] = [];
  const requiredStakePeriodList: string[] = [];
  const mintedList: boolean[] = [];

  for (const idx of _.range(5)) {
    totalSharesList.push(subBalanceList[idx].totalShares);
    totalWithdrawAmountList.push(subBalanceList[idx].totalWithdrawAmount);
    payDayTimeList.push(subBalanceList[idx].payDayTime);
    requiredStakePeriodList.push(subBalanceList[idx].requiredStakePeriod);
    mintedList.push(subBalanceList[idx].minted);
  }

  await subBalances.setSubBalanceList(
    totalSharesList,
    totalWithdrawAmountList,
    payDayTimeList,
    requiredStakePeriodList,
    mintedList
  );
  console.log(totalSharesList);
  console.log(totalWithdrawAmountList);
  console.log(payDayTimeList);
  console.log(requiredStakePeriodList);
  console.log(mintedList);

  console.log('setSubBalanceList: done');
  console.log('--------------------------');
}
