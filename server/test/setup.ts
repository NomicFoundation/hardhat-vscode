import * as moduleAlias from "module-alias";

const aliases = {
  "@compilerDiagnostics": __dirname + "/../src/compilerDiagnostics",
  "@analyzer": __dirname + "/../src/parser/analyzer",
  "@common": __dirname + "/../src/parser/common",
  "@services": __dirname + "/../src/parser/services",
};

moduleAlias.addAliases(aliases);
