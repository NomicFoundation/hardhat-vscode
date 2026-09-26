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

describe('[hardhat3] documentSymbol - file-level (not implemented)', () => {
  let freeLocalsPath: string

  before(async () => {
    client = await getInitializedClient()
    freeLocalsPath = getProjectPath('hardhat3/contracts/document-symbols/file-level/FlFreeLocals.sol')

    await client.openDocument(freeLocalsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: lists flTuple with no children, since tuple declarations are not read.
  test.skip('free function locals from tuple declarations', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(freeLocalsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['flTuple']))).to.deep.equal(
      shape([
        { name: 'first', kind: 13, children: [] },
        { name: 'second', kind: 13, children: [] },
        { name: 'onlyLo', kind: 13, children: [] },
      ])
    )
  })
})
