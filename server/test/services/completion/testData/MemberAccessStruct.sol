// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Test {
	struct Hero {
        uint120 strength;
        uint120 charisma;
        uint120 intelligence;
        uint120 wisdom;
	}

    Hero public hero;

	constructor() {
		hero = Hero({ strength: 1, charisma: 1, intelligence: 1, wisdom: 1 });
	}

    function setStrengthToMax() public {
        hero.// <- cursor
    }
}
