import * as sp from "@solidity-parser/parser";
import {Parser} from "./parser";

const input = `
    contract TestContract {
        uint256 asd;
        uint128 qwe;
        
        function functionOne() {
            asd = 5;
        }
        
        function functionTwo() {
            functionOne();asd= 6;
            qwe = 1;
        }
    }
`


try {
    let parser = new Parser(input);
    const newSource = parser.rename(11, 12, "functionNew");
    console.log("After function rename:\n", newSource);

    parser = new Parser(newSource);

    const finalSource = parser.rename(11, 26, "newVariable");
    console.log("After variable rename:\n", finalSource);

    console.log("Definition:", parser.goToDefinition(11, 26));
    console.log("Usages:", parser.showUsages(11, 26));
} catch (e) {
    if (e instanceof sp.ParserError) {
        console.error(e.errors)
    }
}
