const LAST_BOARD_PROJECT_STORAGE_KEY = 'orbitmanager:lastBoardProjectId'

/** Событие в том же окне после изменения сохранённого проекта доски (навигация в Layout). */
export const LAST_BOARD_PROJECT_CHANGED_EVENT = 'orbitmanager:lastBoardProjectChanged'

export function readLastBoardProjectId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BOARD_PROJECT_STORAGE_KEY)
    const n = raw ? Number(raw) : NaN
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function persistLastBoardProjectId(id: number) {
  try {
    localStorage.setItem(LAST_BOARD_PROJECT_STORAGE_KEY, String(id))
    window.dispatchEvent(new CustomEvent(LAST_BOARD_PROJECT_CHANGED_EVENT))
  } catch {
  }
}

export function clearLastBoardProjectId() {
  try {
    localStorage.removeItem(LAST_BOARD_PROJECT_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(LAST_BOARD_PROJECT_CHANGED_EVENT))
  } catch {
  }
}
