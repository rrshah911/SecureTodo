export interface Task {
    task_id: string;
    title: string;
    description?: string;
    due_date?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'done';
    labels: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    labels?: string[];
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'todo' | 'in_progress' | 'done';
    labels?: string[];
} 