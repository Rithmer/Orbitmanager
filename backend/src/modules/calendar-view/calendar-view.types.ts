export interface CalendarViewProjectDto {
  id: number;
  name: string;
  teamId: number;
}

export interface CalendarViewTaskDto {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  description: string;
  deadline: string;
  status: string;
  difficulty: number;
}

export interface CalendarViewEventDto {
  id: number;
  userId: number;
  projectId: number | null;
  projectName: string | null;
  taskId: number | null;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
}

export interface CalendarMonthViewResponseDto {
  year: number;
  month: number;
  projects: CalendarViewProjectDto[];
  tasks: CalendarViewTaskDto[];
  events: CalendarViewEventDto[];
}
