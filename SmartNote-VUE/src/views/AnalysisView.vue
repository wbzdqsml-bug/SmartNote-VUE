<template>
  <div class="analysis-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">学习统计</h2>
        <p class="page-subtitle">用数据回顾学习轨迹，发现进步趋势。</p>
      </div>
      <n-button quaternary size="small" :loading="isLoading" @click="refreshData">
        刷新
      </n-button>
    </div>

    <n-spin :show="isLoading">
      <n-grid cols="1 s:2 m:2 l:2" :x-gap="16" :y-gap="16" responsive="screen">
        <n-gi>
          <n-card title="学习活动热力图" :segmented="true">
            <div class="chart-wrapper">
              <div ref="heatmapRef" class="chart-container"></div>
              <div v-if="!heatmapData.length && !loadingState.heatmap" class="empty-hint">
                {{ emptyText }}
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="学习趋势" :segmented="true">
            <div class="chart-wrapper">
              <div ref="trendRef" class="chart-container"></div>
              <div v-if="!trendData.length && !loadingState.trend" class="empty-hint">
                {{ emptyText }}
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="分类统计" :segmented="true">
            <div class="chart-wrapper">
              <div ref="categoryRef" class="chart-container"></div>
              <div v-if="!categoryData.length && !loadingState.categories" class="empty-hint">
                {{ emptyText }}
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="标签统计" :segmented="true">
            <div class="chart-wrapper">
              <div ref="tagRef" class="chart-container"></div>
              <div v-if="!tagData.length && !loadingState.tags" class="empty-hint">
                {{ emptyText }}
              </div>
            </div>
          </n-card>
        </n-gi>

        <n-gi span="2">
          <n-card title="工作区笔记占比" :segmented="true">
            <div class="chart-wrapper">
              <div ref="workspaceRef" class="chart-container wide"></div>
              <div v-if="!workspaceData.length && !loadingState.workspace" class="empty-hint">
                {{ emptyText }}
              </div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NCard, NGi, NGrid, NSpin, useMessage } from 'naive-ui'
import * as echarts from 'echarts/core'
import { HeatmapChart, LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import analysisApi from '@/api/analysis'

echarts.use([
  HeatmapChart,
  LineChart,
  PieChart,
  BarChart,
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer
])

const message = useMessage()
const emptyText = '暂无数据，快去记一条笔记吧～'

const heatmapRef = ref(null)
const trendRef = ref(null)
const categoryRef = ref(null)
const tagRef = ref(null)
const workspaceRef = ref(null)

const heatmapData = ref([])
const trendData = ref([])
const categoryData = ref([])
const tagData = ref([])
const workspaceData = ref([])

const loadingState = reactive({
  heatmap: false,
  trend: false,
  categories: false,
  tags: false,
  workspace: false
})

const isLoading = computed(() => Object.values(loadingState).some(Boolean))

const chartMap = {
  heatmap: null,
  trend: null,
  category: null,
  tag: null,
  workspace: null
}

const resolveData = (response) => {
  if (!response) return []
  const payload = response.data ?? []
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data ?? []
  }
  return payload ?? []
}

const toNumber = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

const formatMonthDay = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

const normaliseHeatmap = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => ({
      date: item.date || item.day || item.dateString || '',
      count: toNumber(item.count ?? item.value ?? 0)
    }))
    .filter((item) => item.date)

const normaliseTrend = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => ({
      date: item.date || item.day || '',
      created: toNumber(item.created),
      updated: toNumber(item.updated ?? item.count ?? 0)
    }))
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

const normaliseCategory = (list) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    id: item.categoryId ?? item.id,
    name: item.name || '未命名分类',
    color: item.color || null,
    count: toNumber(item.count)
  }))

const normaliseTag = (list) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    id: item.tagId ?? item.id,
    name: item.name || '未命名标签',
    color: item.color || null,
    count: toNumber(item.count)
  }))

const normaliseWorkspace = (list) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    id: item.workspaceId ?? item.id,
    name: item.name || '未命名工作区',
    count: toNumber(item.count),
    percentage: Number.isFinite(Number(item.percentage)) ? Number(item.percentage) : null
  }))

const initCharts = () => {
  if (heatmapRef.value && !chartMap.heatmap) {
    chartMap.heatmap = echarts.init(heatmapRef.value)
  }
  if (trendRef.value && !chartMap.trend) {
    chartMap.trend = echarts.init(trendRef.value)
  }
  if (categoryRef.value && !chartMap.category) {
    chartMap.category = echarts.init(categoryRef.value)
  }
  if (tagRef.value && !chartMap.tag) {
    chartMap.tag = echarts.init(tagRef.value)
  }
  if (workspaceRef.value && !chartMap.workspace) {
    chartMap.workspace = echarts.init(workspaceRef.value)
  }
}

const renderHeatmapChart = () => {
  if (!chartMap.heatmap) return
  const calendarYear =
    (heatmapData.value[0]?.date && String(heatmapData.value[0].date).slice(0, 4)) ||
    new Date().getFullYear()
  const seriesData = heatmapData.value.map((item) => [item.date, item.count])
  const maxCount =
    seriesData.length > 0 ? Math.max(...seriesData.map((item) => item[1] ?? 0), 0) || 1 : 1

  chartMap.heatmap.clear()
  chartMap.heatmap.setOption(
    {
      tooltip: {
        position: 'top',
        formatter: ({ value }) => `${value[0]}：${value[1]} 次`
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxCount,
        inRange: {
          color: ['#e0f3ff', '#4caf50']
        }
      },
      calendar: {
        range: String(calendarYear),
        cellSize: [16, 16],
        splitLine: { show: false },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#f1f5f9'
        },
        monthLabel: { nameMap: 'cn' },
        dayLabel: { nameMap: 'cn' }
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: seriesData
        }
      ]
    },
    true
  )
}

const renderTrendChart = () => {
  if (!chartMap.trend) return
  const xAxis = trendData.value.map((item) => formatMonthDay(item.date))
  const created = trendData.value.map((item) => item.created)
  const updated = trendData.value.map((item) => item.updated)

  chartMap.trend.clear()
  chartMap.trend.setOption(
    {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['新建', '更新']
      },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: xAxis,
        boundaryGap: false,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: true }
      },
      series: [
        {
          name: '新建',
          type: 'line',
          data: created,
          smooth: true,
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.15)'
          },
          lineStyle: { color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: '更新',
          type: 'line',
          data: updated,
          smooth: true,
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.12)'
          },
          lineStyle: { color: '#10b981' },
          itemStyle: { color: '#10b981' }
        }
      ]
    },
    true
  )
}

const renderCategoryChart = () => {
  if (!chartMap.category) return
  const seriesData = categoryData.value.map((item) => ({
    name: item.name,
    value: item.count,
    itemStyle: item.color ? { color: item.color } : undefined
  }))

  chartMap.category.clear()
  chartMap.category.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>数量：{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '分类',
          type: 'pie',
          radius: '65%',
          center: ['40%', '50%'],
          data: seriesData,
          label: {
            formatter: '{b}\n{c} ({d}%)'
          }
        }
      ]
    },
    true
  )
}

const renderTagChart = () => {
  if (!chartMap.tag) return
  const topTags = [...tagData.value]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  const names = topTags.map((item) => item.name)
  const counts = topTags.map((item) => item.count)
  const colors = topTags.map((item) => item.color)

  chartMap.tag.clear()
  chartMap.tag.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: 90, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'value',
        minInterval: 1
      },
      yAxis: {
        type: 'category',
        data: names,
        axisTick: { show: false }
      },
      series: [
        {
          type: 'bar',
          data: counts.map((value, index) => ({
            value,
            itemStyle: colors[index] ? { color: colors[index] } : undefined
          })),
          label: {
            show: true,
            position: 'right'
          },
          itemStyle: {
            borderRadius: [0, 6, 6, 0]
          }
        }
      ]
    },
    true
  )
}

const renderWorkspaceChart = () => {
  if (!chartMap.workspace) return
  const seriesData = workspaceData.value.map((item) => ({
    name: item.name,
    value: item.count,
    percentage: item.percentage
  }))

  chartMap.workspace.clear()
  chartMap.workspace.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const percent = params.data?.percentage
          const percentText =
            percent === null || percent === undefined ? `${params.percent}%` : `${percent}%`
          return `${params.name}<br/>数量：${params.value}<br/>占比：${percentText}`
        }
      },
      legend: {
        top: 10,
        left: 'center'
      },
      series: [
        {
          name: '工作区占比',
          type: 'pie',
          radius: ['35%', '70%'],
          center: ['50%', '55%'],
          data: seriesData,
          label: {
            formatter: '{b}\n{d}%'
          }
        }
      ]
    },
    true
  )
}

const renderAllCharts = () => {
  renderHeatmapChart()
  renderTrendChart()
  renderCategoryChart()
  renderTagChart()
  renderWorkspaceChart()
}

const fetchAnalysisData = async () => {
  Object.keys(loadingState).forEach((key) => {
    loadingState[key] = true
  })
  try {
    const [heatmapRes, categoryRes, tagRes, trendRes, workspaceRes] = await Promise.all([
      analysisApi.getHeatmap(),
      analysisApi.getCategoryStats(),
      analysisApi.getTagStats(),
      analysisApi.getTrend(),
      analysisApi.getWorkspaceStats()
    ])

    heatmapData.value = normaliseHeatmap(resolveData(heatmapRes))
    categoryData.value = normaliseCategory(resolveData(categoryRes))
    tagData.value = normaliseTag(resolveData(tagRes))
    trendData.value = normaliseTrend(resolveData(trendRes))
    workspaceData.value = normaliseWorkspace(resolveData(workspaceRes))

    await nextTick()
    renderAllCharts()
  } catch (error) {
    console.error('[AnalysisView] fetchAnalysisData error:', error)
    const apiMessage = error?.response?.data?.message
    message.error(apiMessage || '获取学习统计失败，请稍后重试。')
  } finally {
    Object.keys(loadingState).forEach((key) => {
      loadingState[key] = false
    })
  }
}

const refreshData = () => {
  fetchAnalysisData()
}

const handleResize = () => {
  Object.values(chartMap).forEach((chart) => {
    chart?.resize()
  })
}

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
  fetchAnalysisData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.keys(chartMap).forEach((key) => {
    chartMap[key]?.dispose()
    chartMap[key] = null
  })
})
</script>

<style scoped>
.analysis-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.chart-wrapper {
  position: relative;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container.wide {
  height: 320px;
}

.empty-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #9ca3af;
  font-size: 14px;
}
</style>
