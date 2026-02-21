<script setup lang="ts">
import { useTaskManager } from '../../composables/useTaskManager'
import TaskManagerForm from './TaskManagerForm.vue'
import TaskManagerList from './TaskManagerList.vue'

const {
  tasks,
  rooms,
  staffUsers,
  loading,
  error,
  editingTask,
  isMultiDay,
  formData,
  dateFilter,
  statusFilter,
  userFilter,
  fetchTasks,
  resetForm,
  addTask,
  startEdit,
  updateTask,
  deleteTask,
  updateTaskStatus
} = useTaskManager()

const handleSubmit = () => (editingTask.value ? updateTask() : addTask())
</script>

<template>
  <div class="housekeeping-manager">
    <h1>Task Management</h1>

    <TaskManagerForm
      :formData="formData"
      :editingTask="editingTask"
      :isMultiDay="isMultiDay"
      :loading="loading"
      :error="error"
      :rooms="rooms"
      :staffUsers="staffUsers"
      @submit="handleSubmit"
      @cancel="resetForm"
      @update:isMultiDay="(val) => (isMultiDay = val)"
    />

    <TaskManagerList
      :tasks="tasks"
      :loading="loading"
      :dateFilter="dateFilter"
      :statusFilter="statusFilter"
      :userFilter="userFilter"
      :staffUsers="staffUsers"
      @update:dateFilter="(val) => (dateFilter = val)"
      @update:statusFilter="(val) => (statusFilter = val)"
      @update:userFilter="(val) => (userFilter = val)"
      @filter="fetchTasks"
      @edit="startEdit"
      @delete="deleteTask"
      @start="(task) => updateTaskStatus(task, 'in_progress')"
      @complete="(task) => updateTaskStatus(task, 'completed')"
    />
  </div>
</template>

<style scoped>
.housekeeping-manager {
  width: 100%;
  padding: 1rem;
}

h1 {
  color: var(--color-heading);
  margin-bottom: 1rem;
  font-size: 1.25rem;
}
</style>
