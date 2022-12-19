import { expect } from 'chai'
import { buildClient } from '../client'
import initializeResult from './data/initializeResult.json'

describe('initialize', () => {
  it('should return InitializeResult with capabilities', async () => {
    const client = buildClient(__dirname)
    client.start()
    const result = await client.initialize()
    client.stop()

    expect(result).deep.equals(initializeResult)
  })
})
