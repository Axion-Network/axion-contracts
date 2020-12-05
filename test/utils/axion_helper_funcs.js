
const decimals_div = 1e18;
const seconds_in_day = 86400;
const apy = 0.08; // annual percentage yield
const daily_compound_rate = 0.00021087439837685906; // (1+p)^365=1.08 --> p = 1.08^(1/365)-1
const MAX_HEX_FREECLAIM = 10e6;
const LATE_STAKE_GRACEPERIOD = 14;
const WEEKLY_LATE_UNSTAKE_PENALTY = 0.01;
const DAILY_LATE_UNSTAKE_PENALTY = WEEKLY_LATE_UNSTAKE_PENALTY / 7;

function calc_shares(amount, stakingDays, shareRate) {
    let sd = stakingDays > 1820 ? 1820 : stakingDays;
    return amount * (1819+sd)/(1820*shareRate);
}

function calc_shares_from_stake_event(amount, start, end, shareRate) {
    amount /= decimals_div;
    let stakingDays = (end-start) / seconds_in_day;
    return calc_shares(amount, stakingDays, shareRate);
}
function calc_payout_no_rewards(amountStaked, shares, stakingDays) {
    let earnings_by_inflation = shares * Math.pow(1+daily_compound_rate, stakingDays);
    return (amountStaked + earnings_by_inflation);

}
function calcLateClaimPenalty(daysSinceMainnetStart, claim) {
    let daysPenalised = daysSinceMainnetStart > 350 ? 350 : daysSinceMainnetStart; // after 350 days there is no eligible claim left
    let lateConvertPenalty = 1 - (daysPenalised/350); // both hex and hex2t has same late claim penalty
    let eligibleAmount = claim * lateConvertPenalty;
    return eligibleAmount;
}
function calcHEXFreeClaimPenalty(daysSinceMainnetStart, hexWalletAmount) {
    let maxAmount = hexWalletAmount > MAX_HEX_FREECLAIM ? MAX_HEX_FREECLAIM : hexWalletAmount; // freeclaim limited to 10M
    let bigPenaltyAmount = maxAmount<MAX_HEX_FREECLAIM ? 0 : hexWalletAmount - maxAmount; // everything above 10M is sent to auction / bpd
    let eligibleClaimAmount = calcLateClaimPenalty(daysSinceMainnetStart, maxAmount); // this is the amount eligible after late claim penalty
    let claimPenaltyToAuction = maxAmount - eligibleClaimAmount; // this is late claim penalty also sent to auction
    return {bigPenaltyAmount, eligibleClaimAmount, claimPenaltyToAuction};
}
// NOTE: with shares, it is meant principal + earnings
function calcEarlyUnstakePenalty(shares, stakingDays, daysSinceStakeStarted) {
    if (daysSinceStakeStarted > stakingDays) { // not an early unstake
        return shares;
    }

    let stakingProgress = daysSinceStakeStarted/stakingDays;
    return stakingProgress*shares;

}
// NOTE: with shares, it is meant principal + earnings
function calcLateUnstakePenalty(shares, stakingDays, daysSinceStakeStarted) {
    if (daysSinceStakeStarted<stakingDays) {
        return shares;
    }

    let daysSinceStakeEnded = daysSinceStakeStarted-stakingDays;
    if (daysSinceStakeEnded <= LATE_STAKE_GRACEPERIOD) { // grace period of 14 days
        return shares;
    }
    let numPenaltyDays = daysSinceStakeEnded - LATE_STAKE_GRACEPERIOD;
    let penalty = numPenaltyDays * DAILY_LATE_UNSTAKE_PENALTY;
    penalty = penalty > 1.0 ? 1.0 : penalty;
    return shares * (1-penalty);

}
module.exports = {
    calc_shares,
    calc_shares_from_stake_event,
    calcLateClaimPenalty,
    calcHEXFreeClaimPenalty,
    calcEarlyUnstakePenalty,
    calcLateUnstakePenalty,
    calc_payout_no_rewards
}

