import { expect } from 'chai'
import { test } from 'mocha'
import { DocumentSymbol } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath } from '../../../../helpers'

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

describe('[hardhat] documentSymbol bug - Slang rejects transient as a name from 0.8.27, which solc still accepts', () => {
  let transientNamePath: string

  before(async () => {
    client = await getInitializedClient()
    transientNamePath = getProjectPath('hardhat/contracts/document-symbols/bugs/transient-identifier/TransientName.sol')

    await client.openDocument(transientNamePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only setTransient and its local previous, without the state variable transient.
  test.skip('state variable named transient', async () => {
    const symbols = (await client.getDocumentSymbols(toUri(transientNamePath))) as DocumentSymbol[] | null

    expect(shape(at(symbols, ['TransientName']))).to.deep.equal(
      shape([
        { name: 'transient', kind: 7, children: [] },
        { name: 'setTransient', kind: 12, children: [{ name: 'previous', kind: 13, children: [] }] },
      ])
    )
  })
})
