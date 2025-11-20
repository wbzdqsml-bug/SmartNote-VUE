<template>
  <n-layout has-sider class="app-layout">
    <app-sidebar
      active="profile"
      :profile="userStore.profile"
      @update:active="handleNav"
      @create-note="goHome"
      @search="goHome"
      @open-profile="noop"
      @open-recycle="goHome"
      @logout="handleLogout"
    />
    <n-layout class="main-area">
      <user-header
        title="个人资料"
        subtitle="查看并更新账号信息"
        :notifications="[]"
        @refresh="loadProfile"
      />

      <div class="content">
        <n-card class="profile-card" :bordered="false">
          <div class="header-row">
            <n-avatar round size="large" :src="avatarPreview">{{ avatarInitial }}</n-avatar>
            <div class="info">
              <h3>{{ displayName }}</h3>
              <p class="muted">{{ form.email || '未填写邮箱' }}</p>
            </div>
            <div class="header-actions">
              <n-tag type="info" round>UID: {{ displayUid }}</n-tag>
              <n-button tertiary size="small" @click="triggerUpload">上传头像</n-button>
              <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="handleFile" />
              <n-button v-if="!editMode" type="primary" size="small" @click="startEdit">编辑资料</n-button>
            </div>
          </div>

          <n-form
            :model="form"
            :rules="rules"
            label-placement="left"
            label-width="82"
            class="profile-form"
            size="large"
          >
            <n-grid :cols="2" :x-gap="18" :y-gap="16">
              <n-form-item-gi label="昵称" path="nickname">
                <template v-if="editMode">
                  <n-input v-model:value="form.nickname" placeholder="输入昵称" />
                </template>
                <template v-else>
                  <p class="value">{{ form.nickname || displayName }}</p>
                </template>
              </n-form-item-gi>
              <n-form-item-gi label="邮箱">
                <template v-if="editMode">
                  <n-input v-model:value="form.email" placeholder="输入邮箱" />
                </template>
                <template v-else>
                  <p class="value">{{ form.email || '未填写' }}</p>
                </template>
              </n-form-item-gi>
              <n-form-item-gi label="手机号">
                <template v-if="editMode">
                  <n-input v-model:value="form.phone" placeholder="输入手机号" />
                </template>
                <template v-else>
                  <p class="value">{{ form.phone || '未填写' }}</p>
                </template>
              </n-form-item-gi>
              <n-form-item-gi label="签名">
                <template v-if="editMode">
                  <n-input v-model:value="form.bio" placeholder="写一句个人签名/简介" />
                </template>
                <template v-else>
                  <p class="value">{{ form.bio || '未填写' }}</p>
                </template>
              </n-form-item-gi>
            </n-grid>
            <n-form-item label="个人简介">
              <template v-if="editMode">
                <n-input
                  v-model:value="form.bio"
                  type="textarea"
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  placeholder="介绍一下自己（可选）"
                />
              </template>
              <template v-else>
                <p class="value">{{ form.bio || '未填写' }}</p>
              </template>
            </n-form-item>
            <div class="actions" v-if="editMode">
              <n-button secondary @click="cancelEdit" :loading="loading">取消</n-button>
              <n-button type="primary" :loading="saving" @click="handleSubmit">保存修改</n-button>
            </div>
          </n-form>
        </n-card>
      </div>
    </n-layout>
  </n-layout>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import {
  NLayout,
  NCard,
  NForm,
  NFormItem,
  NFormItemGi,
  NInput,
  NButton,
  NAvatar,
  NTag,
  NGrid,
  useMessage
} from 'naive-ui'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import UserHeader from '@/components/UserHeader.vue'
import userApi from '@/api/user'
import { useUserStore } from '@/store/userStore'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const form = reactive({
  nickname: '',
  email: '',
  phone: '',
  bio: '',
  avatarUrl: ''
})

const rawProfile = ref({})
const loading = ref(false)
const saving = ref(false)
const editMode = ref(false)

const displayUid = computed(() => rawProfile.value?.id ?? rawProfile.value?.userId ?? '--')
const displayName = computed(() => userStore.profile?.nickname || userStore.profile?.username || '未登录')
const avatarInitial = computed(() => (displayName.value ? displayName.value[0]?.toUpperCase() : 'U'))
const avatarPreview = computed(() => form.avatarUrl || rawProfile.value?.avatarUrl || '')

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: ['input', 'blur'] },
    { min: 2, message: '至少 2 个字符', trigger: ['input', 'blur'] }
  ]
}

const resolveResponse = (response, fallback = {}) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

const ensureForm = (profile = {}) => {
  form.nickname = profile.nickname ?? profile.nickName ?? profile.username ?? displayName.value ?? ''
  form.email = profile.email ?? ''
  form.phone = profile.phone ?? ''
  form.bio = profile.bio ?? ''
  form.avatarUrl = profile.avatarUrl ?? ''
}

const loadProfile = async () => {
  loading.value = true
  try {
    const response = await userApi.profileDetail()
    const data = resolveResponse(response, {})
    rawProfile.value = data || {}
    ensureForm(rawProfile.value)
    editMode.value = false
  } catch (error) {
    console.error('[Profile] loadProfile error:', error)
    message.error(error?.response?.data?.message || '获取用户资料失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const payload = {
      email: form.email,
      phone: form.phone,
      avatarUrl: form.avatarUrl,
      bio: form.bio
    }
    await userApi.updateProfile(payload)
    message.success('资料已更新')
    userStore.setProfile({
      ...userStore.profile,
      nickname: form.nickname || userStore.profile?.nickname,
      username: rawProfile.value?.username ?? userStore.profile?.username,
      email: form.email,
      phone: form.phone,
      avatarUrl: form.avatarUrl,
      bio: form.bio
    })
    await loadProfile()
    editMode.value = false
  } catch (error) {
    console.error('[Profile] update error:', error)
    message.error(error?.response?.data?.message || '更新失败，请稍后再试')
  } finally {
    saving.value = false
  }
}

const startEdit = () => {
  editMode.value = true
}

const cancelEdit = () => {
  ensureForm(rawProfile.value)
  editMode.value = false
}

const handleNav = (key) => {
  if (key === 'profile') return
  router.push('/home')
}

const goHome = () => router.push('/home')
const noop = () => {}

const handleLogout = () => {
  userStore.logout()
}

const fileInput = ref(null)
const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFile = (event) => {
  const file = event?.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.avatarUrl = reader.result
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f7f8fb;
}

.main-area {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fbff 0%, #eef2ff 100%);
}

.content {
  flex: 1;
  padding: 0 28px 32px;
}

.profile-card {
  border-radius: 18px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.header-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.info h3 {
  margin: 0 0 4px;
  font-size: 20px;
}

.info p {
  margin: 0;
}

.muted {
  color: #6b7280;
}

.value {
  margin: 0;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.profile-form {
  margin-top: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.hidden-input {
  display: none;
}
</style>
