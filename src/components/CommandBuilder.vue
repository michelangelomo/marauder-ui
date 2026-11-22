<template>
  <div class="flex h-full min-h-0 flex-col gap-3">
    <p v-if="!canSend" class="connect-hint shrink-0">Connect a device, or click “Explore demo”, to send commands.</p>

    <div class="command-surface flex min-h-0 flex-1 flex-col gap-3" :class="{ 'is-disabled': !canSend }" :inert="!canSend">
      <div class="pinned-row shrink-0">
        <button
          v-for="item in PINNED"
          :key="item.cmd"
          class="pinned-btn"
          :class="{ 'is-stop': item.tone === 'stop' }"
          type="button"
          @click="sendDirect(item.cmd)"
        >
          <span class="pinned-icon" aria-hidden="true">
            <svg v-if="item.icon === 'scan'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22M5 5l2.3 2.3M16.7 16.7 19 19M19 5l-2.3 2.3M7.3 16.7 5 19"/></svg>
            <svg v-else-if="item.icon === 'list'" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            <svg v-else-if="item.icon === 'wave'" viewBox="0 0 24 24"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4-4 2-4"/></svg>
            <svg v-else viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </span>
          {{ item.label }}
        </button>
      </div>

      <button type="button" class="browse-btn shrink-0" @click="isWorkflowOpen = true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
        Browse all commands
      </button>
    </div>

    <Teleport to="body">
      <div v-if="isWorkflowOpen" class="confirm-scrim" @click.self="isWorkflowOpen = false">
        <div class="workflow-sheet" role="dialog" aria-modal="true" aria-label="All commands">
          <div class="workflow-head">
            <h3 class="workflow-title">All commands</h3>
            <button type="button" class="icon-btn" aria-label="Close" @click="isWorkflowOpen = false">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>

          <div class="tab-row shrink-0" role="tablist" aria-label="Command categories">
            <button
              v-for="group in COMMAND_GROUPS"
              :key="group.id"
              role="tab"
              :aria-selected="activeGroup === group.id"
              class="tab-btn"
              :class="{ 'is-active': activeGroup === group.id }"
              type="button"
              @click="activeGroup = group.id"
            >
              {{ group.label }}
            </button>
          </div>

          <div class="command-list" role="tabpanel">
            <div v-for="item in activeItems" :key="item.label" class="command-card">
              <button type="button" class="command-card-head" @click="toggleOpen(item)">
                <span class="command-card-text">
                  <span class="command-card-title">
                    {{ item.label }}
                    <span v-if="item.radiates" class="rf-badge" title="This command transmits RF frames">RF</span>
                  </span>
                  <span class="command-card-desc">{{ item.desc }}</span>
                </span>
                <span v-if="item.params" class="disclosure" :class="{ 'is-open': openItem === item }" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </span>
                <span v-else class="disclosure disclosure-run" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
                </span>
              </button>

              <div v-if="item.params && openItem === item" class="command-card-body">
                <div v-for="param in visibleParams(item)" :key="param.key" class="param-row">
                  <label class="param-label">{{ param.label }}</label>
                  <select
                    v-if="param.type === 'select'"
                    class="input-field param-input"
                    v-model="formState[param.key]"
                  >
                    <option v-for="[value, text] in param.options" :key="value" :value="value">{{ text }}</option>
                  </select>
                  <label v-else-if="param.type === 'toggle'" class="param-toggle">
                    <input type="checkbox" v-model="formState[param.key]">
                    <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
                  </label>
                  <input
                    v-else
                    class="input-field param-input"
                    :type="param.type === 'number' ? 'number' : 'text'"
                    :min="param.min"
                    :max="param.max"
                    :placeholder="param.placeholder"
                    v-model="formState[param.key]"
                  >
                </div>

                <div class="command-preview">
                  <code>{{ previewCommand(item) }}</code>
                </div>

                <button type="button" class="button button-primary w-full" @click="runParamCommand(item)">
                  {{ item.radiates ? 'Review & send' : 'Send' }}
                </button>
              </div>
            </div>
          </div>

          <form class="command-form shrink-0" @submit.prevent="sendCustomCommand">
            <label class="sr-only" for="custom-command">Enter a Marauder CLI command</label>
            <input
              id="custom-command"
              ref="customInput"
              v-model="customCommand"
              class="command-input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              list="marauder-command-names"
              placeholder="Enter a CLI command…"
              @keydown.up.prevent="recallPrevious"
              @keydown.down.prevent="recallNext"
            >
            <datalist id="marauder-command-names">
              <option v-for="name in COMMAND_NAMES" :key="name" :value="name" />
            </datalist>
            <button class="button button-primary" type="submit" :disabled="!customCommand.trim()">Send</button>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pendingConfirm" class="confirm-scrim" @click.self="cancelConfirm">
        <div class="confirm-sheet" role="alertdialog" aria-modal="true" :aria-label="`Confirm ${pendingConfirm.label}`">
          <p class="confirm-title">Send “{{ pendingConfirm.label }}”?</p>
          <p class="confirm-body">This transmits RF frames from the device. Only run it against hardware and networks you own or are authorized to test.</p>
          <code class="confirm-command">{{ pendingConfirm.command }}</code>
          <div class="confirm-actions">
            <button type="button" class="button button-subtle" @click="cancelConfirm">Cancel</button>
            <button type="button" class="button button-danger" @click="confirmSend">Send</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, nextTick, watch } from 'vue'
import { useSerialConnection } from '../utils/serialConnection'
import { useCommandHistory } from '../utils/commandHistory'
import { COMMAND_GROUPS, PINNED, COMMAND_NAMES } from '../utils/marauderCommands'

const { sendCommand: serialSendCommand, canSend } = useSerialConnection()
const { addCommand, getPreviousCommand, getNextCommand } = useCommandHistory()

const customCommand = ref('')
const customInput = ref(null)
const activeGroup = ref(COMMAND_GROUPS[0].id)
const openItem = shallowRef(null)
const formState = ref({})
const pendingConfirm = ref(null)
const isWorkflowOpen = ref(false)

watch(canSend, (allowed) => {
  if (!allowed) {
    isWorkflowOpen.value = false
    pendingConfirm.value = null
  }
})

const activeItems = computed(() => COMMAND_GROUPS.find((g) => g.id === activeGroup.value)?.items ?? [])

const visibleParams = (item) => item.params.filter((p) => !p.when || p.when(formState.value))

const toggleOpen = (item) => {
  if (!item.params) {
    runDirect(item)
    return
  }
  if (openItem.value === item) {
    openItem.value = null
    return
  }
  const next = {}
  item.params.forEach((p) => {
    next[p.key] = p.type === 'toggle' ? false : (p.default ?? '')
  })
  formState.value = next
  openItem.value = item
}

const buildCommand = (item) => item.build(formState.value)
const previewCommand = (item) => buildCommand(item) || ' '

const sendDirect = async (command) => {
  addCommand(command)
  await serialSendCommand(command)
}

const runDirect = (item) => {
  if (item.fill) {
    customCommand.value = item.cmd
    nextTick(() => customInput.value?.focus())
    return
  }
  if (item.radiates) {
    pendingConfirm.value = { label: item.label, command: item.cmd }
    return
  }
  sendDirect(item.cmd)
}

const runParamCommand = (item) => {
  const command = buildCommand(item)
  if (!command.trim()) return
  if (item.radiates) {
    pendingConfirm.value = { label: item.label, command }
    return
  }
  sendDirect(command)
  openItem.value = null
}

const cancelConfirm = () => { pendingConfirm.value = null }
const confirmSend = async () => {
  const { command } = pendingConfirm.value
  pendingConfirm.value = null
  openItem.value = null
  for (const line of command.split('\n')) {
    await sendDirect(line)
  }
}

const sendCustomCommand = async () => {
  const command = customCommand.value.trim()
  if (!command) return
  await sendDirect(command)
  customCommand.value = ''
}

const recallPrevious = () => {
  const cmd = getPreviousCommand()
  if (cmd !== null) customCommand.value = cmd
}
const recallNext = () => {
  const cmd = getNextCommand()
  if (cmd !== null) customCommand.value = cmd
}
</script>
