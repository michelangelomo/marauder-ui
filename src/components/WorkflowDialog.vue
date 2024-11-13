<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      class="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
      <!-- Header - Fixed -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-xl font-bold">{{ workflow.name }}</h2>
          <p class="text-gray-600 text-sm mt-1">{{ workflow.description }}</p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded flex-shrink-0">
          ✕
        </button>
      </div>

      <!-- Steps - Scrollable -->
      <div class="flex-1 overflow-y-auto min-h-0 mb-6">
        <div class="space-y-4">
          <div v-for="(step, index) in workflow.steps" :key="index"
            class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div
              class="w-6 h-6 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-sm font-bold">
              {{ index + 1 }}
            </div>
            <div class="flex-1 space-y-2">
              <p class="text-sm">{{ step.description }}</p>

              <!-- Command preview -->
              <div class="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                {{ getFormattedCommand(step) }}
              </div>

              <!-- Input fields -->
              <div v-if="step.requiresInput" class="space-y-2">
                <!-- First input -->
                <div class="space-y-1">
                  <label class="text-sm font-medium text-gray-700">{{ step.inputLabel }}</label>
                  <input v-model="inputs[index]" type="text" :placeholder="step.placeholder"
                    class="w-full px-3 py-2 text-sm bg-white rounded border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <p v-if="step.help" class="text-xs text-gray-500">{{ step.help }}</p>
                </div>

                <!-- Second input if required -->
                <div v-if="step.requiresSecondInput" class="space-y-1">
                  <label class="text-sm font-medium text-gray-700">{{ step.secondInputLabel }}</label>
                  <input v-model="secondInputs[index]" type="text" :placeholder="step.secondPlaceholder"
                    class="w-full px-3 py-2 text-sm bg-white rounded border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions - Fixed at bottom -->
      <div class="flex justify-between items-center pt-4 border-t border-gray-200">
        <!-- Warning for destructive workflows -->
        <div v-if="isDestructiveWorkflow" class="text-sm text-orange-600">
          ⚠️ This workflow may disrupt network connectivity
        </div>

        <div class="flex space-x-4">
          <button @click="$emit('close')"
            class="px-4 py-2 text-sm font-bold bg-gray-100 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Cancel
          </button>
          <button @click="executeWorkflow" :disabled="!isValid"
            class="px-4 py-2 text-sm font-bold bg-blue-500 text-white rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed">
            Execute Workflow
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #CBD5E1;
  border-radius: 3px;
}

/* Smooth scrolling */
.overflow-y-auto {
  scroll-behavior: smooth;
}
</style>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  workflow: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'execute'])

const inputs = ref({})
const secondInputs = ref({})

const isDestructiveWorkflow = computed(() => {
  return props.workflow.id.includes('deauth') ||
    props.workflow.id.includes('attack') ||
    props.workflow.id.includes('spam')
})

const isValid = computed(() => {
  return props.workflow.steps.every((step, index) => {
    if (step.requiresInput) {
      if (!inputs.value[index]?.trim()) return false
      if (step.requiresSecondInput && !secondInputs.value[index]?.trim()) return false
    }
    return true
  })
})

const getFormattedCommand = (step) => {
  if (!step.requiresInput) return step.command

  const index = props.workflow.steps.indexOf(step)
  let command = step.command

  // Handle special case for SSID generation
  if (step.command.includes('{type}') && step.command.includes('{value}')) {
    const [type, value] = (inputs.value[index] || '').split(' ')
    command = command.replace('{type}', type || '{type}')
    command = command.replace('{value}', value || '{value}')
    return command
  }

  // Replace all other placeholders
  command = command.replace(/{([^}]+)}/g, (match, key) => {
    if (key === 'source' || key === 'dest') {
      return secondInputs.value[index] || `{${key}}`
    }
    return inputs.value[index] || `{${key}}`
  })

  return command
}

const executeWorkflow = () => {
  const commands = props.workflow.steps.map(step => {
    if (!step.requiresInput) return step.command

    const index = props.workflow.steps.indexOf(step)
    let command = step.command

    // Handle special case for SSID generation
    if (step.command.includes('{type}') && step.command.includes('{value}')) {
      const [type, value] = inputs.value[index].split(' ')
      command = command.replace('{type}', type)
      command = command.replace('{value}', value)
      return command
    }

    // Replace all other placeholders
    command = command.replace(/{([^}]+)}/g, (match, key) => {
      if (key === 'source') return inputs.value[index]
      if (key === 'dest') return secondInputs.value[index]
      return inputs.value[index]
    })

    return command
  })

  emit('execute', commands)
}
</script>