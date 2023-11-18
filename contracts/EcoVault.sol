// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import "./IEcoDividendDistribution.sol";
import "./IEcoVault.sol";

contract EcoVault is
    IEcoVault,
    IERC721Receiver,
    IERC1155Receiver,
    Initializable,
    OwnableUpgradeable
{

    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    mapping(address => uint256) public inVaultBalanceList;
    mapping(address => uint256) public outVaultBalanceList;

    IEcoDividendDistribution private dividend;

    mapping(address => uint256) public dividendBalanceList;

    address public assignAccount;

    bool public lockStatus;

    // ReentrancyGuard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    function initialize(address _dividend, address _assign_account) public initializer {
        __Ownable_init();
        dividend = IEcoDividendDistribution(_dividend);
        assignAccount = _assign_account;
    }

    function initialize_131() public initializer  {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }


    modifier onlyDividend() {
        require(
            msg.sender == address(dividend),
            "Only dividend contract can call"
        );
        _;
    }

    /**
     * @dev Returns an version of the contract implementation.
     * @return The version of the contract
     */
    function impVersion() public pure returns (string memory) {
        return "1.3.1";
    }

    function setAssignAccount(address _assignAccount) external onlyAssignAccount {
        assignAccount = _assignAccount;
        
    }

    function setLockStatus(bool _lockStatus) external onlyOwner {
        lockStatus = _lockStatus;
    }

    function getAssignAccount() external view returns (address) {
        if(assignAccount == address(0)){
            return owner();
        }
        return assignAccount;
    }

    modifier onlyAssignAccount() {
        require(
            msg.sender == assignAccount || msg.sender == owner(),
            "Only assign account or owner can call"
        );
        _;
    }

    modifier notLocked() {
        require(!lockStatus, "The contract is locked");
        _;
    }

    // Receive Ether
    receive() external payable {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        uint deposit_value = msg.value;
        emit EventDeposit(msg.sender, address(0), deposit_value);
    }

    function transferERC721(
        address tokenAddress,
        address to,
        uint256 tokenId
    ) public onlyAssignAccount notLocked{
        IERC721(tokenAddress).transferFrom(address(this), to, tokenId);
    }

    function transferERC1155(
        address tokenAddress,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public onlyAssignAccount notLocked{
        IERC1155(tokenAddress).safeTransferFrom(
            address(this),
            to,
            id,
            amount,
            data
        );
    }

    function getDividendAddress() public view returns (address) {
        return address(dividend);
    }

    function getAllInVaultBalance(address _token)
        public
        view
        returns (uint256)
    {
        if (_token == address(0)) {
            return address(this).balance.add(outVaultBalanceList[address(0)]);
        } else {
            IERC20 token = IERC20(_token);
            return token.balanceOf(address(this)).add(outVaultBalanceList[_token]);
        }
    }

    function getUnallocatedFunds(address _token) public view returns (uint256) {
        if(_token == address(0)){
            uint256 _totalAmount = address(this).balance.add(outVaultBalanceList[address(0)]);
            uint256 _unrecordFunds = _totalAmount.sub(dividendBalanceList[address(0)]);
            return _unrecordFunds;
        }else{
            IERC20 token = IERC20(_token);
            uint256 _totalAmount = token.balanceOf(address(this)).add(outVaultBalanceList[_token]);
            uint256 _unrecordFunds = _totalAmount.sub(dividendBalanceList[_token]);
            return _unrecordFunds;
        }
    }

    function recordForDividends(
        address _token
    ) external override notLocked nonReentrant returns (uint256) {
        uint256 _amount = getUnallocatedFunds(_token);

        require(_amount > 0, "No need to deposit for dividends.");

        dividendBalanceList[_token] = dividendBalanceList[_token].add(_amount);
        dividend.receiveDeposit(_token, _amount);
        emit EventDividend(address(this), _token, _amount);
        return _amount;
    }

    function withdraw (
        address _token,
        address _to,
        uint256 _value
    ) public onlyDividend notLocked nonReentrant {
        if (_token == address(0)) {
            require(
                address(this).balance >= _value,
                "Insufficient balance of native token"
            );

            outVaultBalanceList[address(0)] = outVaultBalanceList[address(0)].add(_value);

            // Perform the transfer
            (bool success, ) = payable(_to).call{value: _value}("");
            require(success, "Native token transfer failed");
            
            emit EventWithdraw(_to, address(0), _value);
        } else {
            IERC20 token = IERC20(_token);
            // transfer erc20 token
            require(
                token.balanceOf(address(this)) >= _value,
                "Insufficient balance of erc20 token"
            );
            outVaultBalanceList[_token] = outVaultBalanceList[_token].add(_value);
            IERC20Upgradeable(_token).transfer(_to, _value);

            emit EventWithdraw(_to, _token, _value);
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external view override returns (bool) {}

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

}

