// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IEcoDividendDistribution.sol";
import "./IEcoVault.sol";

contract EcoVault is
    IEcoVault,
    IERC721Receiver,
    IERC1155Receiver,
    Initializable,
    OwnableUpgradeable
{
    mapping(address => uint256) public inVaultBalanceList;
    mapping(address => uint256) public outVaultBalanceList;

    IEcoDividendDistribution private dividend;

    mapping(address => uint256) public dividendBalanceList;

    // constructor(address _dividend) {
    //     dividend = IEcoDividendDistribution(_dividend);
    // }

    function initialize(address _dividend) public initializer {
        __Ownable_init();
        dividend = IEcoDividendDistribution(_dividend);
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
        return "1.0.2";
    }

    // Receive Ether
    receive() external payable {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        uint deposit_value = msg.value;
        inVaultBalanceList[address(0)] += deposit_value;
        // dividend.receiveDeposit(address(0), deposit_value);
        emit EventDeposit(msg.sender, address(0), deposit_value);
    }

    function transferERC721(
        address tokenAddress,
        address to,
        uint256 tokenId
    ) public onlyOwner {
        IERC721(tokenAddress).transferFrom(address(this), to, tokenId);
    }

    function transferERC1155(
        address tokenAddress,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public onlyOwner {
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

    function depositErc20(address _token, uint256 _amount) public {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        IERC20 token = IERC20(_token);
        require(
            token.allowance(msg.sender, address(this)) >= _amount,
            "You are not allowed to transfer this amount"
        );
        token.transferFrom(msg.sender, address(this), _amount);
        inVaultBalanceList[_token] += _amount;
        // dividend.receiveDeposit(_token, _amount);
        emit EventDeposit(msg.sender, _token, _amount);
    }

    // /**
    //  * @dev Call the ledger to determine the allocated amount.
    //  * @param _token The address of the token to be distributed, if native token, use address(0)
    //  */
    // function recordForDividends(address _token) override external returns (uint256) {
    //     uint256 _amount = inVaultBalanceList[_token] - dividendBalanceList[_token];
    //     require(_amount > 0, "No need to deposit for dividend");
    //     dividendBalanceList[_token] += _amount;
    //     dividend.receiveDeposit(_token, _amount);
    //     return _amount;
    // }

    function recordForDividends(
        address _token
    ) external override returns (uint256) {
        uint256 _amount = inVaultBalanceList[_token] - dividendBalanceList[_token];
        require(_amount > 0, "No need to deposit for dividend");
        dividendBalanceList[_token] += _amount;
        dividend.receiveDeposit(_token, _amount);
        return _amount;
    }

    function withdraw (
        address _token,
        address _to,
        uint256 _value
    ) public onlyDividend {
        if (_token == address(0)) {
            require(
                address(this).balance >= _value,
                "Insufficient balance of native token"
            );
            payable(_to).transfer(_value);
            outVaultBalanceList[address(0)] += _value;
            emit EventWithdraw(_to, address(0), _value);
        } else {
            IERC20 token = IERC20(_token);
            // transfer erc20 token
            require(
                token.balanceOf(address(this)) >= _value,
                "Insufficient balance of erc20 token"
            );
            token.transfer(_to, _value);
            outVaultBalanceList[_token] += _value;
            emit EventWithdraw(_to, _token, _value);
        }
    }

    // ------- ERC721/ERC1155 interface implementation ------- //

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

