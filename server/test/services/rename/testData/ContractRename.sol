// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Animal {
    string internal _noise;

    constructor(string memory noise) {
        _noise = noise;
    }

    function speak() public virtual returns (string memory) {
        return _noise;
    }
}

contract Dog is Animal {
    constructor() Animal("woof") {}

    function speak()
        public
        pure
        virtual
        override(Animal)
        returns (string memory)
    {
        return "woof";
    }

    function factory()
        public
        pure
        returns (Animal)
    {
        if (1 < 2) {
          return new Animal("woof");
        } else {
          return new Animal("woof");
        }
    }
}
