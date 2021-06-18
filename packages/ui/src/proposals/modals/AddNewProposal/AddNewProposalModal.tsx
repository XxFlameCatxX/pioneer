import { ApiRx } from '@polkadot/api'
import React, { useEffect, useMemo, useState } from 'react'

import { useTransactionFee } from '@/accounts/hooks/useTransactionFee'
import { InsufficientFundsModal } from '@/accounts/modals/InsufficientFundsModal'
import { FailureModal } from '@/common/components/FailureModal'
import { useApi } from '@/common/hooks/useApi'
import { useModal } from '@/common/hooks/useModal'
import { useMyMemberships } from '@/memberships/hooks/useMyMemberships'
import { SwitchMemberModalCall } from '@/memberships/modals/SwitchMemberModal'
import { AddNewProposalWarningModal } from '@/proposals/modals/AddNewProposal/AddNewProposalWarningModal'

import { AddNewProposalModalCall, AddProposalModalState } from '.'

export type NewProposalParams = Exclude<
  Parameters<ApiRx['tx']['proposalsCodex']['createProposal']>[0],
  string | Uint8Array
>

export const AddNewProposalModal = () => {
  const { api } = useApi()
  const { active: member } = useMyMemberships()
  const { hideModal, showModal } = useModal<AddNewProposalModalCall>()
  const [state, setState] = useState<AddProposalModalState>('REQUIREMENTS_CHECK')

  const [txParams] = useState<NewProposalParams>({
    member_id: member?.id,
    title: '',
    description: '',
    staking_account_id: member?.controllerAccount,
  })

  const transaction = useMemo(() => {
    if (member && txParams && api) {
      return api.tx.proposalsCodex.createProposal(txParams, { Signal: '' })
    }
  }, [api, JSON.stringify(txParams)])
  const feeInfo = useTransactionFee(member?.controllerAccount, transaction)

  useEffect(() => {
    if (state !== 'REQUIREMENTS_CHECK') {
      return
    }

    if (!member) {
      return showModal<SwitchMemberModalCall>({ modal: 'SwitchMember' })
    }

    if (feeInfo && feeInfo.canAfford) {
      return setState('WARNING')
    }

    if (feeInfo && !feeInfo.canAfford) {
      setState('REQUIREMENTS_FAIL')
    }
  }, [state, member?.id, JSON.stringify(feeInfo)])

  if (!member || !feeInfo) {
    return null
  }

  if (state === 'REQUIREMENTS_FAIL') {
    return (
      <InsufficientFundsModal onClose={hideModal} address={member.controllerAccount} amount={feeInfo.transactionFee} />
    )
  }

  if (state === 'WARNING') {
    return <AddNewProposalWarningModal onNext={() => setState('PREPARE')} />
  }

  return <FailureModal onClose={hideModal}>There was a problem with creating proposal.</FailureModal>
}