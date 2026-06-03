export interface TodoistDue {
  date?: string;
  datetime?: string;
  string?: string;
  is_recurring?: boolean;
  lang?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  is_archived?: boolean;
  description?: string;
}

export interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
  section_order?: number;
  is_archived?: boolean;
}

export interface TodoistLabel {
  id: string;
  name: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

export interface TodoistComment {
  id: string;
  content: string;
  posted_at?: string;
  posted_uid?: string;
  task_id?: string;
  project_id?: string;
}

export interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  is_completed: boolean;
  due?: TodoistDue;
  priority: number;
  url: string;
  project_id: string;
  section_id?: string | null;
  labels?: string[];
  note_count?: number;
}

export interface CreateTaskInput {
  content: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
}

export interface UpdateTaskInput {
  content?: string;
  description?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  section_id?: string;
  is_completed?: boolean;
  move?: {
    project_id?: string;
    section_id?: string;
  };
}
