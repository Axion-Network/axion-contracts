// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

import '../interfaces/IStaking.sol';

contract StakingMock is IStaking {
    function externalStake(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) external override {}

    function updateTokenPricePerShare(
        address bidderAddress,
        address tokenAddress,
        uint256 amountBought
    ) external override {}

    function addDivToken(address tokenAddress) external override {}
}
