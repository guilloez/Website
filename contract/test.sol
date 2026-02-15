// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    // Maximum amount that can be minted in a single transaction
    uint256 public constant MAX_MINT_AMOUNT = 1000000;

    constructor() ERC20("Test Token", "TST") Ownable(msg.sender) {
        _mint(msg.sender, 1000000);
    }

    /**
     * @dev Function to approve `spender` to transfer `amount` tokens on your behalf.
     * @param spender The address of the account able to transfer the tokens
     * @param amount The maximum amount of tokens that can be transferred
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev Function to mint new tokens
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        require(amount <= MAX_MINT_AMOUNT, "Amount exceeds maximum mint limit");
        _mint(to, amount);
    }
}