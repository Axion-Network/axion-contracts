// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IStaking {
    function externalStake(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) external;

    function updateTokenPricePerShare(
        address bidderAddress,
        address tokenAddress,
        uint256 amountBought
    ) external;

    function addDivToken(address tokenAddress) external;
}
