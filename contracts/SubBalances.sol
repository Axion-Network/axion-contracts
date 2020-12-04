// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/** OpenZeppelin Dependencies */
// import "@openzeppelin/contracts-upgradeable/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
/** Local Interfaces */
import "./interfaces/IToken.sol";
import "./interfaces/IAuction.sol";
import "./interfaces/IForeignSwap.sol";
import "./interfaces/IBPD.sol";
import "./interfaces/ISubBalances.sol";


contract SubBalances is ISubBalances, Initializable, AccessControlUpgradeable {
	using SafeMathUpgradeable for uint256;

    /** Events */
    event PoolCreated(
        uint256 paydayTime,
        uint256 poolAmount
    );

    /** Structs */
    struct StakeSession {
    	address staker;
    	uint256 shares;
    	// uint256 sessionId;
    	uint256 start;
    	uint256 end;
    	uint256 finishTime;
        bool[5] payDayEligible;
    	bool withdrawn;
    }

    struct SubBalance {
    	// mapping (address => uint256[]) userStakings;
    	// mapping (uint256 => StakeSession) stakeSessions;
    	uint256 totalShares;
    	uint256 totalWithdrawAmount;
    	uint256 payDayTime;
    	// uint256 payDayEnd;
        uint256 requiredStakePeriod;
    	bool minted;
    }

    /** Role vars */
    bytes32 public constant MIGRATOR_ROLE = keccak256("MIGRATOR_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("CALLER_ROLE");
    // Public addresses
    address public mainToken;
    address public foreignSwap;
	address public bigPayDayPool;
	address public auction;
    // Public Ints
	uint256 public startTimestamp;
    uint256 public stepTimestamp;
    uint256 public basePeriod;
	uint256 public currentSharesTotalSupply;
    // Mappings / Array
    SubBalance[5] public subBalanceList;
    uint256[5] public periods;
    mapping (address => uint256[]) public userStakings;
    mapping (uint256 => StakeSession) public stakeSessions;
    // booleans
    bool public init_;

    /** No longer needed with initializble */
    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), "Caller is not a manager");
        _;
    }
    modifier onlyMigrator() {
        require(hasRole(MIGRATOR_ROLE, _msgSender()), "Caller is not a migrator");
        _;
    }

    /** Start Init functins */
    function initialize(
        address _manager
    ) public initializer {
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(MIGRATOR_ROLE, _manager);
    }

    function init(
        address _mainToken,
        address _foreignSwap,
        address _bigPayDayPool,
        address _auction,
        address _staking,
        uint256 _stepTimestamp,
        uint256 _basePeriod
    ) external onlyManager {
        require(!init_, "NativeSwap: init is active");
        init_ = true;
        /** Setup */
        _setupRole(STAKING_ROLE, _staking);
        mainToken = _mainToken;
        foreignSwap = _foreignSwap;
        bigPayDayPool = _bigPayDayPool;
        auction = _auction;
        stepTimestamp = _stepTimestamp;
        basePeriod = _basePeriod;
    	startTimestamp = now;

    	for (uint256 i = 0; i < subBalanceList.length; i++) {
            periods[i] = _basePeriod.mul(i.add(1));
    		SubBalance storage subBalance = subBalanceList[i];
            subBalance.payDayTime = startTimestamp.add(stepTimestamp.mul(periods[i]));
    		// subBalance.payDayEnd = subBalance.payDayStart.add(stepTimestamp);
            subBalance.requiredStakePeriod = periods[i];
    	}
    }

    function setAddresses(
        address _mainToken,
        address _foreignSwap,
        address _bigPayDayPool,
        address _auction,
        address _staking
    ) external onlyManager {
        _setupRole(STAKING_ROLE, _staking);
        mainToken = _mainToken;
        foreignSwap = _foreignSwap;
        bigPayDayPool = _bigPayDayPool;
        auction = _auction;
    }
    /** END INIT FUNCS */
    function getStartTimes() public view returns (uint256[5] memory startTimes) {
        for (uint256 i = 0; i < subBalanceList.length; i ++) {
            startTimes[i] = subBalanceList[i].payDayTime;
        }
    }

    function getPoolsMinted() public view returns (bool[5] memory poolsMinted) {
        for (uint256 i = 0; i < subBalanceList.length; i ++) {
            poolsMinted[i] = subBalanceList[i].minted;
        }
    }

    function getPoolsMintedAmounts() public view returns (uint256[5] memory poolsMintedAmounts) {
        for (uint256 i = 0; i < subBalanceList.length; i ++) {
            poolsMintedAmounts[i] = subBalanceList[i].totalWithdrawAmount;
        }
    }

    function getClosestYearShares() public view returns (uint256 shareAmount) {
        for (uint256 i = 0; i < subBalanceList.length; i++) {
            if (!subBalanceList[i].minted) {
                continue;
            } else {
                shareAmount = subBalanceList[i].totalShares;
                return shareAmount;
            }

            // return 0;
        }
    }

    function getSessionStats(uint256 sessionId) 
        public 
        view 
        returns (address staker, uint256 shares, uint256 start, uint256 sessionEnd, bool withdrawn) 
    {
        StakeSession storage stakeSession = stakeSessions[sessionId];
        staker = stakeSession.staker;
        shares = stakeSession.shares;
        start = stakeSession.start;
        if (stakeSession.finishTime > 0) {
            sessionEnd = stakeSession.finishTime;
        } else {
            sessionEnd = stakeSession.end;
        }
        withdrawn = stakeSession.withdrawn;
    }

    function getSessionEligibility(uint256 sessionId) public view returns (bool[5] memory stakePayDays) {
        StakeSession storage stakeSession = stakeSessions[sessionId];
        for (uint256 i = 0; i < subBalanceList.length; i ++) {
            stakePayDays[i] = stakeSession.payDayEligible[i];
        }
    }


    function calculateSessionPayout(uint256 sessionId) public view returns (uint256, uint256) {
        StakeSession storage stakeSession = stakeSessions[sessionId];

        uint256 subBalancePayoutAmount;
        uint256[5] memory bpdRawAmounts = IBPD(bigPayDayPool).getPoolYearAmounts();
        for (uint256 i = 0; i < subBalanceList.length; i++) {
            SubBalance storage subBalance = subBalanceList[i];

            uint256 subBalanceAmount;
            uint256 addAmount;
            if (subBalance.minted) {
                subBalanceAmount = subBalance.totalWithdrawAmount;
            } else {
                (subBalanceAmount, addAmount) = _bpdAmountFromRaw(bpdRawAmounts[i]);
            }
            if (stakeSession.payDayEligible[i]) {
                uint256 stakerShare = stakeSession.shares.mul(1e18).div(subBalance.totalShares);
                uint256 stakerAmount = subBalanceAmount.mul(stakerShare).div(1e18);
                subBalancePayoutAmount = subBalancePayoutAmount.add(stakerAmount);
            }
        }

        uint256 stakingDays = stakeSession.end.sub(stakeSession.start).div(stepTimestamp);
        uint256 stakeEnd;
        if (stakeSession.finishTime != 0) {
            stakeEnd = stakeSession.finishTime;
        } else {
            stakeEnd = stakeSession.end;
        }

        uint256 daysStaked = stakeEnd.sub(stakeSession.start).div(stepTimestamp);

        // Early unstaked
        if (stakingDays > daysStaked) {
            uint256 payoutAmount = subBalancePayoutAmount.mul(daysStaked).div(stakingDays);
            uint256 earlyUnstakePenalty = subBalancePayoutAmount.sub(payoutAmount);
            return (payoutAmount, earlyUnstakePenalty);
        // Unstaked in time, no penalty
        } else if (
            stakingDays <= daysStaked && daysStaked < stakingDays.add(14)
        ) {
            return (subBalancePayoutAmount, 0);
        // Unstaked late
        } else if (
            stakingDays.add(14) <= daysStaked && daysStaked < stakingDays.add(714)
        ) {
            uint256 daysAfterStaking = daysStaked.sub(stakingDays);
            uint256 payoutAmount = subBalancePayoutAmount.mul(uint256(714).sub(daysAfterStaking)).div(700);
            uint256 lateUnstakePenalty = subBalancePayoutAmount.sub(payoutAmount);
            return (payoutAmount, lateUnstakePenalty);
        // Too much time 
        } else if (stakingDays.add(714) <= daysStaked) {
            return (0, subBalancePayoutAmount);
        }

        return (0, 0);
    }

    function withdrawPayout(uint256 sessionId) public {
        StakeSession storage stakeSession = stakeSessions[sessionId];

        require(stakeSession.finishTime != 0, "cannot withdraw before unclaim");
        require(!stakeSession.withdrawn, "already withdrawn");
        require(_msgSender() == stakeSession.staker, "caller not matching sessionId");
        (uint256 payoutAmount, uint256 penaltyAmount) = calculateSessionPayout(sessionId);

        stakeSession.withdrawn = true;

        if (payoutAmount > 0) {
            IERC20Upgradeable(mainToken).transfer(_msgSender(), payoutAmount);
        }

        if (penaltyAmount > 0) {
            IERC20Upgradeable(mainToken).transfer(auction, penaltyAmount);
            IAuction(auction).callIncomeDailyTokensTrigger(penaltyAmount);
        }
    }


    function callIncomeStakerTrigger(
        address staker,
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 shares
    ) external override {
        require(hasRole(STAKING_ROLE, _msgSender()), "SUBBALANCES: Caller is not a staking role");
        require(end > start, "SUBBALANCES: Stake end must be after stake start");
        uint256 stakeDays = end.sub(start).div(stepTimestamp);

        // Skipping user if period less that year
        if (stakeDays >= basePeriod) {

            // Setting pay day eligibility for user in advance when he stakes
            bool[5] memory stakerPayDays;
            for (uint256 i = 0; i < subBalanceList.length; i++) {
                SubBalance storage subBalance = subBalanceList[i];  

                // Setting eligibility only if payday is not passed and stake end more that this pay day
                if (subBalance.payDayTime > start && end > subBalance.payDayTime) {
                    stakerPayDays[i] = true;

                    subBalance.totalShares = subBalance.totalShares.add(shares);
                }

            }

            // Saving user
            stakeSessions[sessionId] = StakeSession({
                staker: staker,
                shares: shares,
                start: start,
                end: end,
                finishTime: 0,
                payDayEligible: stakerPayDays,
                withdrawn: false
            });
            userStakings[staker].push(sessionId);

        }

        // Adding to shares
        currentSharesTotalSupply = currentSharesTotalSupply.add(shares);            

	}

    function callOutcomeStakerTrigger(
        address staker,
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 shares
    ) 
        external
        override
    {
        (staker);
        require(hasRole(STAKING_ROLE, _msgSender()), "SUBBALANCES: Caller is not a staking role");
        require(end > start, "SUBBALANCES: Stake end must be after stake start");
        uint256 stakeDays = end.sub(start).div(stepTimestamp);
        uint256 realStakeEnd = now;
        // uint256 daysStaked = realStakeEnd.sub(stakeStart).div(stepTimestamp);

        if (stakeDays >= basePeriod) {
            StakeSession storage stakeSession = stakeSessions[sessionId];

            // Rechecking eligibility of paydays
            for (uint256 i = 0; i < subBalanceList.length; i++) {
                SubBalance storage subBalance = subBalanceList[i];  

                // Removing from payday if unstaked before
                if (realStakeEnd < subBalance.payDayTime) {
                    bool wasEligible = stakeSession.payDayEligible[i];
                    stakeSession.payDayEligible[i] = false;

                    if (wasEligible) {
                        if (shares > subBalance.totalShares) {
                           subBalance.totalShares = 0;
                        } else {
                            subBalance.totalShares = subBalance.totalShares.sub(shares);
                        }
                    }
                }
            }


            // Setting real stake end
            stakeSessions[sessionId].finishTime = realStakeEnd;

        }

        // Substract shares from total
        if (shares > currentSharesTotalSupply) {
            currentSharesTotalSupply = 0;
        } else {
            currentSharesTotalSupply = currentSharesTotalSupply.sub(shares);
        }

    }


    // Pool logic
    function generatePool() external returns (bool) {
    	for (uint256 i = 0; i < subBalanceList.length; i++) {
    		SubBalance storage subBalance = subBalanceList[i];

    		if (now > subBalance.payDayTime && !subBalance.minted) {
    			uint256 yearTokens = getPoolFromBPD(i);
    			(uint256 bpdTokens, uint256 addAmount) = _bpdAmountFromRaw(yearTokens);

    			IToken(mainToken).mint(address(this), addAmount);
    			subBalance.totalWithdrawAmount = bpdTokens;
    			subBalance.minted = true;

                emit PoolCreated(now, bpdTokens);
                return true;
    		}
    	}
    }


    // Pool logic
    function getPoolFromBPD(uint256 poolNumber) internal returns (uint256 poolAmount) {
    	poolAmount = IBPD(bigPayDayPool).transferYearlyPool(poolNumber);
    }

    // Pool logic
    function _bpdAmountFromRaw(uint256 yearTokenAmount) internal view returns (uint256 totalAmount, uint256 addAmount) {
    	uint256 currentTokenTotalSupply = IERC20Upgradeable(mainToken).totalSupply();

        uint256 inflation = uint256(8).mul(currentTokenTotalSupply.add(currentSharesTotalSupply)).div(36500);

        
        uint256 criticalMassCoeff = IForeignSwap(foreignSwap).getCurrentClaimedAmount().mul(1e18).div(
            IForeignSwap(foreignSwap).getTotalSnapshotAmount());

       uint256 viralityCoeff = IForeignSwap(foreignSwap).getCurrentClaimedAddresses().mul(1e18).div(
            IForeignSwap(foreignSwap).getTotalSnapshotAddresses());

        uint256 totalUprisingCoeff = uint256(1e18).add(criticalMassCoeff).add(viralityCoeff);

        totalAmount = yearTokenAmount.add(inflation).mul(totalUprisingCoeff).div(1e18);
        addAmount = totalAmount.sub(yearTokenAmount);
    }


    /* Setter methods for contract migration */
    function setNormalVariables(
        uint256 _currentSharesTotalSupply, 
        uint256[5] calldata _periods
    ) external onlyMigrator {
        currentSharesTotalSupply = _currentSharesTotalSupply;
        periods = _periods;
    }

    function setSubBalanceList(
        uint256[5] calldata _totalSharesList,
        uint256[5] calldata _totalWithdrawAmountList,
        uint256[5] calldata _payDayTimeList,
        uint256[5] calldata _requiredStakePeriodList,
        bool[5] calldata _mintedList
    ) external onlyMigrator {
        for (uint256 idx = 0; idx < 5; idx = idx + 1) {
            subBalanceList[idx] = SubBalance({
                totalShares: _totalSharesList[idx],
                totalWithdrawAmount: _totalWithdrawAmountList[idx],
                payDayTime: _payDayTimeList[idx],
                requiredStakePeriod: _requiredStakePeriodList[idx],
                minted: _mintedList[idx]
            });
        }
    }

    function addStakeSessions(
        uint256[] calldata _sessionIds,
        address[] calldata _stakers,
        uint256[] calldata _sharesList,
        uint256[] calldata _startList,
        uint256[] calldata _endList,
        uint256[] calldata _finishTimeList,
        bool[] calldata _payDayEligibleList
    ) external onlyMigrator {
        for (
            uint256 sessionIdx = 0;
            sessionIdx < _sessionIds.length;
            sessionIdx = sessionIdx + 1
        ) {
            uint256 sessionId = _sessionIds[sessionIdx];
            bool[5] memory payDayEligible;
            for (uint256 boolIdx = 0; boolIdx < 5; boolIdx = boolIdx + 1) {
                payDayEligible[boolIdx] = _payDayEligibleList[5 * sessionIdx + boolIdx];
            }

            address staker = _stakers[sessionIdx];

            stakeSessions[sessionId] = StakeSession({
                staker: staker,
                shares: _sharesList[sessionIdx],
                start: _startList[sessionIdx],
                end: _endList[sessionIdx],
                finishTime: _finishTimeList[sessionIdx],
                payDayEligible: payDayEligible,
                withdrawn: false
            });
        }
    }

    function addUserStakings(
        address[] calldata _addresses,
        uint256[] calldata _sessionCountList,
        uint256[] calldata _sessionIds
    ) external onlyMigrator {
        uint256 sessionIdIdx = 0;

        for (uint256 i = 0; i < _addresses.length; i = i + 1) {
            address userAddress = _addresses[i];
            uint256 sessionCount = _sessionCountList[i];
            uint256[] memory sessionIds = new uint256[](sessionCount);
            for (uint256 j = 0; j < sessionCount; j = j + 1) {
                sessionIds[j] = _sessionIds[sessionIdIdx];
                sessionIdIdx = sessionIdIdx + 1;
            }
            userStakings[userAddress] = sessionIds;
        }
    }
}
