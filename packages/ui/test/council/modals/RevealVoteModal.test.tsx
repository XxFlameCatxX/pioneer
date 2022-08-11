import { cryptoWaitReady } from '@polkadot/util-crypto'
import { fireEvent, render, screen } from '@testing-library/react'
import BN from 'bn.js'
import React from 'react'

import { ApiContext } from '@/common/providers/api/context'
import { ModalContext } from '@/common/providers/modal/context'
import { ModalCallData, UseModal } from '@/common/providers/modal/types'
import { RevealVoteModal, RevealVoteModalCall } from '@/council/modals/RevealVote'

import { getButton } from '../../_helpers/getButton'
import { alice, bob } from '../../_mocks/keyring'
import { MockApolloProvider, MockKeyringProvider } from '../../_mocks/providers'
import {
  currentStubErrorMessage,
  stubAccounts,
  stubApi,
  stubTransaction,
  stubTransactionFailure,
  stubTransactionSuccess,
} from '../../_mocks/transactions'
import { mockedTransactionFee } from '../../setup'

describe('UI: RevealVoteModal', () => {
  const api = stubApi()
  const txPath = 'api.tx.referendum.revealVote'
  let tx: any

  stubTransaction(api, txPath)

  const voteData = {
    salt: '0x7a0c114de774424abcd5d60fc58658a35341c9181b09e94a16dfff7ba2192206',
    accountId: alice.address,
    optionId: '1',
  }

  const modalData: ModalCallData<RevealVoteModalCall> = {
    votes: [voteData],
    voteForHandle: 'Dave',
  }

  const useModal: UseModal<any> = {
    hideModal: jest.fn(),
    showModal: jest.fn(),
    modal: null,
    modalData,
  }

  beforeAll(async () => {
    stubAccounts([
      { ...alice, name: 'Alice Account' },
      { ...bob, name: 'Bob Account' },
    ])
    await cryptoWaitReady()
  })

  beforeEach(() => {
    modalData.votes = [voteData]
    tx = stubTransaction(api, txPath, 10)
    mockedTransactionFee.transaction = tx as any
    mockedTransactionFee.feeInfo = { transactionFee: new BN(10), canAfford: true }
  })

  it('Requirements check failed', async () => {
    mockedTransactionFee.feeInfo = { transactionFee: new BN(10000), canAfford: false }
    renderModal()
    expect(await screen.findByText('modals.insufficientFunds.title')).toBeDefined()
  })

  it('Transaction step', async () => {
    tx = stubTransaction(api, txPath, 10)
    renderModal()
    expect((await screen.findByText(/You intend to reveal your vote for/)).textContent).toEqual(
      'You intend to reveal your vote for Dave.'
    )
    expect(await screen.findByText('Alice Account')).toBeDefined()
  })

  it('Transaction success', async () => {
    stubTransactionSuccess(tx, 'referendum', 'VoteRevealed')
    renderModal()

    fireEvent.click(await getButton('Sign and reveal'))

    expect(await screen.findByText('You have just successfully revelead your vote for Dave.')).toBeDefined()
  })

  it('Transaction error', async () => {
    stubTransactionFailure(tx)
    renderModal()

    fireEvent.click(await getButton('Sign and reveal'))

    expect(await screen.findByText(currentStubErrorMessage)).toBeDefined()
  })

  it('Multiple votes for the same candidate', async () => {
    modalData.votes = [voteData, { ...voteData, accountId: bob.address }]
    renderModal()

    expect(await screen.findByText('Choose the vote you want to reveal.')).toBeDefined()
    expect(await screen.findByText('Alice Account')).toBeDefined()
    const bobVote = await screen.findByText('Bob Account')
    expect(bobVote).toBeDefined()

    fireEvent.click(bobVote)
    expect((await screen.findByText(/You intend to reveal your vote for/)).textContent).toEqual(
      'You intend to reveal your vote for Dave.'
    )
    expect(await screen.findByText('Bob Account')).toBeDefined()
  })

  const renderModal = () =>
    render(
      <MockApolloProvider>
        <ModalContext.Provider value={useModal}>
          <MockKeyringProvider>
            <ApiContext.Provider value={api}>
              <RevealVoteModal />
            </ApiContext.Provider>
          </MockKeyringProvider>
        </ModalContext.Provider>
      </MockApolloProvider>
    )
})
