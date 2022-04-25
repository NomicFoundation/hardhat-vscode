// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Test {
	struct Hero {
        uint120 strength;
        uint120 charisma;
        uint120 intelligence;
        uint120 wisdom;
	}

    struct Stats {
        Hero hero;
        uint120 score;
    }

    Stats public stats;

	constructor() {
		stats =  Stats({ hero: Hero({ strength: 1, charisma: 1, intelligence: 1, wisdom: 1 }), score: 10 });
	}

    function setStrengthToMax() public {
        stats.hero.// <- cursor
    }
}
