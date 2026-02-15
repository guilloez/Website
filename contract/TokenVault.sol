// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CryptoJoin
contract CryptoJoin is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    event TokensDeposited(address indexed token, address indexed user, uint256 amount);

    event ETHDeposited(address indexed user, uint256 amount);


    constructor() Ownable(msg.sender) {}

    // Fallback to receive ETH with data or without data
    fallback() external payable {
        emit ETHDeposited(msg.sender, msg.value);
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

        emit TokensDeposited(tokenAddress, msg.sender, received);
    }

    // ==========================================
    // 2. WITHDRAW TOKEN (Owner Only)
    // ==========================================
    function withdrawToken(address tokenAddress, address to, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient");

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");

        token.safeTransfer(to, amount);

        emit TokensWithdrawn(tokenAddress, to, amount);
    }

    // ==========================================
    // 3. DEPOSIT ETH
    // ==========================================
    function depositEth() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        emit ETHDeposited(msg.sender, msg.value);
    }

    /// @notice Handles direct ETH transfers to the contract
    receive() external payable nonReentrant {
        emit ETHDeposited(msg.sender, msg.value);
    }

    // ==========================================
    // 4. WITHDRAW ETH (Owner Only)
    // ==========================================
    function withdrawEth(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient ETH balance");

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