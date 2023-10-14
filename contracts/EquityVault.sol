// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IEquityDividendDistribution.sol";
import "./IEquityVault.sol";

contract EquityVault is IEquityVault {
    address public owner;
    mapping (address => uint256) public inVaultBalanceList;
    mapping (address => uint256) public outVaultBalanceList;

    IEquityDividendDistribution private dividend;

    constructor(address _dividend) {
        owner = msg.sender;
        dividend = IEquityDividendDistribution(_dividend);
    }
    
    modifier onlyDividend() {
        require(msg.sender == address(dividend), "Only dividend contract can call");
        _;
    }

    // Receive Ether
    receive() external payable {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        uint deposit_value = msg.value;
        inVaultBalanceList[address(0)] += deposit_value;
        dividend.receiveDeposit(address(0), deposit_value);
        emit EventDeposit(msg.sender, address(0), deposit_value);
    }

    function getDividendAddress() public view returns (address) {
        return address(dividend);
    }

    function depositErc20(address _token, uint256 _amount) public {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        IERC20 token = IERC20(_token);
        require(token.allowance(msg.sender, address(this)) >= _amount, "You are not allowed to transfer this amount");
        token.transferFrom(msg.sender, address(this), _amount);
        inVaultBalanceList[_token] += _amount;
        dividend.receiveDeposit(_token, _amount);
        emit EventDeposit(msg.sender, _token, _amount);
    }

    function withdraw(address _token, address _to, uint256 _value) public onlyDividend {
        
        if(_token == address(0)){
            require(address(this).balance >= _value, "Insufficient balance of native token");
            payable(_to).transfer(_value);
            outVaultBalanceList[address(0)] += _value;
            emit EventWithdraw(_to, address(0), _value);
        } else {
            IERC20 token = IERC20(_token);
            // transfer erc20 token
            require(token.balanceOf(address(this)) >= _value, "Insufficient balance of erc20 token");
            token.transfer(_to, _value);
            outVaultBalanceList[_token] += _value;
            emit EventWithdraw(_to, _token, _value);
        }
    }
}

