<template>
  <el-dialog v-model="visible" :title="$t('projectDetail.title')" width="400px" :close-on-click-modal="false" @close="handleClose">
    <div v-if="project" class="detail-content">
      <div class="detail-row">
        <span class="detail-label">{{ $t('projectDetail.name') }}</span>
        <span v-if="!editing" class="detail-value">{{ project.name }}</span>
        <el-input v-else v-model="editForm.name" size="small" />
      </div>
      <div class="detail-row">
        <span class="detail-label">{{ $t('projectDetail.type') }}</span>
        <span v-if="!editing" class="detail-value">{{ project.type }}</span>
        <el-select v-else v-model="editForm.type" size="small" style="width: 100%">
      <el-option :label="$t('projectDetail.typeApp')" value="app" />
        <el-option :label="$t('projectDetail.typeWeb')" value="web" />
        <el-option :label="$t('projectDetail.typeData')" value="data" />
        <el-option :label="$t('projectDetail.typeOther')" value="other" />
        </el-select>
      </div>
      <div class="detail-row">
        <span class="detail-label">{{ $t('projectDetail.description') }}</span>
        <span v-if="!editing" class="detail-value">{{ project.description || '-' }}</span>
        <el-input v-else v-model="editForm.description" type="textarea" :rows="3" size="small" />
      </div>
      <div class="detail-row">
        <span class="detail-label">{{ $t('projectDetail.createdAt') }}</span>
        <span class="detail-value">{{ formatDate(project.created) }}</span>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
    <el-button v-if="!editing" @click="editing = true">{{ $t('projectDetail.edit') }}</el-button>
    <el-button v-else @click="cancelEdit">{{ $t('projectDetail.cancel') }}</el-button>
    <el-button v-if="!editing" type="primary" @click="handleClose">{{ $t('projectDetail.close') }}</el-button>
    <el-button v-else type="primary" :loading="submitting" @click="handleSubmit">{{ $t('projectDetail.submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { projectApi, setConfig, setAuthToken } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import { ElMessage } from 'element-plus'
import type { Project } from '../../apis/extension/types/project'

interface Props {
  modelValue: boolean;
  project: Project | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'updated', project: Project): void;
}>();

const userStore = useUserStore();
const { t } = useI18n();
const editing = ref(false);
const submitting = ref(false);
const editForm = ref({ name: '', type: '', description: '' });

const visible = ref(props.modelValue);
watch(() => props.modelValue, (val) => { visible.value = val; });
watch(visible, (val) => { emit('update:modelValue', val); });

watch(() => props.modelValue, (val) => {
  if (val && props.project) {
    editing.value = false;
    editForm.value = {
      name: props.project.name,
      type: props.project.type,
      description: props.project.description || '',
    };
  }
});

const initApi = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl) setConfig({ baseURL: backendUrl });
  const token = userStore.token;
  if (token) setAuthToken(token);
};

const cancelEdit = () => {
  if (props.project) {
    editForm.value = {
      name: props.project.name,
      type: props.project.type,
      description: props.project.description || '',
    };
  }
  editing.value = false;
};

const handleSubmit = async () => {
  if (!props.project) return;
  submitting.value = true;
  try {
    initApi();
    await projectApi.update({
      id: props.project.id,
      name: editForm.value.name,
      type: editForm.value.type,
      description: editForm.value.description || undefined,
    });
    ElMessage.success(t('projectDetail.updateSuccess'));
    editing.value = false;
    emit('updated', {
      ...props.project,
      name: editForm.value.name,
      type: editForm.value.type,
      description: editForm.value.description || undefined,
    });
  } catch (error) {
    console.error('[ProjectDetailDialog] Failed to update project:', error);
    ElMessage.error(t('projectDetail.updateFailed'));
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  editing.value = false;
  visible.value = false;
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};
</script>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 13px;
}

.detail-label {
  width: 70px;
  flex-shrink: 0;
  color: var(--text-400);
  line-height: 32px;
}

.detail-value {
  color: var(--text-200);
  word-break: break-all;
  line-height: 32px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
