<template>
<div class="model-management">
  <!-- Table Card -->
  <div class="table-card">
    <div class="table-header">
      <h3>{{ $t('modelManagement.modelList') }}</h3>
      <span v-if="restartAlertStore.modelChanged" class="restart-alert">{{ $t('restartAlert.message') }}</span>
      <div class="table-header-right">
        <el-button type="primary" size="small" :icon="Plus" @click="openAddProviderDialog">
          {{ $t('modelManagement.addProvider') }}
        </el-button>
        <button v-if="loadError" class="retry-btn" @click="fetchModels">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {{ $t('modelManagement.retry') }}
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="model-table">
        <thead>
      <tr>
        <th class="col-expand"></th>
        <th>{{ $t('modelManagement.providerId') }}</th>
          <th>{{ $t('modelManagement.npmPackage') }}</th>
          <th>{{ $t('modelManagement.builtin') }}</th>
          <th>{{ $t('modelManagement.providerOptions') }}</th>
        <th>{{ $t('modelManagement.modelCount') }}</th>
        <th>{{ $t('modelManagement.actions') }}</th>
      </tr>
        </thead>
        <tbody>
    <!-- Loading State -->
    <tr v-if="loading">
      <td colspan="7">
              <div class="loading-placeholder">
                <el-icon class="is-loading" :size="20"><Loading /></el-icon>
                <span>{{ $t('modelManagement.loading') }}</span>
              </div>
            </td>
          </tr>
    <!-- Error State -->
    <tr v-else-if="loadError">
      <td colspan="7">
              <div class="error-placeholder">
                <p>{{ $t('modelManagement.loadFailed') }}</p>
                <button class="retry-btn" @click="fetchModels">{{ $t('modelManagement.retry') }}</button>
              </div>
            </td>
          </tr>
    <!-- Empty State -->
    <tr v-else-if="providers.length === 0">
      <td colspan="7">
              <div class="empty-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                <p>{{ $t('modelManagement.noProviders') }}</p>
              </div>
            </td>
          </tr>

          <template v-for="provider in providers" :key="provider.id">
            <!-- Provider Row -->
            <tr class="provider-row" :class="{ expanded: expandedProvider === provider.id }">
              <td class="col-expand">
                <button class="expand-btn" :class="{ expanded: expandedProvider === provider.id }" @click="toggleExpand(provider.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </td>
        <td>
          <div class="provider-cell">
            <div class="provider-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/></svg>
            </div>
            <span class="provider-id">{{ provider.provider_id }}</span>
          </div>
        </td>
        <td>
          <span v-if="provider.npm" class="npm-badge">{{ provider.npm }}</span>
          <span v-else class="npm-empty">-</span>
        </td>
        <td>
          <span :class="provider.builtin ? 'builtin-badge yes' : 'builtin-badge no'">
            {{ provider.builtin ? $t('modelManagement.yes') : $t('modelManagement.no') }}
          </span>
        </td>
              <td>
                <span class="options-summary">{{ formatOptionsSummary(provider.options) }}</span>
              </td>
              <td>
                <span class="model-count-badge">{{ provider.models.length }}</span>
              </td>
              <td>
                <div class="provider-actions">
                  <button class="action-btn detail" @click="openProviderDetailDialog(provider)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ $t('modelManagement.detail') }}
                  </button>
                  <button class="action-btn edit" @click="openUpdateProviderDialog(provider)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {{ $t('modelManagement.update') }}
                  </button>
                  <button class="action-btn add-model" @click="openAddModelDialog(provider)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {{ $t('modelManagement.addModel') }}
                  </button>
                  <button class="action-btn delete" @click="openDeleteProviderConfirm(provider)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    {{ $t('modelManagement.delete') }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Model Sub-Rows -->
            <tr v-if="expandedProvider === provider.id" class="sub-row-header">
      <td></td>
      <td colspan="6">
                <div class="sub-table-wrapper">
                  <table v-if="provider.models.length > 0" class="sub-table">
                    <thead>
                      <tr>
                        <th>{{ $t('modelManagement.modelId') }}</th>
                        <th>{{ $t('modelManagement.modelOptions') }}</th>
                        <th>{{ $t('modelManagement.actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="model in provider.models" :key="model.id">
                        <td>
                          <div class="model-cell">
                            <div class="model-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                            </div>
                            <span class="model-id">{{ model.model_id }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="options-summary">{{ formatOptionsSummary(model.options) }}</span>
                        </td>
                        <td>
                          <div class="model-actions">
                            <button class="action-btn detail" @click="openModelDetailDialog(provider, model)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              {{ $t('modelManagement.detail') }}
                            </button>
                            <button class="action-btn edit" @click="openUpdateModelDialog(provider, model)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              {{ $t('modelManagement.update') }}
                            </button>
                            <button class="action-btn delete" @click="openDeleteModelConfirm(provider, model)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              {{ $t('modelManagement.delete') }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="sub-empty">
                    <p>{{ $t('modelManagement.noModels') }}</p>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>

<!-- Add Provider Dialog -->
<el-dialog v-model="showAddProviderDialog" :title="$t('modelManagement.addProvider')" width="500px" :close-on-click-modal="false">
  <el-form label-position="top" class="dialog-form">
    <el-form-item :label="$t('modelManagement.providerId')">
      <el-input :placeholder="$t('modelManagement.enterProviderId')" v-model="addProviderForm.providerId" @input="syncNameOption(addProviderForm)" />
    </el-form-item>
    <el-form-item :label="$t('modelManagement.npmPackage')">
      <el-autocomplete
        v-model="addProviderForm.npm"
        :fetch-suggestions="queryNpmSuggestions"
        :placeholder="$t('modelManagement.enterNpmPackage')"
        style="width: 100%"
        clearable
      />
    </el-form-item>
    <el-form-item class="inline-form-item">
      <template #label>
        <span>{{ $t('modelManagement.builtin') }}</span>
      </template>
      <el-switch v-model="addProviderForm.builtin" />
    </el-form-item>
    <el-form-item :label="$t('modelManagement.providerOptions')">
        <div class="options-editor">
          <div v-for="(opt, idx) in addProviderForm.options" :key="idx" class="option-row">
            <el-input :placeholder="$t('modelManagement.optionKey')" v-model="opt.key" class="option-key" :disabled="opt.key === 'name'" />
            <el-input :placeholder="$t('modelManagement.optionValue')" v-model="opt.value" class="option-value" />
            <button type="button" class="option-remove" @click="addProviderForm.options.splice(idx, 1)" :disabled="opt.key === 'name'">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button type="button" class="option-add" @click="addProviderForm.options.push({ key: '', value: '' })">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ $t('modelManagement.addOption') }}
          </button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddProviderDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAddProvider">{{ $t('modelManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Update Provider Dialog -->
  <el-dialog v-model="showUpdateProviderDialog" :title="$t('modelManagement.update')" width="500px" :close-on-click-modal="false">
  <div v-if="updateProviderTarget" class="update-hint">
    <span class="update-label">{{ $t('modelManagement.providerId') }}:</span>
    <span class="update-value">{{ updateProviderTarget.provider_id }}</span>
  </div>
  <el-form label-position="top" class="dialog-form">
    <el-form-item :label="$t('modelManagement.npmPackage')">
      <el-autocomplete
        v-model="updateProviderForm.npm"
        :fetch-suggestions="queryNpmSuggestions"
        :placeholder="$t('modelManagement.enterNpmPackage')"
        style="width: 100%"
        clearable
      />
    </el-form-item>
    <el-form-item class="inline-form-item">
      <template #label>
        <span>{{ $t('modelManagement.builtin') }}</span>
      </template>
      <el-switch v-model="updateProviderForm.builtin" />
    </el-form-item>
    <el-form-item :label="$t('modelManagement.providerOptions')">
      <div class="options-editor">
        <div v-for="(opt, idx) in updateProviderForm.options" :key="idx" class="option-row">
            <el-input :placeholder="$t('modelManagement.optionKey')" v-model="opt.key" class="option-key" :disabled="opt.key === 'name'" />
            <el-input :placeholder="$t('modelManagement.optionValue')" v-model="opt.value" class="option-value" />
            <button type="button" class="option-remove" @click="updateProviderForm.options.splice(idx, 1)" :disabled="opt.key === 'name'">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button type="button" class="option-add" @click="updateProviderForm.options.push({ key: '', value: '' })">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ $t('modelManagement.addOption') }}
          </button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showUpdateProviderDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleUpdateProvider">{{ $t('modelManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Provider Detail Dialog -->
  <el-dialog v-model="showProviderDetailDialog" :title="$t('modelManagement.detailTitle')" width="500px" :close-on-click-modal="false">
    <div v-if="providerDetailTarget" class="detail-grid">
    <div class="detail-row">
      <span class="detail-label">{{ $t('modelManagement.providerId') }}</span>
      <span class="detail-value">{{ providerDetailTarget.provider_id }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">{{ $t('modelManagement.npmPackage') }}</span>
      <span class="detail-value">{{ providerDetailTarget.npm || '-' }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">{{ $t('modelManagement.builtin') }}</span>
      <span class="detail-value">{{ providerDetailTarget.builtin ? $t('modelManagement.yes') : $t('modelManagement.no') }}</span>
    </div>
    <div class="detail-divider">{{ $t('modelManagement.providerOptions') }}</div>
      <div v-if="providerDetailTarget.options.length > 0">
        <div v-for="opt in providerDetailTarget.options" :key="opt.key" class="detail-row">
          <span class="detail-label">{{ opt.key }}</span>
          <span class="detail-value">{{ opt.value }}</span>
        </div>
      </div>
      <div v-else class="detail-row">
        <span class="detail-value dim">-</span>
      </div>
      <div class="detail-divider">{{ $t('modelManagement.modelCount') }}</div>
      <div class="detail-row">
        <span class="detail-value">{{ getProviderModels(providerDetailTarget.id).length }}</span>
      </div>
      <div v-if="getProviderModels(providerDetailTarget.id).length > 0">
        <div v-for="m in getProviderModels(providerDetailTarget.id)" :key="m.id" class="detail-row">
          <span class="detail-label">{{ m.model_id }}</span>
          <span class="detail-value">{{ formatOptionsSummary(m.options) }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showProviderDetailDialog = false">{{ $t('modelManagement.close') }}</el-button>
    </template>
  </el-dialog>

  <!-- Add Model Dialog -->
  <el-dialog v-model="showAddModelDialog" :title="$t('modelManagement.addModel') + ' — ' + (addModelTargetProvider?.provider_id || '')" width="500px" :close-on-click-modal="false">
    <el-form label-position="top" class="dialog-form">
      <el-form-item :label="$t('modelManagement.modelId')">
        <el-input :placeholder="$t('modelManagement.enterModelId')" v-model="addModelForm.modelId" @input="syncNameOption(addModelForm, 'modelId')" />
      </el-form-item>
      <el-form-item :label="$t('modelManagement.modelOptions')">
        <div class="options-editor">
          <div v-for="(opt, idx) in addModelForm.options" :key="idx" class="option-row">
            <el-input :placeholder="$t('modelManagement.optionKey')" v-model="opt.key" class="option-key" :disabled="opt.key === 'name'" />
            <el-input :placeholder="$t('modelManagement.optionValue')" v-model="opt.value" class="option-value" />
            <button type="button" class="option-remove" @click="addModelForm.options.splice(idx, 1)" :disabled="opt.key === 'name'">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button type="button" class="option-add" @click="addModelForm.options.push({ key: '', value: '' })">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ $t('modelManagement.addOption') }}
          </button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddModelDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAddModel">{{ $t('modelManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Update Model Dialog -->
  <el-dialog v-model="showUpdateModelDialog" :title="$t('modelManagement.update')" width="500px" :close-on-click-modal="false">
    <div v-if="updateModelTarget" class="update-hint">
      <span class="update-label">{{ $t('modelManagement.modelId') }}:</span>
      <span class="update-value">{{ updateModelTarget.model_id }}</span>
    </div>
    <el-form label-position="top" class="dialog-form">
      <el-form-item :label="$t('modelManagement.modelOptions')">
        <div class="options-editor">
          <div v-for="(opt, idx) in updateModelForm.options" :key="idx" class="option-row">
            <el-input :placeholder="$t('modelManagement.optionKey')" v-model="opt.key" class="option-key" :disabled="opt.key === 'name'" />
            <el-input :placeholder="$t('modelManagement.optionValue')" v-model="opt.value" class="option-value" />
            <button type="button" class="option-remove" @click="updateModelForm.options.splice(idx, 1)" :disabled="opt.key === 'name'">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button type="button" class="option-add" @click="updateModelForm.options.push({ key: '', value: '' })">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ $t('modelManagement.addOption') }}
          </button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showUpdateModelDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleUpdateModel">{{ $t('modelManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Model Detail Dialog -->
  <el-dialog v-model="showModelDetailDialog" :title="$t('modelManagement.detailTitle')" width="500px" :close-on-click-modal="false">
    <div v-if="modelDetailTarget" class="detail-grid">
      <div class="detail-row">
        <span class="detail-label">{{ $t('modelManagement.modelId') }}</span>
        <span class="detail-value">{{ modelDetailTarget.model_id }}</span>
      </div>
      <div class="detail-divider">{{ $t('modelManagement.modelOptions') }}</div>
      <div v-if="modelDetailTarget.options.length > 0">
        <div v-for="opt in modelDetailTarget.options" :key="opt.key" class="detail-row">
          <span class="detail-label">{{ opt.key }}</span>
          <span class="detail-value">{{ opt.value }}</span>
        </div>
      </div>
      <div v-else class="detail-row">
        <span class="detail-value dim">-</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="showModelDetailDialog = false">{{ $t('modelManagement.close') }}</el-button>
    </template>
  </el-dialog>

  <!-- Delete Provider Confirm Dialog -->
  <el-dialog v-model="showDeleteProviderDialog" :title="$t('modelManagement.deleteProviderTitle')" width="400px" :close-on-click-modal="false">
    <p class="delete-msg">{{ $t('modelManagement.deleteProviderConfirm', { name: deleteProviderTarget?.provider_id }) }}</p>
    <template #footer>
      <el-button @click="showDeleteProviderDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="danger" :loading="submitting" @click="handleDeleteProvider">{{ $t('modelManagement.delete') }}</el-button>
    </template>
  </el-dialog>

  <!-- Delete Model Confirm Dialog -->
  <el-dialog v-model="showDeleteModelDialog" :title="$t('modelManagement.deleteModelTitle')" width="400px" :close-on-click-modal="false">
    <p class="delete-msg">{{ $t('modelManagement.deleteModelConfirm', { name: deleteModelTarget?.model_id }) }}</p>
    <template #footer>
      <el-button @click="showDeleteModelDialog = false">{{ $t('modelManagement.cancel') }}</el-button>
      <el-button type="danger" :loading="submitting" @click="handleDeleteModel">{{ $t('modelManagement.delete') }}</el-button>
    </template>
  </el-dialog>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { modelApi, setConfig as setExtensionConfig, setAuthToken } from '../../apis/extension/api'
import type { Model, Options } from '../../apis/extension/types/model'
import { useUserStore } from '../../store/userStore'
import { useRestartAlertStore } from '../../store/restartAlertStore'

const { t: $t } = useI18n()
const userStore = useUserStore()
const restartAlertStore = useRestartAlertStore()

const confirmAndMarkModelChanged = async () => {
  if (!restartAlertStore.modelChanged) {
    try {
      await ElMessageBox.alert(
        $t('restartAlert.confirmMessage'),
        $t('restartAlert.confirmTitle'),
        { confirmButtonText: $t('restartAlert.confirmOk'), type: 'warning' },
      )
    } catch {
      // user closed dialog, still mark
    }
  }
  restartAlertStore.markModelChanged()
}

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001/api/'

const ensureExtensionConfig = () => {
  setExtensionConfig({ baseURL: backendURL })
  if (userStore.token) setAuthToken(userStore.token)
}

// ===== Data =====
interface ProviderItem {
  id: string
  provider_id: string
  npm?: string
  builtin?: boolean
  options: Options[]
  models: Model[]
}

const providers = ref<ProviderItem[]>([])
const expandedProvider = ref<string | null>(null)
const loading = ref(false)
const loadError = ref(false)
const submitting = ref(false)

const fetchModels = async () => {
  loading.value = true
  loadError.value = false
  try {
    ensureExtensionConfig()
    const resp = await modelApi.getModels({})
    if (resp.code === 0 && resp.data) {
    providers.value = (resp.data.items || []).map(item => ({
      id: item.provider.id,
      provider_id: item.provider.provider_id,
      npm: item.provider.npm || '',
      builtin: item.provider.builtin || false,
      options: item.provider.options || [],
      models: item.models || [],
    }))
    } else {
      loadError.value = true
    }
  } catch (error) {
    console.error('[ModelManagement] Failed to fetch models:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchModels()
})

// ===== Expand / collapse =====
const toggleExpand = (providerId: string) => {
  expandedProvider.value = expandedProvider.value === providerId ? null : providerId
}

// ===== Utility functions =====
const filterEmptyOptions = (opts: Options[]): Options[] => opts.filter(o => o.key.trim() !== '')

const syncNameOption = (form: { providerId?: string; modelId?: string; options: Options[] }, _idField?: string) => {
  const idValue = form.providerId ?? form.modelId ?? ''
  const nameOpt = form.options.find(o => o.key === 'name')
  if (nameOpt) nameOpt.value = idValue
}

const formatOptionsSummary = (options: Options[]): string => {
  if (!options || options.length === 0) return '-'
  const names = options.filter(o => o.key === 'name' || o.key === 'description')
  if (names.length > 0) return names.map(o => o.value).join(', ')
  if (options.length <= 3) return options.map(o => `${o.key}=${o.value}`).join(', ')
  return options.slice(0, 2).map(o => `${o.key}=${o.value}`).join(', ') + `, +${options.length - 2}`
}

const npmPresets = [
  '@ai-sdk/openai-compatible',
  '@ai-sdk/openai',
  '@ai-sdk/anthropic',
  '@ai-sdk/google',
  '@ai-sdk/deepseek',
  '@ai-sdk/perplexity',
  'ollama-ai-provider',
  '@openrouter/ai-sdk-provider',
  '@ai-sdk/elevenlabs',
  '@ai-sdk/deepgram',
]

const queryNpmSuggestions = (queryString: string, cb: (results: { value: string }[]) => void) => {
  const results = queryString
    ? npmPresets.filter(item => item.toLowerCase().includes(queryString.toLowerCase()))
    : npmPresets
  cb(results.map(item => ({ value: item })))
}

const getProviderModels = (providerId: string): Model[] => {
  const p = providers.value.find(x => x.id === providerId)
  return p ? p.models : []
}

// ===== Add Provider =====
const showAddProviderDialog = ref(false)
const addProviderForm = ref({ providerId: '', npm: '', builtin: false, options: [] as Options[] })

const openAddProviderDialog = () => {
  addProviderForm.value = { providerId: '', npm: '', builtin: false, options: [{ key: 'name', value: '' }] }
  showAddProviderDialog.value = true
}

const handleAddProvider = async () => {
  if (!addProviderForm.value.providerId.trim()) {
    ElMessage.warning($t('modelManagement.enterProviderId'))
    return
  }
  submitting.value = true
  try {
    ensureExtensionConfig()
    const opts = filterEmptyOptions(addProviderForm.value.options)
    const resp = await modelApi.addProvider({
      id: addProviderForm.value.providerId.trim(),
      npm: addProviderForm.value.npm.trim() || undefined,
      builtin: addProviderForm.value.builtin || undefined,
      options: opts,
    })
if (resp.code === 0) {
      showAddProviderDialog.value = false
      await confirmAndMarkModelChanged()
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.addFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Add provider failed:', error)
    ElMessage.error($t('modelManagement.addFailed'))
  } finally {
    submitting.value = false
  }
}

// ===== Update Provider =====
const showUpdateProviderDialog = ref(false)
const updateProviderTarget = ref<ProviderItem | null>(null)
const updateProviderForm = ref({ npm: '', builtin: false, options: [] as Options[] })

const openUpdateProviderDialog = (provider: ProviderItem) => {
  updateProviderTarget.value = provider
  updateProviderForm.value = { npm: provider.npm || '', builtin: provider.builtin || false, options: provider.options.map(o => ({ ...o })) }
  if (updateProviderForm.value.options.length === 0) {
    updateProviderForm.value.options.push({ key: '', value: '' })
  }
  showUpdateProviderDialog.value = true
}

const handleUpdateProvider = async () => {
  if (!updateProviderTarget.value) return
  submitting.value = true
  try {
    ensureExtensionConfig()
    const opts = filterEmptyOptions(updateProviderForm.value.options)
    const resp = await modelApi.updateProvider({
      id: updateProviderTarget.value.id,
      npm: updateProviderForm.value.npm.trim() || undefined,
      builtin: updateProviderForm.value.builtin,
      options: opts,
    })
if (resp.code === 0) {
      showUpdateProviderDialog.value = false
      await confirmAndMarkModelChanged()
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.updateFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Update provider failed:', error)
    ElMessage.error($t('modelManagement.updateFailed'))
  } finally {
    submitting.value = false
  }
}

// ===== Provider Detail =====
const showProviderDetailDialog = ref(false)
const providerDetailTarget = ref<ProviderItem | null>(null)

const openProviderDetailDialog = (provider: ProviderItem) => {
  providerDetailTarget.value = provider
  showProviderDetailDialog.value = true
}

// ===== Add Model =====
const showAddModelDialog = ref(false)
const addModelTargetProvider = ref<ProviderItem | null>(null)
const addModelForm = ref({ modelId: '', options: [] as Options[] })

const openAddModelDialog = (provider: ProviderItem) => {
  addModelTargetProvider.value = provider
  addModelForm.value = { modelId: '', options: [{ key: 'name', value: '' }] }
  showAddModelDialog.value = true
}

const handleAddModel = async () => {
  if (!addModelTargetProvider.value) return
  if (!addModelForm.value.modelId.trim()) {
    ElMessage.warning($t('modelManagement.enterModelId'))
    return
  }
  submitting.value = true
  try {
    ensureExtensionConfig()
    const opts = filterEmptyOptions(addModelForm.value.options)
    const resp = await modelApi.addModel({
      provider_id: addModelTargetProvider.value.provider_id,
      id: addModelForm.value.modelId.trim(),
      options: opts,
    })
if (resp.code === 0) {
      showAddModelDialog.value = false
      await confirmAndMarkModelChanged()
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.addFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Add model failed:', error)
    ElMessage.error($t('modelManagement.addFailed'))
  } finally {
    submitting.value = false
  }
}

// ===== Update Model =====
const showUpdateModelDialog = ref(false)
const updateModelTarget = ref<Model | null>(null)
const updateModelTargetProviderId = ref('')
const updateModelForm = ref({ options: [] as Options[] })

const openUpdateModelDialog = (provider: ProviderItem, model: Model) => {
  updateModelTarget.value = model
  updateModelTargetProviderId.value = provider.provider_id
  updateModelForm.value = { options: model.options.map(o => ({ ...o })) }
  if (updateModelForm.value.options.length === 0) {
    updateModelForm.value.options.push({ key: '', value: '' })
  }
  showUpdateModelDialog.value = true
}

const handleUpdateModel = async () => {
  if (!updateModelTarget.value) return
  submitting.value = true
  try {
    ensureExtensionConfig()
    const opts = filterEmptyOptions(updateModelForm.value.options)
    const resp = await modelApi.updateModel({
      id: updateModelTarget.value.id,
      provider_id: updateModelTargetProviderId.value,
      options: opts,
    })
if (resp.code === 0) {
      showUpdateModelDialog.value = false
      await confirmAndMarkModelChanged()
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.updateFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Update model failed:', error)
    ElMessage.error($t('modelManagement.updateFailed'))
  } finally {
    submitting.value = false
  }
}

// ===== Model Detail =====
const showModelDetailDialog = ref(false)
const modelDetailTarget = ref<Model | null>(null)

const openModelDetailDialog = (_provider: ProviderItem, model: Model) => {
  modelDetailTarget.value = model
  showModelDetailDialog.value = true
}

// ===== Delete Provider =====
const showDeleteProviderDialog = ref(false)
const deleteProviderTarget = ref<ProviderItem | null>(null)

const openDeleteProviderConfirm = (provider: ProviderItem) => {
  deleteProviderTarget.value = provider
  showDeleteProviderDialog.value = true
}

const handleDeleteProvider = async () => {
  if (!deleteProviderTarget.value) return
  submitting.value = true
  try {
    ensureExtensionConfig()
    const resp = await modelApi.deleteProvider({ id: deleteProviderTarget.value.id })
if (resp.code === 0) {
      showDeleteProviderDialog.value = false
      await confirmAndMarkModelChanged()
      if (expandedProvider.value === deleteProviderTarget.value.id) {
        expandedProvider.value = null
      }
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.deleteFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Delete provider failed:', error)
    ElMessage.error($t('modelManagement.deleteFailed'))
  } finally {
    submitting.value = false
  }
}

// ===== Delete Model =====
const showDeleteModelDialog = ref(false)
const deleteModelTarget = ref<Model | null>(null)
const deleteModelTargetProviderId = ref('')

const openDeleteModelConfirm = (provider: ProviderItem, model: Model) => {
  deleteModelTarget.value = model
  deleteModelTargetProviderId.value = provider.provider_id
  showDeleteModelDialog.value = true
}

const handleDeleteModel = async () => {
  if (!deleteModelTarget.value) return
  submitting.value = true
  try {
    ensureExtensionConfig()
    const resp = await modelApi.deleteModel({
      id: deleteModelTarget.value.id,
      provider_id: deleteModelTargetProviderId.value,
    })
if (resp.code === 0) {
      showDeleteModelDialog.value = false
      await confirmAndMarkModelChanged()
      await fetchModels()
    } else {
      ElMessage.error(resp.message || $t('modelManagement.deleteFailed'))
    }
  } catch (error) {
    console.error('[ModelManagement] Delete model failed:', error)
    ElMessage.error($t('modelManagement.deleteFailed'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.model-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Table Card ===== */
.table-card {
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin: 0;
}

.restart-alert {
  margin-left: 96px;
  font-size: 13px;
  font-weight: 500;
  color: #dc2626;
}

.table-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-wrapper {
  overflow-x: auto;
}

/* ===== Main Table ===== */
.model-table {
  width: 100%;
  border-collapse: collapse;
}

.model-table th {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-align: left;
  border-bottom: 1px solid var(--border-100);
  white-space: nowrap;
}

.model-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-200);
  border-bottom: 1px solid var(--border-100);
  vertical-align: middle;
}

.model-table tbody tr:last-child td {
  border-bottom: none;
}

.provider-row:hover {
  background: var(--bg-100);
}

.provider-row.expanded {
  background: var(--admin-accent-bg, rgba(59, 130, 246, 0.04));
}

/* ===== Expand Column ===== */
.col-expand {
  width: 40px;
  text-align: center;
}

.expand-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--bg-200);
}

.expand-btn svg {
  transition: transform 0.2s;
}

.expand-btn.expanded svg {
  transform: rotate(90deg);
}

/* ===== Provider Cell ===== */
.provider-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.provider-id {
  font-weight: 600;
  color: var(--text-100);
}

.npm-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  background: rgba(59, 130, 246, 0.06);
  color: #3b82f6;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npm-empty {
  color: var(--text-400);
}

.builtin-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.builtin-badge.yes {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}

.builtin-badge.no {
  color: var(--text-400);
}

.options-summary {
  font-size: 13px;
  color: var(--text-400);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.model-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-200);
  color: var(--text-400);
}

/* ===== Actions ===== */
.provider-actions,
.model-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn.detail {
  color: var(--admin-accent, #3b82f6);
}

.action-btn.detail:hover {
  background: rgba(59, 130, 246, 0.08);
}

.action-btn.edit {
  color: var(--success-100, #10b981);
}

.action-btn.edit:hover {
  background: rgba(16, 185, 129, 0.08);
  color: var(--success-200, #059669);
}

.action-btn.add-model {
  color: #3b82f6;
}

.action-btn.add-model:hover {
  background: rgba(59, 130, 246, 0.08);
}

.action-btn.delete {
  color: #dc2626;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.08);
}

/* ===== Sub-table (Models) ===== */
.sub-row-header td {
  padding: 0 !important;
  border-bottom: 1px solid var(--border-100);
  background: var(--bg-100);
}

.sub-table-wrapper {
  padding: 12px 16px 12px 56px;
}

.sub-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 8px;
  overflow: hidden;
}

.sub-table th {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-400);
  text-align: left;
  border-bottom: 1px solid var(--border-100);
  white-space: nowrap;
}

.sub-table td {
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text-200);
  border-bottom: 1px solid var(--border-100);
  vertical-align: middle;
}

.sub-table tbody tr:last-child td {
  border-bottom: none;
}

.sub-table tbody tr:hover {
  background: var(--bg-100);
}

.model-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-icon {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.model-id {
  font-weight: 500;
  color: var(--text-100);
}

.sub-empty {
  padding: 24px 0;
  text-align: center;
}

.sub-empty p {
  font-size: 13px;
  color: var(--text-400);
  margin: 0;
}

/* ===== Loading, Error & Empty Placeholder ===== */
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--text-400);
  font-size: 13px;
}

.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--text-400);
  font-size: 13px;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-400);
}

.empty-placeholder svg {
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-placeholder p {
  font-size: 13px;
  margin: 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-200);
  border-radius: 6px;
  background: transparent;
  color: var(--text-300);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.retry-btn:hover {
  background: var(--bg-100);
  color: var(--text-200);
}

/* ===== Options Editor ===== */
.options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-key {
  flex: 2;
}

.option-value {
  flex: 3;
}

.option-remove {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.option-remove:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.option-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px dashed var(--border-200);
  border-radius: 6px;
  background: transparent;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;
}

.option-add:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: #3b82f6;
}

/* ===== Update Hint ===== */
.update-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--bg-100);
  border-radius: 8px;
}

.update-label {
  font-size: 13px;
  color: var(--text-400);
}

.update-value {
  font-size: 13px;
  color: var(--text-100);
  font-weight: 500;
}

/* ===== Detail Grid ===== */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-100);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 120px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-400);
}

.detail-value {
  font-size: 13px;
  color: var(--text-200);
  word-break: break-all;
}

.detail-value.dim {
  color: var(--text-400);
}

.detail-divider {
  padding: 12px 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== Dialog ===== */
.dialog-form {
  padding-top: 4px;
}

.dialog-form .inline-form-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.dialog-form .inline-form-item :deep(.el-form-item__label) {
  padding: 0;
  margin: 0;
  flex-shrink: 0;
}

.dialog-form .inline-form-item :deep(.el-form-item__content) {
  flex: 0 0 auto;
}

.delete-msg {
  font-size: 14px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0;
}
</style>
