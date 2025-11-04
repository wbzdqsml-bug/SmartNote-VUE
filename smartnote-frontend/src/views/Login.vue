<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>SmartNote 登录</h2>
      <el-form :model="form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onLogin">登录</el-button>
          <el-button type="text" @click="$router.push('/register')">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { login } from '../api/user'
import { ElMessage } from 'element-plus'

const form = reactive({ username: '', password: '' })
const router = useRouter()
const store = useUserStore()

const onLogin = async () => {
  try {
    const res = await login(form)
    store.setUser(res.token, form.username)
    ElMessage.success('登录成功')
    router.push('/notes')
  } catch {
    ElMessage.error('用户名或密码错误')
  }
}
</script>

<style scoped>
.login-container { display:flex; justify-content:center; align-items:center; height:100vh; background:#f6f6f6; }
.login-card { width:400px; }
</style>
