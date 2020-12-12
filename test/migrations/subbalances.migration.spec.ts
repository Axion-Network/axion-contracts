import { SubBalancesInstance } from '../../types/truffle-contracts';

const initTestSmartContracts = require('../utils/initTestSmartContracts');
const subBalancesSnapshot = require('./mock-sub-balances-snapshot.json');
import _ from 'lodash';

contract('SubBalances - Migration', ([setter, recipient]) => {
  let subBalances: SubBalancesInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    subBalances = contracts.subbalances;
  });

  describe('setNormalVariables', () => {
    it('should init all normal variables', async () => {
      // act
      await subBalances.setNormalVariables(
        subBalancesSnapshot.currentSharesTotalSupply,
        subBalancesSnapshot.periods,
        subBalancesSnapshot.startTimestamp
      );

      // assert
      expect(await subBalances.currentSharesTotalSupply().then(String)).to.eq(
        subBalancesSnapshot.currentSharesTotalSupply
      );

      expect(await subBalances.startTimestamp().then(String)).to.eq(
        subBalancesSnapshot.startTimestamp
      );

      for (const idx of _.range(5)) {
        expect(await subBalances.periods(idx).then(String)).to.eq(
          subBalancesSnapshot.periods[idx]
        );
      }
    });
  });

  describe('setSubBalanceList', () => {
    it('should set sub balance list', async () => {
      // arrange
      const totalSharesList: string[] = [];
      const totalWithdrawAmountList: string[] = [];
      const payDayTimeList: string[] = [];
      const requiredStakePeriodList: string[] = [];
      const mintedList: boolean[] = [];
      subBalancesSnapshot.subBalanceList.forEach((subBalance: any) => {
        const {
          totalShares,
          totalWithdrawAmount,
          payDayTime,
          requiredStakePeriod,
          minted,
        } = subBalance;
        totalSharesList.push(totalShares);
        totalWithdrawAmountList.push(totalWithdrawAmount);
        payDayTimeList.push(payDayTime);
        requiredStakePeriodList.push(requiredStakePeriod);
        mintedList.push(minted);
      });

      // act
      await subBalances.setSubBalanceList(
        totalSharesList,
        totalWithdrawAmountList,
        payDayTimeList,
        requiredStakePeriodList,
        mintedList
      );

      // assert
      for (const idx of _.range(5)) {
        const {
          totalShares,
          totalWithdrawAmount,
          payDayTime,
          requiredStakePeriod,
          minted,
        } = (await subBalances.subBalanceList(idx)) as any;
        const expectedSubBalance = subBalancesSnapshot.subBalanceList[idx];
        expect(String(totalShares)).to.eq(expectedSubBalance.totalShares);
        expect(String(totalWithdrawAmount)).to.eq(
          expectedSubBalance.totalWithdrawAmount
        );
        expect(String(payDayTime)).to.eq(expectedSubBalance.payDayTime);
        expect(String(requiredStakePeriod)).to.eq(
          expectedSubBalance.requiredStakePeriod
        );
        expect(minted).to.eq(expectedSubBalance.minted);
      }
    });
  });

  describe('stakeSessions', () => {
    it('should init stakeSessions using snapshot', async () => {
      // arrange
      const sessionIds: string[] = [];
      const stakers: string[] = [];
      const sharesList: string[] = [];
      const startList: string[] = [];
      const endList: string[] = [];
      const finishTimeList: string[] = [];
      const payDayEligibleList: boolean[] = [];

      Object.keys(subBalancesSnapshot.stakeSessions)
        .slice(0, 5)
        .filter((sessionId) =>
          subBalancesSnapshot.stakeSessions[sessionId].payDayEligible.some(
            Boolean
          )
        )
        .forEach((sessionId) => {
          sessionIds.push(sessionId);
          const {
            start,
            end,
            staker,
            payDayEligible,
            finishTime,
            shares,
          } = subBalancesSnapshot.stakeSessions[sessionId];
          stakers.push(staker);
          sharesList.push(shares);
          startList.push(start);
          endList.push(end);
          finishTimeList.push(finishTime);
          payDayEligibleList.push(...payDayEligible);
        });

      // act
      await subBalances.addStakeSessions(
        sessionIds,
        stakers,
        sharesList,
        startList,
        endList,
        finishTimeList,
        payDayEligibleList
      );

      // assert
      for (const sessionId of sessionIds) {
        const {
          start,
          end,
          staker,
          finishTime,
          shares,
          withdrawn,
        } = (await subBalances.stakeSessions(sessionId)) as any;
        const expectedStakeSession =
          subBalancesSnapshot.stakeSessions[sessionId];

        expect(String(start)).to.eq(expectedStakeSession.start);
        expect(String(end)).to.eq(expectedStakeSession.end);
        expect(staker).to.eq(expectedStakeSession.staker);
        expect(String(finishTime)).to.eq(expectedStakeSession.finishTime);
        expect(String(shares)).to.eq(expectedStakeSession.shares);
        expect(withdrawn).to.eq(false);
      }
    });
  });
});
