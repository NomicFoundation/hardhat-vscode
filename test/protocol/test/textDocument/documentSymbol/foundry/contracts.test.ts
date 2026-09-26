import { expect } from 'chai'
import { test } from 'mocha'
import { DocumentSymbol } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

interface SymbolShape {
  name: string
  kind: number
  children: SymbolShape[]
}

// Name, kind and hierarchy only, with siblings compared as a multiset: overloads share a name,
// so their children break the tie.
function shape(symbols: Array<DocumentSymbol | SymbolShape>): SymbolShape[] {
  return symbols
    .map((s) => ({ name: s.name, kind: s.kind, children: shape(s.children ?? []) }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.kind - b.kind ||
        JSON.stringify(a.children).localeCompare(JSON.stringify(b.children))
    )
}

// The children of the symbol at `path`, or the top-level symbols for []. A name that isn't there
// fails the test rather than reading as no symbols.
function at(symbols: DocumentSymbol[] | null, path: string[]): DocumentSymbol[] {
  expect(symbols, 'no symbols returned').to.be.an('array')
  let level = symbols ?? []
  for (const name of path) {
    const symbol = level.find((s) => s.name === name)
    expect(symbol, `no symbol ${name}`).to.not.equal(undefined)
    level = symbol?.children ?? []
  }
  return level
}

describe('[foundry] documentSymbol - contracts', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let kindsPath: string
  let interfacesPath: string
  let libraryPath: string
  let inheritPath: string
  let oneLinePath: string
  let sameNamesPath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    kindsPath = getProjectPath('foundry/src/document-symbols/contracts/CtKinds.sol')
    interfacesPath = getProjectPath('foundry/src/document-symbols/contracts/CtInterfaces.sol')
    libraryPath = getProjectPath('foundry/src/document-symbols/contracts/CtLibrary.sol')
    inheritPath = getProjectPath('foundry/src/document-symbols/contracts/CtInherit.sol')
    oneLinePath = getProjectPath('foundry/src/document-symbols/contracts/CtOneLine.sol')
    sameNamesPath = getProjectPath('foundry/src/document-symbols/contracts/CtSameNames.sol')
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')

    await client.openDocument(kindsPath)
    await client.openDocument(interfacesPath)
    await client.openDocument(libraryPath)
    await client.openDocument(inheritPath)
    await client.openDocument(oneLinePath)
    await client.openDocument(sameNamesPath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('interface, abstract contract, library and contract at the top level', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(kindsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'CtIEmpty', kind: 11, children: [] },
        { name: 'CtAbstractEmpty', kind: 5, children: [] },
        { name: 'CtLibEmpty', kind: 5, children: [] },
        { name: 'CtEmpty', kind: 5, children: [] },
      ])
    )
  })

  test('interfaces inheriting interfaces at the top level', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(interfacesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        { name: 'CtIRead', kind: 11, children: [{ name: 'read', kind: 12, children: [] }] },
        { name: 'CtIWrite', kind: 11, children: [{ name: 'write', kind: 12, children: [] }] },
        {
          name: 'CtIStore',
          kind: 11,
          children: [
            {
              name: 'CtEntry',
              kind: 23,
              children: [
                { name: 'key', kind: 7, children: [] },
                { name: 'value', kind: 7, children: [] },
              ],
            },
            { name: 'CtMode', kind: 10, children: [] },
            { name: 'entry', kind: 12, children: [] },
            { name: 'mode', kind: 12, children: [] },
          ],
        },
      ])
    )
  })

  test('inheriting interface lists only its own members', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(interfacesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtIStore']))).to.deep.equal(
      shape([
        {
          name: 'CtEntry',
          kind: 23,
          children: [
            { name: 'key', kind: 7, children: [] },
            { name: 'value', kind: 7, children: [] },
          ],
        },
        { name: 'CtMode', kind: 10, children: [] },
        { name: 'entry', kind: 12, children: [] },
        { name: 'mode', kind: 12, children: [] },
      ])
    )
  })

  test('struct members inside an interface', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(interfacesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtIStore', 'CtEntry']))).to.deep.equal(
      shape([
        { name: 'key', kind: 7, children: [] },
        { name: 'value', kind: 7, children: [] },
      ])
    )
  })

  test('library members, with the library constant listed as a property', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(libraryPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtMath']))).to.deep.equal(
      shape([
        { name: 'SCALE', kind: 7, children: [] },
        {
          name: 'CtFraction',
          kind: 23,
          children: [
            { name: 'num', kind: 7, children: [] },
            { name: 'den', kind: 7, children: [] },
          ],
        },
        { name: 'CtDivByZero', kind: 24, children: [] },
        { name: 'mul', kind: 12, children: [{ name: 'scaled', kind: 13, children: [] }] },
        { name: 'div', kind: 12, children: [] },
      ])
    )
  })

  test('contract with a using directive for a library', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(libraryPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtUsesMath']))).to.deep.equal(
      shape([
        { name: 'half', kind: 7, children: [] },
        { name: 'halve', kind: 12, children: [] },
      ])
    )
  })

  test('abstract contract members', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(inheritPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtOwned']))).to.deep.equal(
      shape([
        { name: 'owner', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [] },
        { name: 'onlyOwner', kind: 12, children: [] },
        { name: 'transfer', kind: 12, children: [] },
      ])
    )
  })

  test('contract with base constructor arguments lists only its own members', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(inheritPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtService']))).to.deep.equal(
      shape([
        { name: 'created', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [] },
        { name: 'transfer', kind: 12, children: [] },
        { name: 'ping', kind: 12, children: [] },
      ])
    )
  })

  test('contract with a multi-line inheritance list at the top level', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(inheritPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        {
          name: 'CtOwned',
          kind: 5,
          children: [
            { name: 'owner', kind: 7, children: [] },
            { name: 'constructor', kind: 9, children: [] },
            { name: 'onlyOwner', kind: 12, children: [] },
            { name: 'transfer', kind: 12, children: [] },
          ],
        },
        {
          name: 'CtCounted',
          kind: 5,
          children: [
            { name: 'count', kind: 7, children: [] },
            { name: 'constructor', kind: 9, children: [] },
          ],
        },
        { name: 'CtIPing', kind: 11, children: [{ name: 'ping', kind: 12, children: [] }] },
        {
          name: 'CtService',
          kind: 5,
          children: [
            { name: 'created', kind: 7, children: [] },
            { name: 'constructor', kind: 9, children: [] },
            { name: 'transfer', kind: 12, children: [] },
            { name: 'ping', kind: 12, children: [] },
          ],
        },
      ])
    )
  })

  test('members of a contract declared on one line', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(oneLinePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['CtTight']))).to.deep.equal(
      shape([
        { name: 'a', kind: 7, children: [] },
        { name: 'f', kind: 12, children: [] },
      ])
    )
  })

  test('two contracts declared on the same line', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(oneLinePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        {
          name: 'CtTight',
          kind: 5,
          children: [
            { name: 'a', kind: 7, children: [] },
            { name: 'f', kind: 12, children: [] },
          ],
        },
        { name: 'CtTighter', kind: 5, children: [{ name: 'b', kind: 7, children: [] }] },
        { name: 'CtSameLine', kind: 5, children: [{ name: 'g', kind: 12, children: [] }] },
      ])
    )
  })

  test('same-named members stay in their own contract', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(sameNamesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        {
          name: 'CtFirst',
          kind: 5,
          children: [
            { name: 'total', kind: 7, children: [] },
            { name: 'run', kind: 12, children: [] },
          ],
        },
        {
          name: 'CtSecond',
          kind: 5,
          children: [
            { name: 'total', kind: 7, children: [] },
            { name: 'run', kind: 12, children: [{ name: 'step', kind: 13, children: [] }] },
          ],
        },
      ])
    )
  })

  test('file with an import lists only its own contracts', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(derivedPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, []))).to.deep.equal(
      shape([
        {
          name: 'Middle',
          kind: 5,
          children: [
            { name: 'constructor', kind: 9, children: [] },
            { name: 'value', kind: 12, children: [] },
            { name: 'bump', kind: 12, children: [] },
          ],
        },
        {
          name: 'Leaf',
          kind: 5,
          children: [
            { name: 'value', kind: 12, children: [] },
            { name: 'bump', kind: 12, children: [] },
          ],
        },
        { name: 'Fixed', kind: 5, children: [{ name: 'bump', kind: 12, children: [] }] },
        {
          name: 'Factory',
          kind: 5,
          children: [
            {
              name: 'deploy',
              kind: 12,
              children: [
                { name: 'plain', kind: 13, children: [] },
                { name: 'salted', kind: 13, children: [] },
              ],
            },
            { name: 'describe', kind: 12, children: [] },
            { name: 'read', kind: 12, children: [] },
          ],
        },
      ])
    )
  })
})
