// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenVault
/// @notice Holds ETH and ERC20 tokens; deposits are public, withdrawals are owner-only.
/// @dev Uses SafeERC20, Ownable, and ReentrancyGuard. Validate addresses and test edge cases before deployment.
contract TokenVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events for logging (transparency and traceability)
    event TokensDeposited(address indexed token, address indexed user, uint256 amount);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event ETHDeposited(address indexed user, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);

    // vaultBalances: Token Address (address(0) = ETH) => tracked deposited amount
    mapping(address => uint256) public vaultBalances;

    constructor() Ownable(msg.sender) {
        require(msg.sender != address(0), "Invalid owner");
    }

    // ==========================================
    // 1. DEPOSIT TOKEN
    // ==========================================
    function depositToken(address tokenAddress, uint256 amount) external nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        IERC20 token = IERC20(tokenAddress);

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - balanceBefore;

        vaultBalances[tokenAddress] += received;
        emit TokensDeposited(tokenAddress, msg.sender, received);
    }

    // ==========================================
    // 2. WITHDRAW TOKEN (Owner Only)
    // ==========================================
    function withdrawToken(address tokenAddress, address to, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient");
        require(vaultBalances[tokenAddress] >= amount, "Insufficient logic balance");

        vaultBalances[tokenAddress] -= amount;
        IERC20(tokenAddress).safeTransfer(to, amount);

        emit TokensWithdrawn(tokenAddress, to, amount);
    }

    // ==========================================
    // 3. DEPOSIT ETH
    // ==========================================
    function depositEth() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");

        vaultBalances[address(0)] += msg.value;
        emit ETHDeposited(msg.sender, msg.value);
    }

    /// @notice Handles direct ETH transfers to the contract
    receive() external payable nonReentrant {
        vaultBalances[address(0)] += msg.value;
        emit ETHDeposited(msg.sender, msg.value);
    }

    // ==========================================
    // 4. WITHDRAW ETH (Owner Only)
    // ==========================================
    function withdrawEth(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(vaultBalances[address(0)] >= amount, "Insufficient logic balance");
        require(address(this).balance >= amount, "Insufficient ETH balance");

        vaultBalances[address(0)] -= amount;

        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit ETHWithdrawn(to, amount);
    }

    // ==========================================
    // 5. TRANSFER OWNER
    // ==========================================
    // This function is included automatically by importing "Ownable".
    // Function name: transferOwnership(address newOwner)

    // ==========================================
    // VIEW FUNCTIONS
    // ==========================================

    // 7. Get Real-Time Vault Token Balance (Query the Blockchain)
    function getVaultTokenBalance(address tokenAddress) external view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // 8. Get Real-Time Vault ETH Balance (Query the Blockchain)
    function getVaultEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
}