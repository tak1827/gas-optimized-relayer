// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract RobustRelayer is MinimalForwarder {
    constructor() MinimalForwarder() {}
}
