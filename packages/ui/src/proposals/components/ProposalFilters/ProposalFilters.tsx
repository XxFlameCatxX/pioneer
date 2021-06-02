import React, { useMemo, useReducer } from 'react'
import styled from 'styled-components'

import { DatePicker } from '@/common/components/forms/DatePicker'
import { FilterBox } from '@/common/components/forms/FilterBox'
import { SimpleSelect } from '@/common/components/selects'
import { PartialDateRange } from '@/common/types/Dates'
import { indexList, objectEquals } from '@/common/utils'
import { Member } from '@/memberships/types'
import { ProposalStage } from '@/proposals/types'

export interface ProposalFiltersState {
  search: string
  stage: ProposalStage | null
  type: string | null
  lifetime: PartialDateRange
  proposer: Member | null
}
type FilterKey = keyof ProposalFiltersState

type Clear = { type: 'clear' }
type Change<K extends FilterKey = FilterKey> = K extends FilterKey // Use a conditional type in order to distribue the union type
  ? { type: 'change'; field: K; value: ProposalFiltersState[K] }
  : never
type Action = Clear | Change

const filterReducer = (filters: ProposalFiltersState, action: Action): ProposalFiltersState => {
  switch (action.type) {
    case 'clear':
      return ProposalEmptyFilter

    case 'change':
      return { ...filters, [action.field]: action.value }
  }
  return filters
}

export const ProposalEmptyFilter: ProposalFiltersState = {
  search: '',
  type: null,
  lifetime: undefined,
  proposer: null,
  stage: null,
}

const isFilterEmpty = objectEquals(ProposalEmptyFilter)

export interface ProposalFiltersProps {
  searchSlot: React.RefObject<HTMLDivElement>
  types: string[]
  withinDates?: PartialDateRange
  proposers: Member[]
  stages: ProposalStage[]
  onApply: (value: ProposalFiltersState) => void
}

export const ProposalFilters = ({
  searchSlot,
  stages,
  types,
  withinDates,
  proposers,
  onApply,
}: ProposalFiltersProps) => {
  const [filters, dispatch] = useReducer(filterReducer, ProposalEmptyFilter)
  const { search, stage, type, lifetime, proposer } = filters

  const typesOptions = useMemo(() => ({ All: null, ...indexList(types) }), [types])
  const proposersOptions = useMemo(() => ({ All: null, ...indexList(proposers, ({ handle }) => handle) }), [proposers])
  const stagesOptions = useMemo(() => ({ All: null, ...indexList(stages) }), [stages])

  const apply = () => onApply(filters)
  const clear = useMemo(
    () =>
      isFilterEmpty(filters)
        ? undefined
        : () => {
            dispatch({ type: 'clear' })
            onApply(ProposalEmptyFilter)
          },
    [onApply, filters]
  )

  return (
    <FilterBox
      search={search}
      searchSlot={searchSlot}
      onApply={apply}
      onClear={clear}
      onSearch={(value) => {
        dispatch({ type: 'change', field: 'search', value })
      }}
    >
      <Fields>
        <SimpleSelect
          title="Type"
          options={typesOptions}
          value={type}
          onChange={(value) => {
            dispatch({ type: 'change', field: 'type', value })
          }}
        />

        <DatePicker
          title="Lifetime"
          value={lifetime}
          withinDates={withinDates}
          onChange={(value) => {
            dispatch({ type: 'change', field: 'lifetime', value })
          }}
          onApply={apply}
          onClear={() => {
            dispatch({ type: 'change', field: 'lifetime', value: undefined })
            onApply({ ...filters, lifetime: undefined })
          }}
        />

        <SimpleSelect
          title="Proposer"
          options={proposersOptions}
          value={proposer}
          onChange={(value) => {
            dispatch({ type: 'change', field: 'proposer', value })
          }}
        />

        <SimpleSelect
          title="Stage"
          options={stagesOptions}
          value={stage}
          onChange={(value) => {
            dispatch({ type: 'change', field: 'stage', value })
          }}
        />
      </Fields>
    </FilterBox>
  )
}

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: center;
  gap: 16px;
  max-width: 1600px;
`