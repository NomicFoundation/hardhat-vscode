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

describe('[foundry] documentSymbol - locals (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let returnsPath: string

  before(async () => {
    client = await getInitializedClient()
    returnsPath = getProjectPath('foundry/src/document-symbols/locals/Returns.sol')

    await client.openDocument(returnsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns destructure with no children, since tuple declarations list no locals.
  test.skip('locals of a tuple declaration, including one after an empty slot', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(returnsPath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['LcReturns', 'destructure']))).to.deep.equal(
      shape([
        { name: 'first', kind: 13, children: [] },
        { name: 'second', kind: 13, children: [] },
        { name: 'flag', kind: 13, children: [] },
      ])
    )
  })
})
