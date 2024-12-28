import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Chip,
    SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../services/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../types/task';

interface TaskFormProps {
    open: boolean;
    onClose: () => void;
    task?: Task;
}

const TaskForm: React.FC<TaskFormProps> = ({ open, onClose, task }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState('');

    const queryClient = useQueryClient();

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setDueDate(task.due_date ? new Date(task.due_date) : null);
            setPriority(task.priority);
            setLabels(task.labels);
        }
    }, [task]);

    const createTaskMutation = useMutation({
        mutationFn: (newTask: CreateTaskInput) => tasksApi.createTask(newTask),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            handleClose();
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, updates }: { taskId: string; updates: UpdateTaskInput }) =>
            tasksApi.updateTask(taskId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            handleClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const taskData = {
            title,
            description: description || undefined,
            due_date: dueDate?.toISOString(),
            priority,
            labels,
        };

        if (task) {
            updateTaskMutation.mutate({
                taskId: task.task_id,
                updates: taskData,
            });
        } else {
            createTaskMutation.mutate(taskData);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setDueDate(null);
        setPriority('medium');
        setLabels([]);
        setNewLabel('');
        onClose();
    };

    const handleAddLabel = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newLabel.trim()) {
            e.preventDefault();
            setLabels([...labels, newLabel.trim()]);
            setNewLabel('');
        }
    };

    const handleRemoveLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                        />

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Due Date"
                                value={dueDate}
                                onChange={(newValue: Date | null) => setDueDate(newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>

                        <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={priority}
                                label="Priority"
                                onChange={(e: SelectChangeEvent) => 
                                    setPriority(e.target.value as 'low' | 'medium' | 'high')}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Add Labels (Press Enter)"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyPress={handleAddLabel}
                            fullWidth
                        />

                        {labels.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {labels.map((label, index) => (
                                    <Chip
                                        key={index}
                                        label={label}
                                        onDelete={() => handleRemoveLabel(label)}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {task ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TaskForm; 