import { useEffect, useMemo, useState } from 'react'

import { Button } from '@egov/ui/primitives/Button'
import { Select } from '@egov/ui/primitives/Select'

import { useDartaStore, useUIStore } from '@egov/state-core'



export function TriageInbox() {
  const selectedDarta = useDartaStore((state) => state.selectedDarta)
  const selectDarta = useDartaStore((state) => state.selectDarta)
  const addToast = useUIStore((state) => state.addToast)

  return (<div></div>)
}
