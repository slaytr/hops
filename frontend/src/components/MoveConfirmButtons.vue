<script setup lang="ts">
interface Props {
  position: { top: string; left: string }
  loading?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="confirm-buttons-container" :style="position" @click.stop>
    <button class="btn-confirm" @click="handleConfirm" :disabled="loading">
      ✓ Confirm
    </button>
    <button class="btn-cancel" @click="handleCancel" :disabled="loading">
      ✕ Cancel
    </button>
  </div>
</template>

<style scoped>
.confirm-buttons-container {
  position: fixed;
  display: flex;
  gap: 0.5rem;
  z-index: 1002;
  background: white;
  padding: 0.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
}

.btn-confirm,
.btn-cancel {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm {
  background: #4caf50;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #388e3c;
  transform: translateY(-1px);
}

.btn-cancel {
  background: #e53935;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #c62828;
  transform: translateY(-1px);
}

.btn-confirm:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-confirm:active:not(:disabled),
.btn-cancel:active:not(:disabled) {
  transform: translateY(0);
}
</style>
