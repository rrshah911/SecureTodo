import axios from 'axios';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { auth } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Cognito token to requests
api.interceptors.request.use(async (config) => {
    try {
        const session = await auth.getCurrentUser();
        if (session) {
            const token = await auth.getToken();
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Redirect to login if no session
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error getting auth token:', error);
        // Redirect to login on auth error
        window.location.href = '/login';
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, try to refresh
            try {
                const session = await auth.getCurrentUser();
                if (session) {
                    const token = await auth.getToken();
                    error.config.headers.Authorization = `Bearer ${token}`;
                    return api.request(error.config);
                }
            } catch (refreshError) {
                // If refresh fails, redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Tasks API
export const tasksApi = {
    // Get all tasks with optional filters
    getTasks: (params?: { status?: string; sort_by?: string; search?: string }) =>
        api.get<Task[]>('/tasks', { params }),
    
    // Create a new task
    createTask: (task: CreateTaskInput) =>
        api.post<Task>('/tasks', task),
    
    // Update a task
    updateTask: (taskId: string, updates: UpdateTaskInput) =>
        api.put<Task>(`/tasks/${taskId}`, updates),
    
    // Delete a task
    deleteTask: (taskId: string) =>
        api.delete(`/tasks/${taskId}`),
};

export default api; 