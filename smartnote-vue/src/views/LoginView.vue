<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>SmartNote 智能笔记系统</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="login-tabs" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginData"
            :rules="loginRules"
            label-width="0px"
            @keyup.enter="handleLogin(loginFormRef)"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginData.username"
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginData.password"
                type="password"
                placeholder="密码"
                show-password
                :prefix-icon="Lock"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                style="width: 100%"
                size="large"
                :loading="loading"
                @click="handleLogin(loginFormRef)"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form
            ref="registerFormRef"
            :model="registerData"
            :rules="registerRules"
            label-width="0px"
            @keyup.enter="handleRegister(registerFormRef)"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerData.username"
                placeholder="设置用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerData.password"
                type="password"
                placeholder="设置密码 (至少6位)"
                show-password
                :prefix-icon="Lock"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerData.confirmPassword"
                type="password"
                placeholder="确认密码"
                show-password
                :prefix-icon="CircleCheck"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                style="width: 100%"
                size="large"
                :loading="loading"
                @click="handleRegister(registerFormRef)"
              >
                注 册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

// --- 登录表单 ---
const loginFormRef = ref(null)
const loginData = reactive({ username: '', password: '' })
const loginRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// --- 注册表单 ---
const registerFormRef = ref(null)
const registerData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}
const registerRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }]
})

// --- 事件处理 ---
const handleLogin = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const msg = await userStore.login(loginData)
        ElMessage.success(msg)
        router.push('/')
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const msg = await userStore.register(registerData)
        ElMessage.success(msg)
        activeTab.value = 'login'
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.login-card {
  width: 400px;
}
.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
}
.login-tabs {
  margin-top: 10px;
}
</style>
