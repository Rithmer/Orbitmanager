import { useDismissOnOutsideClick } from '@/app/hooks/useDismissOnOutsideClick'

export function useBoardTaskMenuDismiss(
  openedTaskMenuId: number | null,
  setOpenedTaskMenuId: (id: number | null) => void,
) {
  useDismissOnOutsideClick({
    openId: openedTaskMenuId,
    menuAttr: 'data-task-menu-id',
    buttonAttr: 'data-task-menu-button-id',
    onDismiss: () => setOpenedTaskMenuId(null),
  })
}
