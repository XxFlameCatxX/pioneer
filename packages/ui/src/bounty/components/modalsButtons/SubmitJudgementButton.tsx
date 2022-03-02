import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SubmitJudgementModalCall } from '@/bounty/modals/SubmitJudgementModal'
import { Bounty } from '@/bounty/types/Bounty'
import { TransactionButton } from '@/common/components/buttons/TransactionButton'
import { useModal } from '@/common/hooks/useModal'

interface Props {
  bounty: Bounty
}

export const SubmitJudgementButton = ({ bounty }: Props) => {
  const { t } = useTranslation('bounty')
  const { showModal } = useModal()

  const openSubmitJudgementModal = useCallback(() => {
    showModal<SubmitJudgementModalCall>({
      modal: 'SubmitJudgementModal',
      data: {
        bounty,
      },
    })
  }, [bounty])

  return (
    <TransactionButton style="primary" size="large" onClick={openSubmitJudgementModal}>
      {t('buttons.submitJudgement')}
    </TransactionButton>
  )
}