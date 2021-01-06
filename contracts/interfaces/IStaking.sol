// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IStaking {
    function externalStake(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) external;

    function sharesTotalSupply() external view returns (uint256);
}
