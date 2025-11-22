<template>
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
      </n-form>

      <div v-if="editMode" class="actions">
        <n-button secondary :loading="loading" @click="cancelEdit">取消</n-button>
        <n-button type="primary" :loading="saving" @click="save">保存修改</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMessage, NCard, NButton, NTag, NAvatar, NInput, NForm, NGrid, NFormItemGi } from 'naive-ui'
import { useUserStore } from '@/store/userStore'
import userApi from '@/api/user'

const userStore = useUserStore()
const message = useMessage()

const form = reactive({
  nickname: '',
  email: '',
  phone: '',
  bio: '',
  avatarUrl: ''
})

const editMode = ref(false)
const loading = ref(false)
const saving = ref(false)
const profile = ref({})
const fileInput = ref(null)
const avatarPreview = ref('')

const displayUid = computed(() => profile.value?.id ?? profile.value?.userId ?? '--')
const displayName = computed(() => profile.value?.nickname || profile.value?.username || '未登录')
const avatarInitial = computed(() =>
  (displayName.value ? displayName.value[0]?.toUpperCase() : 'U')
)

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

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await userApi.profileDetail()
    const data = resolveResponse(res, {})
    profile.value = data || {}
    form.nickname = data.nickname ?? data.nickName ?? data.username ?? ''
    form.email = data.email ?? ''
    form.phone = data.phone ?? ''
    form.bio = data.bio ?? ''
    form.avatarUrl = data.avatarUrl ?? ''
    avatarPreview.value = form.avatarUrl
    editMode.value = false
  } catch (error) {
    console.error('[Profile] loadProfile error:', error)
    message.error(error?.response?.data?.message || '获取用户资料失败')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    await userApi.updateProfile({
      nickname: form.nickname,
      email: form.email,
      phone: form.phone,
      bio: form.bio,
      avatarUrl: form.avatarUrl
    })
    message.success('资料已更新')
    userStore.setProfile({
      ...userStore.profile,
      nickname: form.nickname || userStore.profile?.nickname,
      username: userStore.profile?.username,
      email: form.email,
      phone: form.phone,
      avatarUrl: form.avatarUrl,
      bio: form.bio
    })
    await loadProfile()
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
  editMode.value = false
  loadProfile()
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFile = (e) => {
  const file = e?.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.avatarUrl = reader.result
    avatarPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  if (!userStore.profile) {
    userStore.fetchProfile()
  }
  loadProfile()
})
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

.profile-card {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: none;
}

.header-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.info h3 {
  margin: 0 0 4px;
  color: #111827;
}

.info .muted {
  margin: 0;
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hidden-input {
  display: none;
}

.profile-form {
  margin-top: 8px;
}

.value {
  margin: 0;
  color: #374151;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
</style>
