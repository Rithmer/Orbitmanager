export interface CalendarEvent {
  id: number;
  userId: number;
  projectId: number | null;
  taskId: number | null;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}
