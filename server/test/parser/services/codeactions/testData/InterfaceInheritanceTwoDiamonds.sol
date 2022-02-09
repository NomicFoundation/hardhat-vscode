// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

//     IA        CE
//   /    \     /    \
//  IB    IC  CF     CG
//   \   /      \   /
//     ID        CH
//         \   /
//           C

interface IA {
  function top() external returns (uint120);

  function topFromInterface() external returns (uint120);
}

interface IB is IA {
  function left() external returns (uint120);
}

interface IC is IA {
  function right() external returns (uint120);
}

interface ID is IB, IC {
  function bottom() external returns (uint120);
}

contract CE {
  function top() external virtual returns (uint120) {}
}

contract CF is CE {
  function left() external virtual returns (uint120) {}
}

contract CG is CE {
  function right() external virtual returns (uint120) {}
}

contract CH is CF, CG {
  function bottom() external virtual returns (uint120) {}
}

contract C is ID, CH {
  // function top() external override(CE, IA) returns (uint120) {}
  // function topFromInterface() external override returns (uint120) {}
  // function left() external override(CF, IB) returns (uint120) {}
  // function right() external override(CG, IC) returns (uint120) {}
  // function bottom() external override(CH, ID) returns (uint120) {}
}
