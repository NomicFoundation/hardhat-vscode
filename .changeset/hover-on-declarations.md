---
"hardhat-solidity": patch
"@nomicfoundation/solidity-language-server": patch
"@nomicfoundation/coc-solidity": patch
---

Show a hover for declarations. Hovering the name in a declaration - a state or local variable, a function, a parameter, a struct, enum, event, error or contract - previously showed nothing, because hover only resolved references. Constructors now read as `constructor(uint256 amount)` rather than `constructor null(uint256 amount)`, both at the declaration and at a `new Contract()` call site. Thanks @phpmac!
