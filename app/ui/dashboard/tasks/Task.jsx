'use client';
import { useState, useEffect } from 'react';

import { getTasks } from '@/app/lib/actions';
import TaskForm from '../../forms/task/task';
import TaskTable from '../table/TaskTable';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadTasks = async () => {
    setLoading(true);
    const data = await getTasks();
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    reloadTasks();
  }, []);

  return (
    <div className="space-y-8">
      <TaskForm onTaskCreated={reloadTasks} />
      <TaskTable tasks={tasks} loading={loading} reloadTasks={reloadTasks} />
    </div>
  );
};

export default TasksPage;
