// copy all directories under ../test_packages/ into ./node_modules

const fs = require('fs')
const path = require('path')

const testPackagesPath = path.join(__dirname, '..', 'test_packages')
const nodeModulesPath = path.join(__dirname, 'node_modules')

for (const pkgName of ['pkg_without_exports_1', 'pkg_without_exports_2', 'pkg_with_exports_1', 'pkg_with_exports_2']) {
  fs.cpSync(path.join(testPackagesPath, pkgName), path.join(nodeModulesPath, pkgName), {
    recursive: true,
  })
}
