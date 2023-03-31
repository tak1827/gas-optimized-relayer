# gas-optimized-relayer
A experlimental gas-optimized solidity relayer contract.

## Conditions
- Compare three types of contracts.
- The relayed function is a lightweight `pure` function.
#### Contract Types
1. Secure contract utilizing a robust library such as OpenZeppelin.
2. Simplified contract omitting heavy code.
3. Optimized contract employing inline assembly.

#### Relayed function
Sum of two arguments:
```sol
function sum(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
}
```
## Result
- Mesure 3 times
  - The initial gas cost is higher due to the initialization of the storage slot for nonces.
- Display the amount of gas used and the reduction in gas consumption.

| Times  | Secure Contract | Simple Contract | Optimized Contract | Secure/Optimized | Simple/Optimized |
| -- | -- | -- | -- | -- | -- |
|1|- gas|54746 gas|54428 gas| %| 0.5808643553866949 %|
|2|- gas|37634 gas|37316 gas| %| 0.5808643553866949 %|
|3|- gas|37646 gas|37328 gas| %| 0.5808643553866949 %|
