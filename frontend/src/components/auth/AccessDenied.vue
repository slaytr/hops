<script setup lang="ts">
</script>

<template>
  <div class="access-denied">
    <i class="codicon codicon-lock"></i>
    <h1>Access Denied</h1>
    <p>You don't have permission to view this page.</p>
    <p class="hint">Contact your administrator to request access.</p>
  </div>
</template>

<style scoped>
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
  color: var(--color-text);
  text-align: center;
  padding: 3rem;
}

.codicon-lock {
  font-size: 3rem;
  color: var(--color-border);
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin: 0;
}

p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.8;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.6;
}
</style>
