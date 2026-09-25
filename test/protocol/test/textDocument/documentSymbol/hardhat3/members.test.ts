import { expect } from 'chai'
import { test } from 'mocha'
import { DocumentSymbol } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
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

describe('[hardhat3] documentSymbol - members', () => {
  let stateVarsPath: string
  let transientPath: string
  let specialsPath: string
  let functionsPath: string
  let modifiersPath: string
  let overridesPath: string

  before(async () => {
    client = await getInitializedClient()
    stateVarsPath = getProjectPath('hardhat3/contracts/document-symbols/members/StateVariables.sol')
    transientPath = getProjectPath('hardhat3/contracts/document-symbols/members/Transient.sol')
    specialsPath = getProjectPath('hardhat3/contracts/document-symbols/members/SpecialFunctions.sol')
    functionsPath = getProjectPath('hardhat3/contracts/document-symbols/members/Functions.sol')
    modifiersPath = getProjectPath('hardhat3/contracts/document-symbols/members/Modifiers.sol')
    overridesPath = getProjectPath('hardhat3/contracts/document-symbols/members/Overrides.sol')

    await client.openDocument(stateVarsPath)
    await client.openDocument(transientPath)
    await client.openDocument(specialsPath)
    await client.openDocument(functionsPath)
    await client.openDocument(modifiersPath)
    await client.openDocument(overridesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('state variables of every visibility, public getters included, as properties', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(stateVarsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbStateVars']))).to.deep.equal(
      shape([
        { name: 'plain', kind: 7, children: [] },
        { name: 'publicCounter', kind: 7, children: [] },
        { name: 'secret', kind: 7, children: [] },
        { name: 'flag', kind: 7, children: [] },
        { name: 'balances', kind: 7, children: [] },
        { name: 'history', kind: 7, children: [] },
        { name: 'target', kind: 7, children: [] },
        { name: 'handler', kind: 7, children: [] },
        { name: 'name', kind: 7, children: [] },
      ])
    )
  })

  test('contract constants listed as properties, with immutables and the constructor', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(stateVarsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbConstants']))).to.deep.equal(
      shape([
        { name: 'MAX_SUPPLY', kind: 7, children: [] },
        { name: 'FEE_BPS', kind: 7, children: [] },
        { name: 'SALT', kind: 7, children: [] },
        { name: 'deployer', kind: 7, children: [] },
        { name: 'createdAt', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [] },
      ])
    )
  })

  test('transient variables, and a constant listed as a property', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(transientPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbTransient']))).to.deep.equal(
      shape([
        { name: 'lockDepth', kind: 7, children: [] },
        { name: 'entered', kind: 7, children: [] },
        { name: 'owner', kind: 7, children: [] },
        { name: 'LIMIT', kind: 7, children: [] },
      ])
    )
  })

  test('constructor, fallback and receive', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(specialsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbSpecials']))).to.deep.equal(
      shape([
        { name: 'received', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [] },
        { name: 'fallback', kind: 12, children: [] },
        { name: 'receive', kind: 12, children: [] },
      ])
    )
  })

  test('locals of the constructor, fallback and receive, without parameters', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(specialsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbSpecialLocals']))).to.deep.equal(
      shape([
        { name: 'total', kind: 7, children: [] },
        { name: 'constructor', kind: 9, children: [{ name: 'doubled', kind: 13, children: [] }] },
        { name: 'fallback', kind: 12, children: [{ name: 'size', kind: 13, children: [] }] },
        { name: 'receive', kind: 12, children: [{ name: 'amount', kind: 13, children: [] }] },
      ])
    )
  })

  test('constructor calling a base constructor', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(specialsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbChild']))).to.deep.equal(shape([{ name: 'constructor', kind: 9, children: [] }]))
  })

  test('functions of every visibility and mutability', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(functionsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbVisibility']))).to.deep.equal(
      shape([
        { name: 'extFn', kind: 12, children: [] },
        { name: 'pubFn', kind: 12, children: [] },
        { name: 'intFn', kind: 12, children: [] },
        { name: 'privFn', kind: 12, children: [] },
        { name: 'pureFn', kind: 12, children: [] },
        { name: 'viewFn', kind: 12, children: [] },
        { name: 'payFn', kind: 12, children: [] },
        { name: 'unnamedParams', kind: 12, children: [] },
      ])
    )
  })

  test('each overload listed', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(functionsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbOverloads']))).to.deep.equal(
      shape([
        { name: 'add', kind: 12, children: [] },
        { name: 'add', kind: 12, children: [] },
        { name: 'add', kind: 12, children: [] },
      ])
    )
  })

  test('overloads keep their own locals', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(functionsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbOverloadLocals']))).to.deep.equal(
      shape([
        { name: 'pick', kind: 12, children: [{ name: 'fromNumber', kind: 13, children: [] }] },
        { name: 'pick', kind: 12, children: [{ name: 'fromAddress', kind: 13, children: [] }] },
        { name: 'pick', kind: 12, children: [] },
      ])
    )
  })

  test('virtual modifiers, with and without a body', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(modifiersPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbModifierBase']))).to.deep.equal(
      shape([
        { name: 'onlyOwner', kind: 12, children: [] },
        { name: 'atLeast', kind: 12, children: [] },
      ])
    )
  })

  test('overriding, parameterised and paren-less modifiers', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(modifiersPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbModifiers']))).to.deep.equal(
      shape([
        { name: 'owner', kind: 7, children: [] },
        { name: 'onlyOwner', kind: 12, children: [] },
        { name: 'atLeast', kind: 12, children: [{ name: 'scaled', kind: 13, children: [] }] },
        { name: 'bare', kind: 12, children: [] },
        { name: 'guarded', kind: 12, children: [] },
      ])
    )
  })

  test('unimplemented virtual functions', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(overridesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbShapeBase']))).to.deep.equal(
      shape([
        { name: 'describe', kind: 12, children: [] },
        { name: 'hook', kind: 12, children: [] },
        { name: 'scale', kind: 12, children: [] },
        { name: 'id', kind: 12, children: [] },
      ])
    )
  })

  test('overriding functions and public state variables', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(overridesPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['MbSquare']))).to.deep.equal(
      shape([
        { name: 'area', kind: 7, children: [] },
        { name: 'label', kind: 7, children: [] },
        { name: 'describe', kind: 12, children: [] },
        { name: 'hook', kind: 12, children: [] },
        { name: 'scale', kind: 12, children: [] },
        { name: 'scale', kind: 12, children: [] },
        { name: 'id', kind: 12, children: [] },
      ])
    )
  })
})
