// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

// token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import Initializable
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./InterfaceStakeStructure.sol";
import "./IEcoDividendDistribution.sol";
import "./IEcoVault.sol";


contract EcoDividendDistribution is IEcoDividendDistribution, Initializable, OwnableUpgradeable {
    address public register; // 

    uint256[] private totalShares; // Total number of shares
    // uint256[] private totalDividend; // Total dividend amount
    uint256[] private lastSharesVersion; // The last updated equity version

    InterfaceStakeStructure public equityStructure;

    struct Shareholder {
        uint256 shares; // Number of shares
        bool exists; // Whether the shareholder exists
        mapping(address => uint256) dividendBalanceList; // Dividend balance
        mapping(address => uint256) totalWithdrawnList; // Total withdrawal amount
    }

    // Array index is the sid value.
    mapping(address => Shareholder)[] private shareholdersList; // Mapping of shareholder addresses
    mapping(uint256 => address[]) public shareholderAddressesList;

    // A mapping of S-NFT id to local shareholder id
    // sid to mid
    mapping(uint256 => uint256) public sidMap;
    // mid to sid
    mapping(uint256 => uint256) public midMap;
    // sid to balanceOf address
    mapping(uint256 => address) public balanceAddressList;
    mapping(address => uint256) public balanceSidList;

    modifier onlyRegister() {
        require(msg.sender == register, "Only the owner can call this function");
        _;
    }

    function initialize ( address _equityStructure) public initializer  {
        __Ownable_init();
        // owner = msg.sender;
        register = msg.sender;
        updateEquityStructureInterface(_equityStructure);
    }

    /**
     * @dev Returns an version of the contract implementation.
     * @return The version of the contract
     */
    function impVersion() public pure returns (string memory) {
        return "1.1.0";
    }

    // update register
    function updateRegister(address _register) public onlyOwner {
        register = _register;
    }

    function receiveDeposit(address _token, uint256 _value) external{

        // Singer
        address _from = msg.sender;

        // Get sid
        uint256 _sid = balanceSidList[_from];

        // Get vault address
        address _vault_address = balanceAddressList[_sid];
        // Get assign account
        address _assignAccount = IEcoVault(_vault_address).getAssignAccount();

        // Check sid exists
        require(balanceAddressList[_sid] == _from, "sid not registered");

        uint256 _total_shares = this.getTotalShares(_sid);

        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        require(_value > _total_shares, "You need to send more balance");

        uint256 _sMapKey = sidMap[_sid];
        uint256 _version = equityStructure.getEquityVersion(_sid);
        if (_version > lastSharesVersion[_sid]) {
                // Update equity structure
            _refreshEquityStructure(_sMapKey);
        }
        _distributeDividend(_sMapKey, _token, _value, _assignAccount);

    }

    // Register a Shares, will set the sid and sidExists
    function registerSid(uint256 _sid, address _vault_address) public onlyRegister {

        require(_vault_address != address(0), "balanceOfAddress is zero");
        IEcoVault _vault = IEcoVault(_vault_address);
        require(_vault.getDividendAddress() == address(this), 'Vault address is not correct');

        // sid already registered
        require(balanceAddressList[_sid] == address(0), "sid already registered");
        balanceAddressList[_sid] = _vault_address;
        balanceSidList[_vault_address] = _sid;
        // init data lists
        shareholdersList.push();
        totalShares.push(0);
        // totalDividend.push(0); 
        lastSharesVersion.push(0); 

        uint256 mapNextId = shareholdersList.length - 1;

        // Get sidMap length 
        sidMap[_sid] = mapNextId;
        midMap[mapNextId] = _sid;
        // shareholdersList[mapNextId];
        _refreshEquityStructure(mapNextId);
        mapNextId++;
    }

    function upgradeVaultAddress(uint256 _sid, address _vault_address) public onlyOwner {
        require(_vault_address != address(0), "balanceOfAddress is zero");
        IEcoVault _vault = IEcoVault(_vault_address);
        require(_vault.getDividendAddress() == address(this), 'Vault address is not correct');

        // sid already registered
        require(balanceAddressList[_sid] != address(0), "sid not registered");
        // remove old vault address
        delete balanceSidList[balanceAddressList[_sid]];
        // set new vault address
        balanceAddressList[_sid] = _vault_address;
        balanceSidList[_vault_address] = _sid;
    }

    function getSidRelatedInfos(uint256 _sid) public view returns (uint256, address) {
        require(balanceAddressList[_sid] != address(0), "sid not registered");
        return (sidMap[_sid], balanceAddressList[_sid]);
    }

    // Update the address of the equity structure contract, can only be called by the contract owner
    function updateEquityStructureInterface(address _equityStructure) public onlyOwner {
        equityStructure = InterfaceStakeStructure(_equityStructure);
    }

    // Refresh the equity structure
    function _refreshEquityStructure(uint256 _mid) private {
        (address[] memory _newShareholders, uint256[] memory _newShares) = equityStructure.getEquityStructure(midMap[_mid]);
        uint256 _version = equityStructure.getEquityVersion(midMap[_mid]);
        _updateShareholders(_mid, _newShareholders, _newShares, _version);
    }

    // Private method to add a shareholder to the shareholderAddresses array
    function _addShareholderToList(uint256 _mid, address _shareholder) private {
        // Check if _shareholder exists in shareholderAddresses and add if not
        bool found = false;
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            if (shareholderAddressesList[_mid][i] == _shareholder) {
                found = true;
                break;
            }
        }
        if (!found) {
            shareholderAddressesList[_mid].push(_shareholder);
        }
    }

    // Private method to remove a shareholder's address from the shareholderAddresses array
    function _removeShareholderFromList(uint256 _mid, address _shareholder) private {
        // Check if _shareholder exists in shareholderAddresses and remove if found
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            if (shareholderAddressesList[_mid][i] == _shareholder) {
                delete shareholderAddressesList[_mid][i];
                break;
            }
        }
    }

    // Update shareholders' equity information, or add new equity information if it doesn't exist
    function _updateShareholders(uint256 _mid, address[] memory _shareholders, uint256[] memory _newShares, uint256 _lastSharesVersion) private {
        require(_shareholders.length == _newShares.length, "Arrays length mismatch");

        // Save existing shareholder addresses
        address[] memory existingShareholders = shareholderAddressesList[_mid];

        // Reset the total number of shares
        totalShares[_mid] = 0;

        // Iterate through existing shareholder addresses and check if each shareholder is in the new equity list
        for (uint256 i = 0; i < existingShareholders.length; i++) {
            address shareholder = existingShareholders[i];
            bool found = false;

            // Search for the shareholder in the new equity list
            for (uint256 j = 0; j < _shareholders.length; j++) {
                if (shareholder == _shareholders[j]) {
                    found = true;
                    // Update the share count
                    shareholdersList[_mid][shareholder].shares = _newShares[j];
                    totalShares[_mid] += _newShares[j];
                    break;
                }
            }

            // If the shareholder is not in the new equity list, set their shares to zero, indicating they are former shareholders with no shares.
            if (!found) {
                shareholdersList[_mid][shareholder].shares = 0;
                // Remove the shareholder's address from shareholderAddresses
                _removeShareholderFromList(_mid, shareholder);
            }
        }

        // Add new shareholders
        for (uint256 i = 0; i < _shareholders.length; i++) {
            address newShareholder = _shareholders[i];
            uint256 newShares = _newShares[i];

            // Check if the shareholder exists
            // Why shareholdersList.length > _mid ? because shareholdersList[_mid] is a mapping, 
            // it will be created when the first shareholder is added.
            if (!shareholdersList[_mid][newShareholder].exists) {

                Shareholder storage newElement = shareholdersList[_mid][newShareholder];
                newElement.exists = true;
                newElement.shares = newShares;

                // Accumulate totalShares
                totalShares[_mid] += newShares;
                _addShareholderToList(_mid, newShareholder);
            }
        }

        // Update the version number
        lastSharesVersion[_mid] = _lastSharesVersion;
    }

    // Distribute dividends
    function _distributeDividend(uint256 _mid, address _token, uint256 _deposit_value, address _assignAccount) internal {

        uint256 _dividendAmount = _deposit_value;

        require(_dividendAmount > 0, "Dividend amount must be greater than 0");

        // Get assign account hold shares
        uint256 _assignAccountShares = shareholdersList[_mid][_assignAccount].shares;
        require(totalShares[_mid] > _assignAccountShares, "No need for distribution");

        // Calculate the dividend payment for each share
        uint256 dividendPaymentEachShare = (_dividendAmount) / (totalShares[_mid] - _assignAccountShares);

        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            
            address shareholderAddr = shareholderAddressesList[_mid][i];
            if(shareholderAddr == _assignAccount){
                // Skip the assign account
                continue;
            }
            Shareholder storage shareholder = shareholdersList[_mid][shareholderAddr];
            uint256 dividendPayment = shareholder.shares * dividendPaymentEachShare;
            shareholder.dividendBalanceList[_token] += dividendPayment;
        }
    }

    /**
     * @dev Withdraw dividends
     * @param _sid The id of the equity structure
     * @param _token The address of the token contract
     * @param _holder The address of the holder
     */
    function withdrawDividends(uint256 _sid,  address _token, address _holder) external {

        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);

        Shareholder storage shareholder = shareholdersList[_sMapKey][_holder];
        require(shareholder.exists, "Shareholder does not exist");
        require(shareholder.dividendBalanceList[_token] > 0, "No dividends to withdraw");

        uint256 amountToWithdraw = shareholder.dividendBalanceList[_token];
        shareholder.dividendBalanceList[_token] = 0;
        shareholder.totalWithdrawnList[_token] += amountToWithdraw;

        address _vault_address = balanceAddressList[_sid];
        IEcoVault vault = IEcoVault(_vault_address);
        require(vault.getDividendAddress() == address(this), 'Vault address is not correct');

        vault.withdraw(_token, _holder, amountToWithdraw);

        // 
        emit EventWithdrawDividends(_sid, _token, _holder, amountToWithdraw);
    }

    // Get a list of all shareholders' addresses
    function getAllShareholders(uint256 _sid) public view returns (address[] memory) {
        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);
        return shareholderAddressesList[_sMapKey];
    }

    // Get total shares by sid
    function getTotalShares(uint256 _sid) external view returns (uint256) {
        return totalShares[sidMap[_sid]];
    }

    /**
     * @dev Get the last updated equity version
     * @param _sid The sid of the shareholder
     * @return The last updated equity version
     */
    function getLastSharesVersion(uint256 _sid) external view returns (uint256) {
        return lastSharesVersion[sidMap[_sid]];
    }

    /**
     * //TODO:: rename to getShareholderInfos
     * @dev Get shareholder information
     * @param _sid The sid of the shareholder
     * @param _token The token address, if native token, use address(0)
     * @param _who The shareholder address
     * @return shares The number of shares, exists Whether the shareholder exists, totalWithdrawn Total withdrawal amount, dividendBalance Dividend balance
    */
    function getShareholdersList(uint256 _sid, address _token, address _who) external view returns (uint256, bool, uint256, uint256){
        Shareholder storage shareholder = shareholdersList[sidMap[_sid]][_who];
        return (
            shareholder.shares, 
            shareholder.exists, 
            shareholder.totalWithdrawnList[_token],
            shareholder.dividendBalanceList[_token]
         );
    }

    // Get the total withdrawn funds
    function totalWithdrawnFunds(uint256 _sid, address _token) public view returns (uint256) {
        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);
        return _totalWithdrawnFunds(_sMapKey, _token);
    }

    function _totalWithdrawnFunds(uint256 _mid, address _token) internal view returns (uint256) {
        uint256 totalWithdrawn = 0;
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            address shareholderAddr = shareholderAddressesList[_mid][i];
            totalWithdrawn += shareholdersList[_mid][shareholderAddr].totalWithdrawnList[_token];
        }
        return totalWithdrawn;
    }
}