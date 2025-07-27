// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Matic222 is ERC20 {
    constructor(uint256 initialSupply) ERC20("matic222", "MT222") {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }
}