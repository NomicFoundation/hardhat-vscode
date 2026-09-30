// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract DtMembers {
    struct Point {
        uint256 x;
        uint256 y;
    }

    struct Pixel {
        uint256 x;
        uint8 shade;
    }

    mapping(uint256 => Point) internal points;
    Point[] internal path;
    Point internal origin;

    // Pixel also has a member x.
    function sumX(Pixel memory px) external view returns (uint256) {
        return points[1].x + path[0].x + origin.x + px.x;
    }

    function moveOrigin() external returns (string memory) {
        origin.x = origin.y;
        delete points[2].x;
        return "x";
    }
}
