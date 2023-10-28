// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IEcoDividendDistribution.sol";
import "./IEcoVault.sol";

contract TestEcoDividendDistribution is IEcoDividendDistribution {

    // Record received deposit histroy
    mapping (address => uint256) public inVaultBalanceList;

    // Events
    event EventWithdraw(address indexed _to, address _token, uint256 _value);

    /**
     * @dev Receive Ether
     * @param _token The address of the token contract
     * @param _value The amount of deposit
     */
    function receiveDeposit(address _token, uint256 _value) external override {
        // record received deposit histroy to inVaultBalanceList
        require(_value>=10, 'Deposit value must be greater than 10');
        inVaultBalanceList[_token] += _value;
    }

    function withdraw(address _vault, address _token, address _to, uint256 _value) external {
        IEcoVault vault = IEcoVault(_vault);
        require(vault.getDividendAddress() == address(this), 'Vault address is not correct');
        require(inVaultBalanceList[_token] >= _value, 'Insufficient balance of erc20 token');

        inVaultBalanceList[_token] -= _value;
        vault.withdraw(_token, _to, _value);
        emit EventWithdraw(_to, _token, _value);
        // record received deposit histroy to inVaultBalanceList
        
    }

    /**
     * @dev Withdraw dividends
     * @param _sid The id of the equity structure
     * @param _token The address of the token contract
     * @param _holder The address of the holder
     */
    function withdrawDividends(uint256 _sid,  address _token, address _holder) external override {
        require(false, 'This function is not implemented');
    }
}