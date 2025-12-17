<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    title="智能出题"
    :mask-closable="false"
    style="width: 80%; max-width: 800px"
  >
    <template #header>
      <div>智能出题</div>
    </template>
    <n-spin :show="false">
      <div v-if="questions.length">
        <div class="quiz-meta">
          <n-progress
            type="line"
            :percentage="progressPercentage"
            :indicator-placement="'inside'"
            processing
            class="quiz-progress"
          />
          <div class="score-row">
            <n-tag size="small" :type="accuracyTagType">
              正确率：{{ accuracyText }}
            </n-tag>
            <span class="answered">已答 {{ answeredCount }}/{{ questions.length }}</span>
          </div>
        </div>

        <n-card class="question-card">
          <template #header>
            <div class="question-header">
              <span>第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题</span>
              <n-tag
                v-if="currentQuestionAnswered"
                size="small"
                :type="answeredCorrectly[currentQuestionIndex] ? 'success' : 'error'"
              >
                {{ answeredCorrectly[currentQuestionIndex] ? '正确' : '错误' }}
              </n-tag>
            </div>
          </template>

          <div class="question-text">{{ currentQuestion?.question }}</div>
          <n-radio-group
            v-model:value="selectedAnswer[currentQuestionIndex]"
            name="radio-group-answer"
            class="options-group"
            :disabled="currentQuestionAnswered || finished"
          >
            <n-radio
              v-for="(option, oIndex) in currentQuestion?.options || []"
              :key="oIndex"
              :value="oIndex"
              class="option-item"
            >
              {{ option }}
            </n-radio>
          </n-radio-group>
        </n-card>

        <n-space justify="space-between" class="quiz-navigation">
          <n-button :disabled="currentQuestionIndex === 0 || finished" @click="prevQuestion">
            上一题
          </n-button>

          <n-space>
            <n-button
              v-if="currentQuestionAnswered"
              text
              type="primary"
              :disabled="finished"
              @click="toggleExplanation"
            >
              {{ showExplanation ? '收起解析' : '展开解析' }}
            </n-button>

            <n-button
              v-if="!currentQuestionAnswered"
              type="primary"
              :disabled="selectedAnswer[currentQuestionIndex] === undefined"
              @click="submitAnswer"
            >
              提交答案
            </n-button>
            <n-button
              v-else-if="currentQuestionIndex < questions.length - 1"
              type="info"
              :disabled="finished"
              @click="nextQuestion"
            >
              下一题
            </n-button>
            <n-button v-else type="success" :disabled="finished" @click="finishQuiz">
              完成答题
            </n-button>
          </n-space>
        </n-space>

        <n-card
          v-if="currentQuestionAnswered && showExplanation"
          size="small"
          title="解析"
          class="explanation-card"
        >
          <p>正确答案: {{ currentQuestion?.options?.[currentQuestion?.answerIndex] }}</p>
          <p>{{ currentQuestion?.explanation }}</p>
        </n-card>

        <n-card v-if="finished" size="small" class="result-card" title="答题结果">
          <p class="result-text">
            正确率：{{ accuracyText }}
          </p>
        </n-card>
      </div>

      <n-empty v-else description="暂无题目" />
    </n-spin>
    <template #action>
      <n-button @click="showModal = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NButton,
  NSpace,
  NSpin,
  NEmpty,
  NCard,
  NRadioGroup,
  NRadio,
  NProgress,
  NTag,
  useMessage
} from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  questions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'close'])

const message = useMessage()

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const currentQuestionIndex = ref(0)
const selectedAnswer = ref([]) // Stores selected answer index for each question
const answeredCorrectly = ref([]) // Stores boolean for whether each question was answered correctly
const showExplanation = ref(false)
const finished = ref(false)

const currentQuestion = computed(() => props.questions[currentQuestionIndex.value] || null)
const currentQuestionAnswered = computed(() => selectedAnswer.value[currentQuestionIndex.value] !== undefined)

const progressPercentage = computed(() => {
  if (!props.questions.length) return 0
  return ((currentQuestionIndex.value + 1) / props.questions.length) * 100
})

const answeredCount = computed(
  () => selectedAnswer.value.filter((val) => val !== undefined).length
)

const correctCount = computed(() => answeredCorrectly.value.filter((val) => val).length)

const accuracy = computed(() => {
  if (!props.questions.length) return 0
  return (correctCount.value / props.questions.length) * 100
})

const accuracyText = computed(
  () => `${accuracy.value.toFixed(0)}% (${correctCount.value}/${props.questions.length})`
)

const accuracyTagType = computed(() => {
  if (!props.questions.length) return 'default'
  if (accuracy.value >= 80) return 'success'
  if (accuracy.value >= 60) return 'warning'
  return 'error'
})

watch(
  () => props.questions,
  (newQuestions) => {
    if (newQuestions.length) {
      currentQuestionIndex.value = 0
      selectedAnswer.value = new Array(newQuestions.length).fill(undefined)
      answeredCorrectly.value = new Array(newQuestions.length).fill(false)
      showExplanation.value = false
      finished.value = false
    }
  },
  { immediate: true }
)

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    showExplanation.value = false
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < props.questions.length - 1) {
    currentQuestionIndex.value++
    showExplanation.value = false
  }
}

const toggleExplanation = () => {
  showExplanation.value = !showExplanation.value
}

const submitAnswer = () => {
  if (selectedAnswer.value[currentQuestionIndex.value] === undefined) {
    message.warning('请选择一个答案！')
    return
  }

  const question = currentQuestion.value
  if (!question) return
  const isCorrect = selectedAnswer.value[currentQuestionIndex.value] === question.answerIndex
  answeredCorrectly.value[currentQuestionIndex.value] = isCorrect

  message.success(isCorrect ? '回答正确！' : '回答错误。')
}

const finishQuiz = () => {
  finished.value = true
  message.info(`你完成了测验！正确率: ${accuracyText.value}`, { duration: 5000 })
}
</script>

<style scoped>
.quiz-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.answered {
  font-size: 12px;
  color: #64748b;
}

.quiz-progress {
  margin-bottom: 20px;
}
.question-card {
  margin-bottom: 20px;
}
.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.question-text {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 15px;
}
.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  padding: 8px 0;
}
.quiz-navigation {
  margin-bottom: 20px;
}
.explanation-card {
  margin-top: 20px;
}
.result-card {
  margin-top: 16px;
}
.result-text {
  margin: 0;
  color: #334155;
  font-weight: 600;
}
</style>
