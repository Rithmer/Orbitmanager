import { ErrorMessage } from '@/app/components/Modal'

export function ProjectsErrorState({ message }: { message: string }) {
  return <ErrorMessage message={message} />
}
