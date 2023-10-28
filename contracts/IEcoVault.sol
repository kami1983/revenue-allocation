// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IEcoDividendDistribution.sol";

interface IEcoVault {

    // Events
    event EventDeposit(address indexed _from, address _token, uint256 _value);
    event EventWithdraw(address indexed _to, address _token, uint256 _value);

    /**
     * @dev Get the address of the dividend contract
     * @return The address of the dividend contract
     */
    function getDividendAddress() external view returns (address);

    function depositErc20(address _token, uint256 _amount) external ;

    /**
     * @dev Call the ledger to determine the allocated amount.
     * @param _token The address of the token to be distributed, if native token, use address(0)
     */
    function recordForDividends(address _token) external returns (uint256) ;

    function withdraw(address _token, address _to, uint256 _value) external  ;

}

