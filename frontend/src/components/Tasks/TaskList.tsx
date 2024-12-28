import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../services/api'
import { Task } from '../../types/task'

interface TaskListProps {
  onAddTask: () => void
  onEditTask: (task: Task) => void
}

export default function TaskList({ onAddTask, onEditTask }: TaskListProps) {
  const [status, setStatus] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [search, setSearch] = useState<string>('')

  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', { status, sortBy, search }],
    queryFn: () => tasksApi.getTasks({ status, sort_by: sortBy, search }).then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          My Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTask}
          sx={{ px: 3 }}
        >
          Add Task
        </Button>
      </Box>

      <Card sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Select
              fullWidth
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Select
              fullWidth
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="created_at">Created Date</MenuItem>
              <MenuItem value="due_date">Due Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Typography>Loading tasks...</Typography>
        ) : tasks.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No tasks found</Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} key={task.task_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {task.title}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => onEditTask(task)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(task.task_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {task.description && (
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {task.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        color={task.status === 'done' ? 'success' : 'default'}
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                      />
                      {task.due_date && (
                        <Chip
                          label={new Date(task.due_date).toLocaleDateString()}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {task.labels?.map((label) => (
                        <Chip key={label} label={label} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  )
} 