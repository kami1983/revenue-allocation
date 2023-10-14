// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IEquityDividendDistribution {

    // define EventWithdrawDividends 
    event EventWithdrawDividends(uint256 indexed sid, address indexed token, address indexed holder, uint256 amount);

    /**
     * @dev Receive Ether
     * @param _token The address of the token contract
     * @param _value The amount of deposit
     */
    function receiveDeposit(address _token, uint256 _value) external;

    /**
     * @dev Withdraw dividends
     * @param _sid The id of the equity structure
     * @param _token The address of the token contract
     * @param _holder The address of the holder
     */
    function withdrawDividends(uint256 _sid,  address _token, address _holder) external ;
}