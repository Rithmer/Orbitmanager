import { useEffect } from 'react'

type Params = {
  openId: number | null
  menuAttr: string
  buttonAttr: string
  onDismiss: () => void
}

export function useDismissOnOutsideClick({ openId, menuAttr, buttonAttr, onDismiss }: Params) {
  useEffect(() => {
    if (openId === null) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }

      const clickedMenu = target.closest(`[${menuAttr}="${openId}"]`)
      const clickedButton = target.closest(`[${buttonAttr}="${openId}"]`)

      if (!clickedMenu && !clickedButton) {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [buttonAttr, menuAttr, onDismiss, openId])
}
