type CalendarPageLoadingStateProps = {
  pageBg: string
}

export function CalendarPageLoadingState({ pageBg }: CalendarPageLoadingStateProps) {
  return (
    <div className={`${pageBg} min-h-full flex items-center justify-center`}>
      <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
