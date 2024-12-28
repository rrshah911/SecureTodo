import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Box,
    Menu,
    MenuItem,
    FormControl,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../services/api';
import { Task, UpdateTaskInput } from '../../types/task';

interface TaskItemProps {
    task: Task;
    onEdit?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const queryClient = useQueryClient();

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, updates }: { taskId: string; updates: UpdateTaskInput }) =>
            tasksApi.updateTask(taskId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleStatusChange = (event: SelectChangeEvent) => {
        updateTaskMutation.mutate({
            taskId: task.task_id,
            updates: { status: event.target.value as Task['status'] }
        });
    };

    const handleDelete = () => {
        handleMenuClose();
        deleteTaskMutation.mutate(task.task_id);
    };

    const handleEdit = () => {
        handleMenuClose();
        onEdit?.(task);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h6" component="div">
                            {task.title}
                        </Typography>
                        {task.description && (
                            <Typography color="textSecondary" sx={{ mt: 1 }}>
                                {task.description}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value={task.status}
                            onChange={handleStatusChange}
                            variant="outlined"
                        >
                            <MenuItem value="todo">Todo</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="done">Done</MenuItem>
                        </Select>
                    </FormControl>

                    <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                    />

                    {task.due_date && (
                        <Typography variant="body2" color="textSecondary">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                        </Typography>
                    )}
                </Box>

                {task.labels.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {task.labels.map((label, index) => (
                            <Chip
                                key={index}
                                label={label}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                )}
            </CardContent>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Card>
    );
};

export default TaskItem; 