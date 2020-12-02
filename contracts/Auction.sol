// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./interfaces/IToken.sol";
import "./interfaces/IAuction.sol";
import "./interfaces/IStaking.sol";

contract Auction is IAuction, AccessControl {
    using SafeMath for uint256;

    event Bet(
        address indexed account,
        uint256 value,
        uint256 indexed auctionId,
        uint256 indexed time
    );

    event Withdraval(
        address indexed account,
        uint256 value,
        uint256 indexed auctionId,
        uint256 indexed time
    );

    event AuctionIsOver(uint256 eth, uint256 token, uint256 indexed auctionId);

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant CALLER_ROLE = keccak256("CALLER_ROLE");

    struct AuctionReserves {
        uint256 eth;
        uint256 token;
        uint256 uniswapLastPrice;
        uint256 uniswapMiddlePrice;
    }

    struct UserBet {
        uint256 eth;
        address ref;
    }

    mapping(uint256 => AuctionReserves) public reservesOf;
    mapping(address => uint256[]) public auctionsOf;
    mapping(uint256 => mapping(address => UserBet)) public auctionBetOf;
    mapping(uint256 => mapping(address => bool)) public existAuctionsOf;

    uint256 public lastAuctionEventId;
    uint256 public start;
    uint256 public stepTimestamp;
    uint256 public discountPercent;
    uint256 public premiumPercent;

    uint256 public autoStakeDays;
    uint256 public referrerPercent;
    uint256 public referredPercent;
    bool public referralsOn;

    address public mainToken;
    address public staking;
    address payable public uniswap;
    address payable public recipient;
    bool public init_;

    modifier onlyCaller() {
        require(
            hasRole(CALLER_ROLE, _msgSender()),
            "Caller is not a caller role"
        );
        _;
    }

    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, _msgSender()),
            "Caller is not a caller role"
        );
        _;
    }

    constructor() public {
        init_ = false;
    }

    function init(
        uint256 _stepTimestamp,
        address _manager,
        address _mainToken,
        address _staking,
        address payable _uniswap,
        address payable _recipient,
        address _nativeSwap,
        address _foreignSwap,
        address _subbalances
    ) external {
        require(!init_, "init is active");
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(CALLER_ROLE, _nativeSwap);
        _setupRole(CALLER_ROLE, _foreignSwap);
        _setupRole(CALLER_ROLE, _staking);
        _setupRole(CALLER_ROLE, _subbalances);
        // Timer
        autoStakeDays = 14;
        start = now;
        stepTimestamp = _stepTimestamp;
        // Auction discounts and premium
        discountPercent = 20;
        premiumPercent = 0;
        // Referral Bonuses
        referrerPercent = 20;
        referredPercent = 10;
        referralsOn = true;
        // Addresses
        mainToken = _mainToken;
        staking = _staking;
        uniswap = _uniswap;
        recipient = _recipient;
        init_ = true;
    }

    /** Public Setter Functions */
    function setReferrerPercentage(uint256 percent) external onlyManager {
        referrerPercent = percent;
    }
    function setReferredPercentage(uint256 percent) external onlyManager {
        referredPercent = percent;
    }
    function setReferralsOn(bool _referralsOn) external onlyManager {
        referralsOn = _referralsOn;
    }
    function setAutoStakeDays(uint256 _autoStakeDays) external onlyManager {
        autoStakeDays = _autoStakeDays;
    }

    function setDiscountPercent(uint256 percent) external onlyManager {
        discountPercent = percent;
    }

    function setPremiumPercent(uint256 percent) external onlyManager {
        premiumPercent = percent;
    }

    /** Public Getter functions */
    function auctionsOf_(address account)
        public
        view
        returns (uint256[] memory)
    {
        return auctionsOf[account];
    }

    function getUniswapLastPrice() public view returns (uint256) {
        address[] memory path = new address[](2);

        path[0] = IUniswapV2Router02(uniswap).WETH();
        path[1] = mainToken;

        uint256 price = IUniswapV2Router02(uniswap).getAmountsOut(
            1e18,
            path
        )[1];

        return price;
    }

    function getUniswapMiddlePriceForSevenDays() public view returns (uint256) {
        uint256 stepsFromStart = calculateStepsFromStart();

        uint256 index = stepsFromStart;
        uint256 sum;
        uint256 points;

        while (points != 7) {
            if (reservesOf[index].uniswapLastPrice != 0) {
                sum = sum.add(reservesOf[index].uniswapLastPrice);
                points = points.add(1);
            }

            if (index == 0) break;

            index = index.sub(1);
        }

        if (sum == 0) return getUniswapLastPrice();
        else return sum.div(points);
    }

    /** Core functionality */
    /** Internal */
    function _updatePrice() internal {
        uint256 stepsFromStart = calculateStepsFromStart();

        reservesOf[stepsFromStart].uniswapLastPrice = getUniswapLastPrice();

        reservesOf[stepsFromStart]
            .uniswapMiddlePrice = getUniswapMiddlePriceForSevenDays();
    }

    function _swapEth(uint256 amount, uint256 deadline) private {
        address[] memory path = new address[](2);

        path[0] = IUniswapV2Router02(uniswap).WETH();
        path[1] = mainToken;

        IUniswapV2Router02(uniswap).swapExactETHForTokens{value: amount}(
            0,
            path,
            staking,
            deadline
        );
    }

    /** Externals */
    function bet(uint256 deadline, address ref) external payable {
        _saveAuctionData();
        _updatePrice();

        require(_msgSender() != ref, "msg.sender == ref");

        (
            uint256 toRecipient,
            uint256 toUniswap
        ) = _calculateRecipientAndUniswapAmountsToSend();

        _swapEth(toUniswap, deadline);

        uint256 stepsFromStart = calculateStepsFromStart();

        /** If referralsOn is true sallow to set ref */
        if(referralsOn == true) {
            auctionBetOf[stepsFromStart][_msgSender()].ref = ref;
        }
        else { // Else set ref to 0x0 for this auction bid
            auctionBetOf[stepsFromStart][_msgSender()].ref = address(0);
        }

        auctionBetOf[stepsFromStart][_msgSender()]
            .eth = auctionBetOf[stepsFromStart][_msgSender()].eth.add(
            msg.value
        );

        if (!existAuctionsOf[stepsFromStart][_msgSender()]) {
            auctionsOf[_msgSender()].push(stepsFromStart);
            existAuctionsOf[stepsFromStart][_msgSender()] = true;
        }

        reservesOf[stepsFromStart].eth = reservesOf[stepsFromStart].eth.add(
            msg.value
        );

        recipient.transfer(toRecipient);

        emit Bet(msg.sender, msg.value, stepsFromStart, now);
    }

    function withdraw(uint256 auctionId) external {
        _saveAuctionData();
        _updatePrice();

        uint256 stepsFromStart = calculateStepsFromStart();

        require(stepsFromStart > auctionId, "auction is active");

        uint256 auctionETHUserBalance = auctionBetOf[auctionId][_msgSender()]
            .eth;

        auctionBetOf[auctionId][_msgSender()].eth = 0;

        require(auctionETHUserBalance > 0, "zero balance in auction");

        uint256 payout = _calculatePayout(auctionId, auctionETHUserBalance);

        uint256 uniswapPayoutWithPercent = _calculatePayoutWithUniswap(
            auctionId,
            auctionETHUserBalance,
            payout
        );

        if (payout > uniswapPayoutWithPercent) {
            uint256 nextWeeklyAuction = calculateNearestWeeklyAuction();

            reservesOf[nextWeeklyAuction].token = reservesOf[nextWeeklyAuction]
                .token
                .add(payout.sub(uniswapPayoutWithPercent));

            payout = uniswapPayoutWithPercent;
        }

        
        if (address(auctionBetOf[auctionId][_msgSender()].ref) == address(0)) {
            IToken(mainToken).burn(address(this), payout);

            IStaking(staking).externalStake(payout, autoStakeDays, _msgSender());

            emit Withdraval(msg.sender, payout, stepsFromStart, now);
        } else {
            IToken(mainToken).burn(address(this), payout);

            (
                uint256 toRefMintAmount,
                uint256 toUserMintAmount
            ) = _calculateRefAndUserAmountsToMint(payout);

            payout = payout.add(toUserMintAmount);

            IStaking(staking).externalStake(payout, autoStakeDays, _msgSender());

            emit Withdraval(msg.sender, payout, stepsFromStart, now);

            IStaking(staking).externalStake(
                toRefMintAmount,
                autoStakeDays,
                auctionBetOf[auctionId][_msgSender()].ref
            );
        }
    }

    /** External Contract Caller functions */
    function callIncomeDailyTokensTrigger(uint256 amount)
        external
        override
        onlyCaller
    {
        uint256 stepsFromStart = calculateStepsFromStart();
        uint256 nextAuctionId = stepsFromStart.add(1);

        reservesOf[nextAuctionId].token = reservesOf[nextAuctionId].token.add(
            amount
        );
    }

    function callIncomeWeeklyTokensTrigger(uint256 amount)
        external
        override
        onlyCaller
    {
        uint256 nearestWeeklyAuction = calculateNearestWeeklyAuction();

        reservesOf[nearestWeeklyAuction]
            .token = reservesOf[nearestWeeklyAuction].token.add(amount);
    }

    /** Calculate functions */
    function calculateNearestWeeklyAuction() public view returns (uint256) {
        uint256 stepsFromStart = calculateStepsFromStart();
        return stepsFromStart.add(uint256(7).sub(stepsFromStart.mod(7)));
    }

    function calculateStepsFromStart() public view returns (uint256) {
        return now.sub(start).div(stepTimestamp);
    }

    function _calculatePayoutWithUniswap(
        uint256 auctionId,
        uint256 amount,
        uint256 payout
    ) internal view returns (uint256) {
        uint256 uniswapPayout = reservesOf[auctionId]
            .uniswapMiddlePrice
            .mul(amount)
            .div(1e18);

        uint256 uniswapPayoutWithPercent = uniswapPayout
            .add(uniswapPayout.mul(discountPercent).div(100))
            .sub(uniswapPayout.mul(premiumPercent).div(100));

        if (payout > uniswapPayoutWithPercent) {
            return uniswapPayoutWithPercent;
        } else {
            return payout;
        }
    }

    function _calculatePayout(uint256 auctionId, uint256 amount)
        internal
        view
        returns (uint256)
    {
        return
            amount.mul(reservesOf[auctionId].token).div(
                reservesOf[auctionId].eth
            );
    }

    function _calculateRecipientAndUniswapAmountsToSend()
        private
        returns (uint256, uint256)
    {
        uint256 toRecipient = msg.value.mul(20).div(100);
        uint256 toUniswap = msg.value.sub(toRecipient);

        return (toRecipient, toUniswap);
    }

    function _calculateRefAndUserAmountsToMint(uint256 amount)
        private
        view
        returns (uint256, uint256)
    {
        uint256 toRefMintAmount = amount.mul(referrerPercent).div(100);
        uint256 toUserMintAmount = amount.mul(referredPercent).div(100);

        return (toRefMintAmount, toUserMintAmount);
    }

    /** Storage Functions */
    function _saveAuctionData() internal {
        uint256 stepsFromStart = calculateStepsFromStart();
        AuctionReserves memory reserves = reservesOf[stepsFromStart];

        if (lastAuctionEventId < stepsFromStart) {
            emit AuctionIsOver(reserves.eth, reserves.token, stepsFromStart);
            lastAuctionEventId = stepsFromStart;
        }
    }
}
