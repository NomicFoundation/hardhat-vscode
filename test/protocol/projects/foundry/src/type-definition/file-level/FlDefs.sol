// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct FlPoint {
    uint256 x;
    uint256 y;
}

enum FlShade {
    Light,
    Dark
}

type FlAmount is uint256;

struct FlBox {
    FlPoint corner;
    FlShade shade;
    FlAmount weight;
}

uint256 constant FL_LIMIT = 10;

FlAmount constant FL_UNIT = FlAmount.wrap(1);

function flOrigin() pure returns (FlPoint memory) {
    return FlPoint(0, 0);
}

function flSplit(FlBox memory b) pure returns (FlPoint memory, FlShade) {
    return (b.corner, b.shade);
}

function flWeigh(FlBox memory b) pure returns (FlAmount) {
    return b.weight;
}

function flMake(FlPoint memory p) pure returns (FlBox memory box) {
    box.corner = p;
    box.shade = FlShade.Dark;
    box.weight = FL_UNIT;
}
