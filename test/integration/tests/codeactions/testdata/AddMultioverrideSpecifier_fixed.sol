// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Alpha {
    function foo() public virtual {}

    function bar() public virtual {}

    function baz() public virtual {}

    function longFunctionName()
        public
        virtual
        mathsWorks
        returns (string memory outputlong)
    {}

    modifier mathsWorks() {
        require(25 == 25, "happy");
        _;
    }
}

contract Beta {
    function bar() public virtual {}

    function baz() public virtual {}

    function longFunctionName()
        public
        virtual
        returns (string memory outputlong)
    {}
}

contract Gamma {
    function foo() public virtual {}

    function bar() public virtual {}

    function baz() public virtual {}

    function longFunctionName()
        public
        virtual
        returns (string memory outputlong)
    {}
}

contract Omega is Alpha, Beta, Gamma {
    function foo() public override(Alpha, Gamma) {}

    function bar() public view virtual override(Alpha, Beta, Gamma) {}

    function baz() public virtual override(Alpha, Beta, Gamma) {}

    function longFunctionName()
        public
        virtual
      override(Alpha, Beta, Gamma)
        returns (string memory outputlong)
    {}

    modifier anotherMod() {
        require(25 == 25, "happy");
        _;
    }
}
