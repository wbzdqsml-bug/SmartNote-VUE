<template>
    <el-page-header content="回收站" />
    <el-table :data="list" class="mt-4">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="deletedTime" label="删除时间" />
      <el-table-column>
        <template #default="scope">
          <el-button type="success" @click="restore(scope.row.id)">恢复</el-button>
          <el-button type="danger" @click="remove(scope.row.id)">彻底删除</el-button>
        </template>
      </el-table-column>
    </el-table>
</template>

<script setup>
import { getDeletedNotes, restoreNotes, deletePermanent } from '../api/recycle'
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const list = ref([])

const load = async () => { list.value = await getDeletedNotes() }
onMounted(load)

const restore = async (id) => { await restoreNotes([id]); ElMessage.success('已恢复'); load() }
const remove = async (id) => { await deletePermanent([id]); ElMessage.success('已彻底删除'); load() }
</script>
