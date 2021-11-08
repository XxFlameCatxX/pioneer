import { cryptoWaitReady } from '@polkadot/util-crypto'
import { renderHook } from '@testing-library/react-hooks'
import React from 'react'

import { AccountsContext } from '@/accounts/providers/accounts/context'
import { UseAccounts } from '@/accounts/providers/accounts/provider'
import { useOnBoardingStatus } from '@/common/hooks/useOnBoardingStatus'
import { MembershipContext } from '@/memberships/providers/membership/context'
import { MyMemberships } from '@/memberships/providers/membership/provider'
import { seedMembers } from '@/mocks/data'

import { MockApolloProvider } from '../../_mocks/providers'
import { setupMockServer } from '../../_mocks/server'

describe('useOnBoardingStatus', () => {
  const server = setupMockServer()

  const useMyAccounts: UseAccounts = {
    isLoading: true,
    hasAccounts: false,
    allAccounts: [],
  }
  const useMyMemberships: MyMemberships = {
    active: undefined,
    members: [],
    setActive: (member) => (useMyMemberships.active = member),
    isLoading: true,
    hasMembers: false,
  }

  beforeAll(async () => {
    await cryptoWaitReady()
    seedMembers(server.server)
  })

  it('Loading', async () => {
    const result = await renderUseOnBoardingStatus()
    expect(result.isLoading).toEqual(true)
  })

  describe('Loaded', () => {
    beforeEach(() => {
      useMyAccounts.isLoading = false
      useMyMemberships.isLoading = false
      useMyAccounts.error = undefined
    })

    it('Install plugin', async () => {
      useMyAccounts.error = 'EXTENSION'

      const result = await renderUseOnBoardingStatus()

      expect(result.isLoading).toEqual(false)
      expect(result.status).toEqual('installPlugin')
    })

    it('Add account', async () => {
      const result = await renderUseOnBoardingStatus()

      expect(result.isLoading).toEqual(false)
      expect(result.status).toEqual('addAccount')
    })

    it('Create membership', async () => {
      useMyAccounts.hasAccounts = true
      const result = await renderUseOnBoardingStatus()

      expect(result.isLoading).toEqual(false)
      expect(result.status).toEqual('createMembership')
    })

    it('Finished', async () => {
      useMyAccounts.hasAccounts = true
      useMyMemberships.hasMembers = true
      const result = await renderUseOnBoardingStatus()

      expect(result.isLoading).toEqual(false)
      expect(result.status).toEqual('finished')
    })
  })

  const renderUseOnBoardingStatus = async () => {
    const { result } = renderHook(() => useOnBoardingStatus(), {
      wrapper: ({ children }) => (
        <MockApolloProvider>
          <AccountsContext.Provider value={useMyAccounts}>
            <MembershipContext.Provider value={useMyMemberships}>{children}</MembershipContext.Provider>
          </AccountsContext.Provider>
        </MockApolloProvider>
      ),
    })

    return result.current
  }
})