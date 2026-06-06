<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useUpload } from '~/composables/useUpload'
import type { UploadItemView, UploadPhase } from '~/composables/useUpload'
import type { PatchTagAdd } from '~/types/image'
import { formatBytes } from '~/utils/format'

const ImageTagsEditModal = defineAsyncComponent(
  () => import('~/components/image/ImageTagsEditModal.vue'),
)

const {
  open,
  items,
  error,
  notice,
  doneCount,
  pendingCount,
  total,
  deleteUploaded,
  clear,
  closeModal,
} = useUpload()
const { t } = useI18n()
const { api } = useApi()
const { toImageView } = useAdapters()

const remaining = computed(() => pendingCount.value)
const progressPct = computed(() =>
  total.value ? ((total.value - pendingCount.value) / total.value) * 100 : 0,
)

const RING_CIRCUMFERENCE = 69.1

interface BadgeMeta {
  key: string
  color: string
}

const BADGE: Record<UploadPhase, BadgeMeta> = {
  queued: { key: 'upload.badgeQueued', color: 'var(--color-muted)' },
  uploading: { key: 'upload.badgeUploading', color: 'var(--color-accent-text)' },
  analyzing: { key: 'upload.badgeAnalyzing', color: 'var(--cat-character)' },
  done: { key: 'upload.badgeDone', color: 'var(--color-ok)' },
  error: { key: 'upload.badgeError', color: 'var(--color-err)' },
  duplicate: { key: 'upload.badgeDuplicate', color: 'var(--color-warn)' },
}

const STATUS_LABEL: Record<UploadPhase, string> = {
  queued: 'upload.phaseQueued',
  uploading: 'upload.phaseUploading',
  analyzing: 'upload.phaseAnalyzing',
  done: 'upload.phaseDone',
  error: 'upload.phaseError',
  duplicate: 'upload.phaseDuplicate',
}

function ringDash(progress: number): string {
  return `${progress * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`
}

const editItem = ref<UploadItemView | null>(null)
const tagsEditOpen = ref(false)
const tagsSaving = ref(false)

function openTagsEditor(item: UploadItemView): void {
  editItem.value = item
  tagsEditOpen.value = true
}

function closeTagsEditor(): void {
  tagsEditOpen.value = false
  editItem.value = null
}

async function saveItemTags(payload: { add: PatchTagAdd[]; remove: string[] }): Promise<void> {
  const target = editItem.value
  if (!target) return
  if (!payload.add.length && !payload.remove.length) {
    closeTagsEditor()
    return
  }
  tagsSaving.value = true
  try {
    const updated = await api.patchImageTags(target.id, payload)
    const tags = toImageView(updated).tags
    items.value = items.value.map((i) => (i.id === target.id ? { ...i, tags } : i))
    closeTagsEditor()
  } finally {
    tagsSaving.value = false
  }
}

function done(): void {
  clear()
  closeModal()
}

const deleteTarget = ref<UploadItemView | null>(null)
const deleting = ref(false)
function askDelete(item: UploadItemView): void {
  deleteTarget.value = item
}
async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  try {
    await deleteUploaded(target.id)
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <LModal :open="open" :max-width="720" labelled-by="upload-title" @close="closeModal">
    <header class="um__header">
      <div class="um__heading">
        <h2 id="upload-title" class="um__title">{{ t('upload.title', { n: total }, total) }}</h2>
        <p class="um__sub mono">
          {{ t('upload.summary', { done: doneCount, remaining }) }}
        </p>
      </div>
      <span class="um__spacer" />
      <button
        type="button"
        class="um__icon-btn"
        :aria-label="t('common.close')"
        @click="closeModal"
      >
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="um__progress">
      <div class="um__progress-fill" :style="{ width: `${progressPct}%` }" />
    </div>

    <div v-if="error" class="um__error" role="alert">
      <LIcon name="x" :size="14" :stroke="2.5" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="notice" class="um__notice" role="status">
      <LIcon name="check" :size="14" :stroke="2.5" />
      <span>{{ notice }}</span>
    </div>

    <ul class="um__list">
      <li v-for="item in items" :key="item.id" class="um__item">
        <div
          class="um__thumb"
          :style="{
            background: `linear-gradient(135deg, oklch(0.55 0.2 ${item.hue}), oklch(0.2 0.1 ${item.hue + 40}))`,
          }"
        >
          <img v-if="item.previewUrl" :src="item.previewUrl" alt="" class="um__thumb-img" />
          <div v-if="item.phase === 'uploading'" class="um__overlay um__overlay--upload">
            <svg width="28" height="28" viewBox="0 0 28 28" class="um__ring">
              <circle
                cx="14"
                cy="14"
                r="11"
                fill="none"
                stroke="var(--color-surface3)"
                stroke-width="2.5"
              />
              <circle
                cx="14"
                cy="14"
                r="11"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2.5"
                stroke-linecap="round"
                :stroke-dasharray="ringDash(item.progress)"
              />
            </svg>
          </div>
          <div v-else-if="item.phase === 'analyzing'" class="um__overlay um__overlay--analyzing">
            <LSpinner :size="22" color="var(--cat-character)" />
          </div>
          <div v-else-if="item.phase === 'queued'" class="um__overlay um__overlay--queued">
            <LIcon name="more" :size="20" />
          </div>
          <div v-else-if="item.phase === 'error'" class="um__overlay um__overlay--error">
            <LIcon name="x" :size="20" :stroke="2" />
          </div>
          <div v-else-if="item.phase === 'duplicate'" class="um__overlay um__overlay--duplicate">
            <LIcon name="picture" :size="18" :stroke="2" />
          </div>
        </div>

        <div class="um__body">
          <div class="um__row">
            <span class="um__name mono" :class="{ 'um__name--muted': item.phase === 'queued' }">{{
              item.filename
            }}</span>
            <span class="um__size mono">{{ formatBytes(item.size) }}</span>
            <span class="um__badge mono" :style="{ '--badge-c': BADGE[item.phase].color }">
              <span v-if="item.phase === 'uploading'">{{ Math.round(item.progress * 100) }}%</span>
              <LSpinner
                v-else-if="item.phase === 'analyzing'"
                :size="9"
                color="var(--cat-character)"
              />
              <LIcon v-else-if="item.phase === 'done'" name="check" :size="10" :stroke="2.5" />
              <span>{{ t(BADGE[item.phase].key) }}</span>
            </span>
          </div>

          <div v-if="item.tags?.length" class="um__tags">
            <LTagChip
              v-for="tag in item.tags"
              :key="tag.name"
              :category="tag.category"
              :color="tag.color"
              size="sm"
            >
              {{ tag.name }}
            </LTagChip>
          </div>
          <div v-else-if="item.phase === 'analyzing'" class="um__shimmer">
            <LSkeleton
              v-for="w in [60, 42, 78, 50]"
              :key="w"
              :width="`${w}px`"
              height="18px"
              radius="var(--radius-pill)"
            />
          </div>
          <span v-else class="um__status mono">{{ t(STATUS_LABEL[item.phase]) }}</span>
        </div>

        <div class="um__actions">
          <button
            v-if="item.phase === 'done'"
            type="button"
            class="um__icon-btn"
            :aria-label="t('common.edit')"
            @click="openTagsEditor(item)"
          >
            <LIcon name="edit" :size="15" />
          </button>
          <button
            type="button"
            class="um__icon-btn um__icon-btn--danger"
            :aria-label="t('common.delete')"
            @click="askDelete(item)"
          >
            <LIcon name="x" :size="15" :stroke="2" />
          </button>
        </div>
      </li>
    </ul>

    <footer class="um__footer">
      <div class="um__ai">
        <span class="um__ai-badge mono">{{ t('upload.aiBadge') }}</span>
        <span>{{ t('upload.aiNote') }}</span>
      </div>
      <span class="um__spacer" />
      <LButton variant="ghost" @click="closeModal">{{ t('upload.hide') }}</LButton>
      <LButton variant="primary" icon="check" @click="done">{{ t('common.done') }}</LButton>
    </footer>
  </LModal>

  <ImageTagsEditModal
    v-if="editItem"
    :open="tagsEditOpen"
    :tags="editItem.tags ?? []"
    :saving="tagsSaving"
    @save="saveItemTags"
    @close="closeTagsEditor"
  />

  <LConfirm
    :open="!!deleteTarget"
    :title="t('upload.deleteImageTitle')"
    :body="t('upload.deleteImageBody')"
    :confirm-label="t('common.delete')"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

<style scoped>
.um__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.um__heading {
  flex: 1;
}
.um__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.um__sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  margin-top: 2px;
}
.um__spacer {
  flex: 1;
}
.um__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
  transition: background var(--dur-fast);
}
.um__icon-btn:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.um__icon-btn--danger:hover {
  color: var(--color-err);
}
.um__progress {
  height: 4px;
  margin: 14px 22px;
  background: var(--color-surface2);
  border-radius: 2px;
  overflow: hidden;
}
.um__error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 22px 14px;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  font-size: 12.5px;
  color: var(--color-err);
  background: color-mix(in srgb, var(--color-err) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-err) 30%, transparent);
}
.um__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 22px 14px;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  font-size: 12.5px;
  color: var(--color-ok);
  background: color-mix(in srgb, var(--color-ok) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-ok) 30%, transparent);
}
.um__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent2));
  box-shadow: var(--glow-accent);
  border-radius: 2px;
  transition: width var(--dur-slow) var(--ease-out);
}
.um__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.um__item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.um__thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
}
.um__thumb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.um__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.um__overlay--upload {
  background: rgba(0, 0, 0, 0.5);
}
.um__overlay--analyzing {
  background: rgba(0, 0, 0, 0.6);
}
.um__overlay--queued {
  background: rgba(0, 0, 0, 0.65);
  color: var(--color-muted);
}
.um__overlay--error {
  background: rgba(0, 0, 0, 0.65);
  color: var(--color-err);
}
.um__overlay--duplicate {
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-warn);
}
.um__ring {
  transform: rotate(-90deg);
}
.um__body {
  min-width: 0;
}
.um__row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.um__name {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.um__name--muted {
  color: var(--color-muted);
}
.um__size {
  font-size: 10.5px;
  color: var(--color-muted);
  flex-shrink: 0;
}
.um__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  flex-shrink: 0;
  color: var(--badge-c);
  background: color-mix(in srgb, var(--badge-c) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge-c) 20%, transparent);
}
.um__tags,
.um__shimmer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.um__status {
  font-size: 11px;
  color: var(--color-mute2);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.um__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.um__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
.um__ai {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-muted);
}
.um__ai-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--cat-character) 13%, transparent);
  color: var(--cat-character);
  font-weight: 700;
  font-size: 11px;
}
</style>
