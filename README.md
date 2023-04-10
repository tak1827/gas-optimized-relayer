# gas-optimized-relayer
A experlimental gas-optimized solidity relayer contract.

# PreRequirements
|  Software  |  Version  |
| ---- | ---- |
|  truffle  |  ^v5.x  |
|  ganache |  ^v7.x  |
|  prettier  |  ^v2.x  |
|  eslint  |  ^v8.x  |

## Conditions
- Compare three types of contracts.
- The relayed function is a lightweight `pure` function.
#### Contract Types
1. Secure contract utilizing a robust library such as OpenZeppelin.
2. Simplified contract omitting heavy code.
3. Optimized contract, which is an improved version of the Simplified contract, utilizing inline assembly

#### Relayed function
Sum of two arguments:
```sol
function sum(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
}
```
## Result
- Mesure 5 times
  - The initial gas cost is higher due to the initialization of the storage slot for nonces.
- Display the amount of gas used and the reduction in gas consumption.

| Times  | Robust Contract | Simple Contract | Optimized Contract | Robust/Optimized | Simple/Optimized |
| -- | -- | -- | -- | -- | -- |
|1|57800 gas|54746 gas|53667 gas|7.151 %|1.971 %|
|2|40700 gas|37634 gas|36567 gas|10.181 %|2.866 %|
|3|40712 gas|37646 gas|36567 gas|10.181 %|2.866 %|
|4|40712 gas|37646 gas|36567 gas|10.181 %|2.866 %|
|5|40712 gas|37646 gas|36567 gas|10.181 %|2.866 %|
