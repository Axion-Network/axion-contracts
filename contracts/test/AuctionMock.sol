// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

import "../interfaces/IAuction.sol";

contract AuctionMock is IAuction {
    function callIncomeDailyTokensTrigger(uint256 amount) external override {}

    function callIncomeWeeklyTokensTrigger(uint256 amount) external override {}

    function addReservesToAuction(uint256 daysInFuture, uint256 amount) external override returns(uint256) {}
}
