import { useState } from 'react'
import { useDismissOnOutsideClick } from '@/app/hooks/useDismissOnOutsideClick'

export function useProjectMenuState() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useDismissOnOutsideClick({
    openId: openMenuId,
    menuAttr: 'data-project-menu-id',
    buttonAttr: 'data-project-menu-button-id',
    onDismiss: () => setOpenMenuId(null),
  })

  return { openMenuId, setOpenMenuId }
}
