// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

/** OpenZeppelin Dependencies */
// import "@openzeppelin/contracts-upgradeable/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
/** Local Interfaces */
import "./interfaces/IToken.sol";
import "./interfaces/IAuction.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/ISubBalances.sol";

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
        uint256 nextPayout;
        bool withdrawn;
        uint256 interest;
        uint256 penalty;
    }

    /** Private */
    uint256 public _sessionsIds;

    /** Roles */
    bytes32 public constant MIGRATOR_ROLE = keccak256("MIGRATOR_ROLE");
    bytes32 public constant EXTERNAL_STAKER_ROLE = keccak256("EXTERNAL_STAKER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /** Public Variables */
    address public mainToken;
    address public auction;
    address public subBalances;
    uint256 public shareRate;
    uint256 public sharesTotalSupply;
    uint256 public nextPayoutCall;
    uint256 public stepTimestamp;
    uint256 public startContract;
    uint256 public globalPayout;
    uint256 public globalPayin;

    /** Mappings / Arrays */
    mapping(address => mapping(uint256 => Session)) public sessionDataOf;
    mapping(address => uint256[]) public sessionsOf;
    Payout[] public payouts;
    
    /** Booleans */
    bool public init_;

    /** Variables after initial contract launch must go below here. https://github.com/OpenZeppelin/openzeppelin-sdk/issues/37 */
    /** End Variables after launch */

    /** Roles */
    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), "Caller is not a manager");
        _;
    }
    modifier onlyMigrator() {
        require(hasRole(MIGRATOR_ROLE, _msgSender()), "Caller is not a migrator");
        _;
    }
    modifier onlyExternalStaker() {
        require(
            hasRole(EXTERNAL_STAKER_ROLE, _msgSender()),
            "Caller is not a external staker"
        );
        _;
    }

    /** Init functions */
    function initialize(
        address _manager
    ) public initializer {
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(MIGRATOR_ROLE, _manager);
        init_ = false;
    }
    
    function init(
        address _mainToken,
        address _auction,
        address _subBalances,
        address _foreignSwap,
        uint256 _stepTimestamp
    ) external {
        require(!init_, "NativeSwap: init is active");
        init_ = true;
        /** Setup */
        _setupRole(EXTERNAL_STAKER_ROLE, _foreignSwap);
        _setupRole(EXTERNAL_STAKER_ROLE, _auction);
        mainToken = _mainToken;
        auction = _auction;
        subBalances = _subBalances;
        shareRate = 1e18;
        stepTimestamp = _stepTimestamp;
        nextPayoutCall = now.add(_stepTimestamp);
        startContract = now;
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
        if (now >= nextPayoutCall) makePayout();

        // Staking days must be greater then 0 and less then or equal to 5555.
        require(stakingDays > 0, "stakingDays < 1");
        require(stakingDays <= 5555, "stakingDays > 5555");
        uint256 start = now;
        uint256 end = now.add(stakingDays.mul(stepTimestamp));

        IToken(mainToken).burn(msg.sender, amount);
        _sessionsIds = _sessionsIds.add(1);
        uint256 sessionId = _sessionsIds;
        uint256 shares = _getStakersSharesAmount(amount, start, end);
        sharesTotalSupply = sharesTotalSupply.add(shares);

        sessionDataOf[msg.sender][sessionId] = Session({
            amount: amount,
            start: start,
            end: end,
            shares: shares,
            nextPayout: payouts.length,
            withdrawn: false,
            interest: 0,
            penalty: 0
        });

        sessionsOf[msg.sender].push(sessionId);

        ISubBalances(subBalances).callIncomeStakerTrigger(
            msg.sender,
            sessionId,
            start,
            end,
            shares
        );

        emit Stake(msg.sender, sessionId, amount, start, end, shares);
    }

    function externalStake(
        uint256 amount,
        uint256 stakingDays,
        address staker
    ) external override onlyExternalStaker {
        if (now >= nextPayoutCall) makePayout();

        require(stakingDays > 0, "stakingDays < 1");
        require(stakingDays <= 5555, "stakingDays > 5555");

        uint256 start = now;
        uint256 end = now.add(stakingDays.mul(stepTimestamp));

        _sessionsIds = _sessionsIds.add(1);
        uint256 sessionId = _sessionsIds;
        uint256 shares = _getStakersSharesAmount(amount, start, end);
        sharesTotalSupply = sharesTotalSupply.add(shares);

        sessionDataOf[staker][sessionId] = Session({
            amount: amount,
            start: start,
            end: end,
            shares: shares,
            nextPayout: payouts.length,
            withdrawn: false,
            interest: 0,
            penalty: 0
        });

        sessionsOf[staker].push(sessionId);

        ISubBalances(subBalances).callIncomeStakerTrigger(
            staker,
            sessionId,
            start,
            end,
            shares
        );

        emit Stake(staker, sessionId, amount, start, end, shares);
    }

    function _initPayout(address to, uint256 amount) internal {
        IToken(mainToken).mint(to, amount);
        globalPayout = globalPayout.add(amount);
    }

    function calculateStakingInterest(
        uint256 sessionId,
        address account,
        uint256 shares
    ) public view returns (uint256) {
        uint256 stakingInterest;

        for (
            uint256 i = sessionDataOf[account][sessionId].nextPayout;
            i < payouts.length;
            i++
        ) {
            uint256 payout = payouts[i].payout.mul(shares).div(
                payouts[i].sharesTotalSupply
            );

            stakingInterest = stakingInterest.add(payout);
        }

        return stakingInterest;
    }

    function _updateShareRate(
        address account,
        uint256 shares,
        uint256 stakingInterest,
        uint256 sessionId
    ) internal {
        uint256 newShareRate = _getShareRate(
            sessionDataOf[account][sessionId].amount,
            shares,
            sessionDataOf[account][sessionId].start,
            sessionDataOf[account][sessionId].end,
            stakingInterest
        );

        if (newShareRate > shareRate) {
            shareRate = newShareRate;
        }
    }

    function unstake(uint256 sessionId) external {
        if (now >= nextPayoutCall) makePayout();

        require(
            sessionDataOf[msg.sender][sessionId].withdrawn == false,
            "NativeSwap: Stake withdrawn"
        );

        uint256 shares = sessionDataOf[msg.sender][sessionId].shares;

        sessionDataOf[msg.sender][sessionId].withdrawn = true;

        if (sessionDataOf[msg.sender][sessionId].nextPayout >= payouts.length) {
            // To auction
            uint256 amount = sessionDataOf[msg.sender][sessionId].amount;

            _initPayout(auction, amount);
            IAuction(auction).callIncomeDailyTokensTrigger(amount);

            emit Unstake(
                msg.sender,
                sessionId,
                amount,
                sessionDataOf[msg.sender][sessionId].start,
                sessionDataOf[msg.sender][sessionId].end,
                shares
            );

            ISubBalances(subBalances).callOutcomeStakerTrigger(
                msg.sender,
                sessionId,
                sessionDataOf[msg.sender][sessionId].start,
                sessionDataOf[msg.sender][sessionId].end,
                shares
            );

            return;
        }

        uint256 stakingInterest = calculateStakingInterest(
            sessionId,
            msg.sender,
            shares
        );

        _updateShareRate(msg.sender, shares, stakingInterest, sessionId);

        sharesTotalSupply = sharesTotalSupply.sub(shares);

        (uint256 amountOut, uint256 penalty) = getAmountOutAndPenalty(
            sessionId,
            stakingInterest
        );

        sessionDataOf[msg.sender][sessionId].interest = amountOut;
        sessionDataOf[msg.sender][sessionId].penalty = penalty;

        // To auction
        _initPayout(auction, penalty);
        IAuction(auction).callIncomeDailyTokensTrigger(penalty);

        // To account
        _initPayout(msg.sender, amountOut);

        emit Unstake(
            msg.sender,
            sessionId,
            amountOut,
            sessionDataOf[msg.sender][sessionId].start,
            sessionDataOf[msg.sender][sessionId].end,
            shares
        );

        ISubBalances(subBalances).callOutcomeStakerTrigger(
            msg.sender,
            sessionId,
            sessionDataOf[msg.sender][sessionId].start,
            sessionDataOf[msg.sender][sessionId].end,
            sessionDataOf[msg.sender][sessionId].shares
        );
    }

    function getAmountOutAndPenalty(uint256 sessionId, uint256 stakingInterest)
        public
        view
        returns (uint256, uint256)
    {
        uint256 stakingDays = (
            sessionDataOf[msg.sender][sessionId].end.sub(
                sessionDataOf[msg.sender][sessionId].start
            )
        )
            .div(stepTimestamp);

        uint256 daysStaked = (
            now.sub(sessionDataOf[msg.sender][sessionId].start)
        )
            .div(stepTimestamp);

        uint256 amountAndInterest = sessionDataOf[msg.sender][sessionId]
            .amount
            .add(stakingInterest);

        // Early
        if (stakingDays > daysStaked) {
            uint256 payOutAmount = amountAndInterest.mul(daysStaked).div(
                stakingDays
            );

            uint256 earlyUnstakePenalty = amountAndInterest.sub(payOutAmount);

            return (payOutAmount, earlyUnstakePenalty);
            // In time
        } else if (
            stakingDays <= daysStaked && daysStaked < stakingDays.add(14)
        ) {
            return (amountAndInterest, 0);
            // Late
        } else if (
            stakingDays.add(14) <= daysStaked &&
            daysStaked < stakingDays.add(714)
        ) {
            uint256 daysAfterStaking = daysStaked.sub(stakingDays);

            uint256 payOutAmount = amountAndInterest
                .mul(uint256(714).sub(daysAfterStaking))
                .div(700);

            uint256 lateUnstakePenalty = amountAndInterest.sub(payOutAmount);

            return (payOutAmount, lateUnstakePenalty);
            // Nothing
        } else if (stakingDays.add(714) <= daysStaked) {
            return (0, amountAndInterest);
        }

        return (0, 0);
    }

    function makePayout() public {
        require(now >= nextPayoutCall, "NativeSwap: Wrong payout time");

        uint256 payout = _getPayout();

        payouts.push(
            Payout({payout: payout, sharesTotalSupply: sharesTotalSupply})
        );

        nextPayoutCall = nextPayoutCall.add(stepTimestamp);

        emit MakePayout(payout, sharesTotalSupply, now);
    }

    function readPayout() external view returns (uint256) {
        uint256 amountTokenInDay = IERC20Upgradeable(mainToken).balanceOf(address(this));

        uint256 currentTokenTotalSupply = (IERC20Upgradeable(mainToken).totalSupply()).add(
            globalPayin
        );

        uint256 inflation = uint256(8)
            .mul(currentTokenTotalSupply.add(sharesTotalSupply))
            .div(36500);

        return amountTokenInDay.add(inflation);
    }

    function _getPayout() internal returns (uint256) {
        uint256 amountTokenInDay = IERC20Upgradeable(mainToken).balanceOf(address(this));

        globalPayin = globalPayin.add(amountTokenInDay);

        if (globalPayin > globalPayout) {
            globalPayin = globalPayin.sub(globalPayout);
            globalPayout = 0;
        } else {
            globalPayin = 0;
            globalPayout = 0;
        }

        uint256 currentTokenTotalSupply = (IERC20Upgradeable(mainToken).totalSupply()).add(
            globalPayin
        );

        IToken(mainToken).burn(address(this), amountTokenInDay);

        uint256 inflation = uint256(8)
            .mul(currentTokenTotalSupply.add(sharesTotalSupply))
            .div(36500);


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

        uint256 numerator = (amount.add(stakingInterest)).mul(
            uint256(1819).add(stakingDays)
        );

        uint256 denominator = uint256(1820).mul(shares);

        return (numerator).mul(1e18).div(denominator);
    }

    // Helper
    function getNow0x() external view returns (uint256) {
        return now;
    }

    // migration functions
    function setOtherVars(uint256 _shareRate, uint256 _sharesTotalSupply, uint256 _nextPayoutCall,
            uint256 _globalPayin, uint256 _globalPayout, uint256[] calldata _payouts, uint256[] calldata _sharesTotalSupplyVec, uint256 maxSessionID) external onlyMigrator {
        shareRate = _shareRate;
        sharesTotalSupply = _sharesTotalSupply;
        nextPayoutCall = _nextPayoutCall;
        globalPayin = _globalPayin;
        globalPayout = _globalPayout;
        _sessionsIds = maxSessionID;

        for(uint256 i=0; i<_payouts.length; i++) {
            payouts.push(
                Payout({payout: _payouts[i], sharesTotalSupply: _sharesTotalSupplyVec[i]})
            );
        }
    }

    function setSessionID(address _wallet, uint256 _sessionID) external onlyMigrator {
        sessionsOf[_wallet].push(_sessionID);
    }

    function setSessionDataOf(address _wallet, uint256 _sessionID, uint256 _amount, uint256 _shares, uint256 _starttime,
        uint256 _endtime, uint256 _nextPayout) external onlyMigrator {

        sessionDataOf[_wallet][_sessionID] = Session({
            amount: _amount,
            start: _starttime,
            end: _endtime,
            shares: _shares,
            nextPayout: _nextPayout,
            withdrawn: false,
            interest: 0,
            penalty: 0
        });
    }

}
