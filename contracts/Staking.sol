// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

/** OpenZeppelin Dependencies */
// import "@openzeppelin/contracts-upgradeable/contracts/proxy/Initializable.sol";
import '@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
/** Local Interfaces */
import './interfaces/IToken.sol';
import './interfaces/IAuction.sol';
import './interfaces/IStaking.sol';
import './interfaces/ISubBalances.sol';
import './interfaces/IStakingV1.sol';

contract Staking is IStaking, Initializable, AccessControlUpgradeable {
    using SafeMathUpgradeable for uint256;

    /** Events */
    event Stake(
        address indexed account,
        uint256 indexed sessionId,
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 shares
    );

    event Unstake(
        address indexed account,
        uint256 indexed sessionId,
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 shares
    );

    event MakePayout(
        uint256 indexed value,
        uint256 indexed sharesTotalSupply,
        uint256 sharePayout,
        uint256 indexed time
    );

    /** Structs */
    struct Payout {
        uint256 payout;
        uint256 sharesTotalSupply;
    }

    struct Session {
        uint256 amount;
        uint256 start;
        uint256 end;
        uint256 shares;
        uint256 firstPayout;
        uint256 lastPayout;
        bool withdrawn;
        uint256 payout;
    }

    struct Addresses {
        address mainToken;
        address auction;
        address subBalances;
    }

    Addresses public addresses;
    IStakingV1 public stakingV1;

    /** Roles */
    bytes32 public constant MIGRATOR_ROLE = keccak256('MIGRATOR_ROLE');
    bytes32 public constant EXTERNAL_STAKER_ROLE =
        keccak256('EXTERNAL_STAKER_ROLE');
    bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');

    /** Public Variables */
    uint256 public shareRate;
    uint256 public sharesTotalSupply;
    uint256 public nextPayoutCall;
    uint256 public stepTimestamp;
    uint256 public startContract;
    uint256 public globalPayout;
    uint256 public globalPayin;
    uint256 public lastSessionId;
    uint256 public lastSessionIdV1;

    /** Mappings / Arrays */
    mapping(address => mapping(uint256 => Session)) public sessionDataOf;
    mapping(address => uint256[]) public sessionsOf;
    Payout[] public payouts;

    /** Booleans */
    bool public init_;

    uint256 public basePeriod;
    uint256 public totalStakedAmount;

    uint256[] public payoutPerShare; // times 1e12
    /* New variables must go below here. */

    /** Roles */
    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), 'Caller is not a manager');
        _;
    }
    modifier onlyMigrator() {
        require(
            hasRole(MIGRATOR_ROLE, _msgSender()),
            'Caller is not a migrator'
        );
        _;
    }
    modifier onlyExternalStaker() {
        require(
            hasRole(EXTERNAL_STAKER_ROLE, _msgSender()),
            'Caller is not a external staker'
        );
        _;
    }

    /** Init functions */
    function initialize(address _manager, address _migrator)
        public
        initializer
    {
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(MIGRATOR_ROLE, _migrator);
        init_ = false;
    }

    function init(
        address _mainTokenAddress,
        address _auctionAddress,
        address _subBalancesAddress,
        address _foreignSwapAddress,
        address _stakingV1Address,
        uint256 _stepTimestamp,
        uint256 _lastSessionIdV1
    ) external onlyMigrator {
        require(!init_, 'Staking: init is active');
        init_ = true;
        /** Setup */
        _setupRole(EXTERNAL_STAKER_ROLE, _foreignSwapAddress);
        _setupRole(EXTERNAL_STAKER_ROLE, _auctionAddress);

        addresses = Addresses({
            mainToken: _mainTokenAddress,
            auction: _auctionAddress,
            subBalances: _subBalancesAddress
        });

        stakingV1 = IStakingV1(_stakingV1Address);
        lastSessionId = _lastSessionIdV1;

        stepTimestamp = _stepTimestamp;

        if (startContract == 0) {
            startContract = now;
            nextPayoutCall = startContract.add(_stepTimestamp);
        }
        if (_lastSessionIdV1 != 0) {
            lastSessionIdV1 = _lastSessionIdV1;
        }
        if (shareRate == 0) {
            shareRate = 1e18;
        }
    }

    /** End init functions */

    function sessionsOf_(address account)
        external
        view
        returns (uint256[] memory)
    {
        return sessionsOf[account];
    }

    function stake(uint256 amount, uint256 stakingDays) external {
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        stakeInternal(amount, stakingDays, msg.sender);
        IToken(addresses.mainToken).burn(msg.sender, amount);
    }

    function externalStake(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) external override onlyExternalStaker {
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        stakeInternal(amount, stakingDays, staker);
    }

    function stakeInternal(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) internal {
        if (now >= nextPayoutCall) makePayout();

        uint256 start = now;
        uint256 end = now.add(stakingDays.mul(stepTimestamp));

        lastSessionId = lastSessionId.add(1);

        stakeInternalCommon(
            lastSessionId,
            amount,
            start,
            end,
            stakingDays,
            payouts.length,
            staker
        );
    }

    function _initPayout(address to, uint256 amount) internal {
        IToken(addresses.mainToken).mint(to, amount);
        globalPayout = globalPayout.add(amount);
    }

    function calculateStakingInterest(
        uint256 firstPayout,
        uint256 lastPayout,
        uint256 shares
    ) public view returns (uint256) {
        uint256 stakingInterest;
        uint256 lastIndex;

        if (payoutPerShare.length !=0 ) {
            lastIndex =
                MathUpgradeable.min(payoutPerShare.length - 1, lastPayout);
        }else {
            lastIndex = 0;
        }
        uint256 startInterest =
            shares.mul(payoutPerShare[firstPayout]).div(1e12);

        uint256 lastInterest = shares.mul(payoutPerShare[lastIndex]).div(1e12);
        
        stakingInterest = lastInterest.sub(startInterest);

        return stakingInterest;
    }

    function unstake(uint256 sessionId) external {
        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares != 0 && session.withdrawn == false,
            'Staking: Stake withdrawn or not set'
        );

        uint256 actualEnd = now;

        uint256 amountOut = unstakeInternal(session, sessionId, actualEnd);

        // To account
        _initPayout(msg.sender, amountOut);
    }

    function unstakeV1(uint256 sessionId) external {
        require(sessionId <= lastSessionIdV1, 'Staking: Invalid sessionId');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        // Unstaked already
        require(
            session.shares == 0 && session.withdrawn == false,
            'Staking: Stake withdrawn'
        );

        (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 shares,
            uint256 firstPayout
        ) = stakingV1.sessionDataOf(msg.sender, sessionId);

        // Unstaked in v1 / doesn't exist
        require(shares != 0, 'Staking: Stake withdrawn or not set');

        uint256 stakingDays = (end - start) / stepTimestamp;
        uint256 lastPayout = stakingDays + firstPayout;

        uint256 actualEnd = now;

        uint256 amountOut =
            unstakeV1Internal(
                sessionId,
                amount,
                start,
                end,
                actualEnd,
                shares,
                firstPayout,
                lastPayout,
                stakingDays
            );

        // To account
        _initPayout(msg.sender, amountOut);
    }

    function getAmountOutAndPenalty(
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 stakingInterest
    ) public view returns (uint256, uint256) {
        uint256 stakingSeconds = end.sub(start);
        uint256 stakingDays = stakingSeconds.div(stepTimestamp);
        uint256 secondsStaked = now.sub(start);
        uint256 daysStaked = secondsStaked.div(stepTimestamp);
        uint256 amountAndInterest = amount.add(stakingInterest);

        // Early
        if (stakingDays > daysStaked) {
            uint256 payOutAmount =
                amountAndInterest.mul(secondsStaked).div(stakingSeconds);

            uint256 earlyUnstakePenalty = amountAndInterest.sub(payOutAmount);

            return (payOutAmount, earlyUnstakePenalty);
            // In time
        } else if (daysStaked < stakingDays.add(14)) {
            return (amountAndInterest, 0);
            // Late
        } else if (daysStaked < stakingDays.add(714)) {
            uint256 daysAfterStaking = daysStaked - stakingDays;

            uint256 payOutAmount =
                amountAndInterest.mul(uint256(714).sub(daysAfterStaking)).div(
                    700
                );

            uint256 lateUnstakePenalty = amountAndInterest.sub(payOutAmount);

            return (payOutAmount, lateUnstakePenalty);
            // Nothing
        } else {
            return (0, amountAndInterest);
        }
    }

    function makePayout() public {
        require(now >= nextPayoutCall, 'Staking: Wrong payout time');
        uint256 todaysSharePayout;

        uint256 payout = _getPayout();

        payouts.push(
            Payout({payout: payout, sharesTotalSupply: sharesTotalSupply})
        );

        uint256 index = payoutPerShare.length != 0 ? payoutPerShare.length - 1 : 0;

        if (sharesTotalSupply == 0 ) {
            sharesTotalSupply = 1;
        } 

        todaysSharePayout = payoutPerShare[index].add(payout.mul(1e12).div(sharesTotalSupply));
        
        payoutPerShare.push(todaysSharePayout);

        nextPayoutCall = nextPayoutCall.add(stepTimestamp);

        emit MakePayout(payout, sharesTotalSupply, todaysSharePayout, now);
    }

    function readPayout() external view returns (uint256) {
        uint256 amountTokenInDay =
            IERC20Upgradeable(addresses.mainToken).balanceOf(address(this));

        uint256 currentTokenTotalSupply =
            (IERC20Upgradeable(addresses.mainToken).totalSupply()).add(
                globalPayin
            );

        uint256 inflation =
            uint256(8).mul(currentTokenTotalSupply.add(totalStakedAmount)).div(
                36500
            );

        return amountTokenInDay.add(inflation);
    }

    function _getPayout() internal returns (uint256) {
        uint256 amountTokenInDay =
            IERC20Upgradeable(addresses.mainToken).balanceOf(address(this));

        globalPayin = globalPayin.add(amountTokenInDay);

        if (globalPayin > globalPayout) {
            globalPayin = globalPayin.sub(globalPayout);
            globalPayout = 0;
        } else {
            globalPayin = 0;
            globalPayout = 0;
        }

        uint256 currentTokenTotalSupply =
            (IERC20Upgradeable(addresses.mainToken).totalSupply()).add(
                globalPayin
            );

        IToken(addresses.mainToken).burn(address(this), amountTokenInDay);

        uint256 inflation =
            uint256(8).mul(currentTokenTotalSupply.add(totalStakedAmount)).div(
                36500
            );

        globalPayin = globalPayin.add(inflation);

        return amountTokenInDay.add(inflation);
    }

    function _getStakersSharesAmount(
        uint256 amount,
        uint256 start,
        uint256 end
    ) internal view returns (uint256) {
        uint256 stakingDays = (end.sub(start)).div(stepTimestamp);
        uint256 numerator = amount.mul(uint256(1819).add(stakingDays));
        uint256 denominator = uint256(1820).mul(shareRate);

        return (numerator).mul(1e18).div(denominator);
    }

    function _getShareRate(
        uint256 amount,
        uint256 shares,
        uint256 start,
        uint256 end,
        uint256 stakingInterest
    ) internal view returns (uint256) {
        uint256 stakingDays = (end.sub(start)).div(stepTimestamp);

        uint256 numerator =
            (amount.add(stakingInterest)).mul(uint256(1819).add(stakingDays));

        uint256 denominator = uint256(1820).mul(shares);

        return (numerator).mul(1e18).div(denominator);
    }

    function restake(uint256 sessionId, uint256 stakingDays) external {
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares != 0 && session.withdrawn == false,
            'Staking: Stake withdrawn/invalid'
        );

        uint256 actualEnd = now;

        require(session.end <= actualEnd, 'Staking: Stake not mature');

        uint256 amountOut = unstakeInternal(session, sessionId, actualEnd);

        stakeInternal(amountOut, stakingDays, msg.sender);
    }

    function restakeV1(uint256 sessionId, uint256 stakingDays) external {
        require(sessionId <= lastSessionIdV1, 'Staking: Invalid sessionId');
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares == 0 && session.withdrawn == false,
            'Staking: Stake withdrawn'
        );

        (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 shares,
            uint256 firstPayout
        ) = stakingV1.sessionDataOf(msg.sender, sessionId);

        // Unstaked in v1 / doesn't exist
        require(shares != 0, 'Staking: Stake withdrawn');

        uint256 actualEnd = now;

        require(end <= actualEnd, 'Staking: Stake not mature');

        uint256 sessionStakingDays = (end - start) / stepTimestamp;
        uint256 lastPayout = sessionStakingDays + firstPayout;

        uint256 amountOut =
            unstakeV1Internal(
                sessionId,
                amount,
                start,
                end,
                actualEnd,
                shares,
                firstPayout,
                lastPayout,
                sessionStakingDays
            );

        stakeInternal(amountOut, stakingDays, msg.sender);
    }

    function unstakeInternal(
        Session storage session,
        uint256 sessionId,
        uint256 actualEnd
    ) internal returns (uint256) {
        uint256 amountOut =
            unstakeInternalCommon(
                sessionId,
                session.amount,
                session.start,
                session.end,
                actualEnd,
                session.shares,
                session.firstPayout,
                session.lastPayout
            );

        uint256 stakingDays = (session.end - session.start) / stepTimestamp;

        if (stakingDays >= basePeriod) {
            ISubBalances(addresses.subBalances).callOutcomeStakerTrigger(
                sessionId,
                session.start,
                session.end,
                actualEnd,
                session.shares
            );
        }

        session.end = actualEnd;
        session.withdrawn = true;
        session.payout = amountOut;

        return amountOut;
    }

    function unstakeV1Internal(
        uint256 sessionId,
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 actualEnd,
        uint256 shares,
        uint256 firstPayout,
        uint256 lastPayout,
        uint256 stakingDays
    ) internal returns (uint256) {
        uint256 amountOut =
            unstakeInternalCommon(
                sessionId,
                amount,
                start,
                end,
                actualEnd,
                shares,
                firstPayout,
                lastPayout
            );

        if (stakingDays >= basePeriod) {
            ISubBalances(addresses.subBalances).callOutcomeStakerTriggerV1(
                msg.sender,
                sessionId,
                start,
                end,
                actualEnd,
                shares
            );
        }

        sessionDataOf[msg.sender][sessionId] = Session({
            amount: amount,
            start: start,
            end: actualEnd,
            shares: shares,
            firstPayout: firstPayout,
            lastPayout: lastPayout,
            withdrawn: true,
            payout: amountOut
        });

        sessionsOf[msg.sender].push(sessionId);

        return amountOut;
    }

    function unstakeInternalCommon(
        uint256 sessionId,
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 actualEnd,
        uint256 shares,
        uint256 firstPayout,
        uint256 lastPayout
    ) internal returns (uint256) {
        if (now >= nextPayoutCall) makePayout();

        uint256 stakingInterest =
            calculateStakingInterest(firstPayout, lastPayout, shares);

        sharesTotalSupply = sharesTotalSupply.sub(shares);
        totalStakedAmount = totalStakedAmount.sub(amount);

        (uint256 amountOut, uint256 penalty) =
            getAmountOutAndPenalty(amount, start, end, stakingInterest);

        // To auction
        if (penalty != 0) {
            _initPayout(addresses.auction, penalty);
            IAuction(addresses.auction).callIncomeDailyTokensTrigger(penalty);
        }

        emit Unstake(
            msg.sender,
            sessionId,
            amountOut,
            start,
            actualEnd,
            shares
        );

        return amountOut;
    }

    /** Roles management - only for multi sig address */
    function setupRole(bytes32 role, address account) external onlyManager {
        _setupRole(role, account);
    }

    /** Temporary */
    function setShareRate(uint256 _shareRate) external onlyManager {
        shareRate = _shareRate;
    }

    /**automated init payoutPerShare array - can be removed if we use the manual setPayoutPerShare */
    function initPayoutPerShare() external onlyManager {
        require(payoutPerShare.length == 0, 'already initialized');

        uint256 sharePayout =
            payouts[0].payout.mul(1e12).div(payouts[0].sharesTotalSupply);
        payoutPerShare.push(sharePayout);

        for (uint256 i = 1; i < payouts.length; i++) {
            sharePayout = payoutPerShare[i - 1].add(
                payouts[i].payout.mul(1e12).div(payouts[i].sharesTotalSupply)
            );
            payoutPerShare.push(sharePayout);
        }
    }

    /** manually initialize payoutPerShare from precalculated values, cheaper gas */
    function setPayoutPerShare(uint256[] calldata shareAmounts)
        external
        onlyManager
    {
        require(
            payoutPerShare.length.add(shareAmounts.length) <= payouts.length,
            'already initialized'
        );

        for (uint256 i = 0; i < shareAmounts.length; i++) {
            payoutPerShare.push(shareAmounts[i]);
        }
    }

    function stakeInternalCommon(
        uint256 sessionId,
        uint256 amount,
        uint256 start,
        uint256 end,
        uint256 stakingDays,
        uint256 firstPayout,
        address staker
    ) internal {
        uint256 shares = _getStakersSharesAmount(amount, start, end);
        sharesTotalSupply = sharesTotalSupply.add(shares);
        totalStakedAmount = totalStakedAmount.add(amount);

        sessionDataOf[staker][sessionId] = Session({
            amount: amount,
            start: start,
            end: end,
            shares: shares,
            firstPayout: firstPayout,
            lastPayout: firstPayout + stakingDays,
            withdrawn: false,
            payout: 0
        });

        sessionsOf[staker].push(sessionId);

        if (stakingDays >= basePeriod) {
            ISubBalances(addresses.subBalances).callIncomeStakerTrigger(
                staker,
                sessionId,
                start,
                end,
                shares
            );
        }

        emit Stake(staker, sessionId, amount, start, end, shares);
    }
}
