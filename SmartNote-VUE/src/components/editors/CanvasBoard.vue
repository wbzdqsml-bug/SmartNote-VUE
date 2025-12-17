<template>
  <div class="canvas-board-container">
    <!-- Toolbar -->
    <div class="canvas-toolbar" v-if="!readOnly">
      <div class="tool-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="setTool('pen')" :type="activeTool === 'pen' ? 'primary' : 'default'" circle :disabled="readOnly">
              <n-icon :component="PenIcon" />
            </n-button>
          </template>
          画笔
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="setTool('eraser')" :type="activeTool === 'eraser' ? 'primary' : 'default'" circle :disabled="readOnly">
              <n-icon :component="EraserIcon" />
            </n-button>
          </template>
          橡皮擦
        </n-tooltip>
      </div>

      <div class="tool-group-divider"></div>

      <!-- Brush/Color Settings -->
      <div class="tool-group">
        <n-popover trigger="click" placement="bottom-start" style="padding: 12px 16px; border-radius: 8px;" :disabled="readOnly">
          <template #trigger>
            <n-button circle :disabled="readOnly">
              <div class="color-swatch" :style="{ backgroundColor: penOptions.color }"></div>
            </n-button>
          </template>
          <div class="option-group">
            <label>画笔颜色</label>
            <n-color-picker v-model:value="penOptions.color" :show-alpha="false" :disabled="readOnly" />
          </div>
        </n-popover>
        <n-popover trigger="click" placement="bottom" style="width: 200px; padding: 12px 16px; border-radius: 8px;" :disabled="readOnly">
          <template #trigger>
            <n-button :disabled="readOnly">{{ penOptions.width }}px</n-button>
          </template>
          <div class="option-group">
            <label>画笔粗细</label>
            <n-slider v-model:value="penOptions.width" :min="1" :max="50" :disabled="readOnly" />
          </div>
        </n-popover>
        <n-popover trigger="click" placement="bottom" style="width: 200px; padding: 12px 16px; border-radius: 8px;" :disabled="readOnly">
          <template #trigger>
            <n-button :disabled="readOnly">{{ eraserOptions.width }}px</n-button>
          </template>
          <div class="option-group">
            <label>橡皮擦大小</label>
            <n-slider v-model:value="eraserOptions.width" :min="1" :max="100" :disabled="readOnly" />
          </div>
        </n-popover>
      </div>

      <div class="tool-group-divider"></div>

      <!-- Actions -->
      <div class="tool-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="clearCanvas" circle :disabled="readOnly">
              <n-icon :component="ClearIcon" />
            </n-button>
          </template>
          清空画板
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="downloadCanvas" circle :disabled="readOnly">
              <n-icon :component="DownloadIcon" />
            </n-button>
          </template>
          下载为PNG
        </n-tooltip>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="canvas-wrapper" ref="canvasWrapperRef">
      <canvas ref="canvasElRef"></canvas>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount, watch, markRaw, nextTick } from 'vue';

import { fabric } from 'fabric';

import { NButton, NIcon, NColorPicker, NSlider, NTooltip, NPopover } from 'naive-ui';

import {

  BrushOutline as PenIcon,

  TrashBinOutline as ClearIcon,

  DownloadOutline as DownloadIcon,

  CutOutline as EraserIcon

} from '@vicons/ionicons5';



const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const CANVAS_BACKGROUND_COLOR = '#ffffff';



// Refs for DOM elements and Fabric canvas

const canvasWrapperRef = ref(null);

const canvasElRef = ref(null);
const canvas = ref(null);

// Tool states



const activeTool = ref('pen');



const penOptions = ref({ color: '#e01e5a', width: 5 });



const eraserOptions = ref({ width: 20 });







// Initialize Fabric.js canvas



const initCanvas = () => {



  if (!canvasWrapperRef.value) return;



  



  const fabricCanvas = new fabric.Canvas(canvasElRef.value, {



    width: 1280,



    height: 800,



    backgroundColor: CANVAS_BACKGROUND_COLOR,



    isDrawingMode: !props.readOnly // Set drawing mode based on readOnly prop



  });







  canvas.value = markRaw(fabricCanvas);



  setTool(activeTool.value);



  loadFromJSON(props.modelValue);







  // Canvas event listeners to save state after drawing or modification



  const saveState = () => {



    if (!canvas.value || props.readOnly) return; // Do not save state if readOnly



    const json = JSON.stringify(canvas.value.toJSON());



    emit('update:modelValue', json);



  };



  fabricCanvas.on('path:created', saveState);



  fabricCanvas.on('object:modified', saveState);



};







// Tool selection logic



const setTool = (tool) => {



  if (props.readOnly) return; // Prevent tool changes if readOnly



  activeTool.value = tool;



  const fabricCanvas = canvas.value;



  if (!fabricCanvas) return;







  fabricCanvas.isDrawingMode = true;







  if (tool === 'pen') {



    const brush = new fabric.PencilBrush(fabricCanvas);



    brush.color = penOptions.value.color;



    brush.width = penOptions.value.width;






    fabricCanvas.freeDrawingBrush = brush;



  } else if (tool === 'eraser') {



    // Fabric 的 PencilBrush 不会把 globalCompositeOperation 传递到最终 Path 上，改用背景色笔刷模拟橡皮擦。



    const eraserBrush = new fabric.PencilBrush(fabricCanvas);



    eraserBrush.color =
      typeof fabricCanvas.backgroundColor === 'string' && fabricCanvas.backgroundColor
        ? fabricCanvas.backgroundColor
        : CANVAS_BACKGROUND_COLOR;



    eraserBrush.width = eraserOptions.value.width;



    fabricCanvas.freeDrawingBrush = eraserBrush;



  }



};







// Watch for changes in options and update the brush



watch(penOptions, (newOptions) => {



  if (props.readOnly) return; // Prevent options changes if readOnly



  if (activeTool.value === 'pen' && canvas.value) {



    const brush = canvas.value.freeDrawingBrush;



    if (brush) {



      brush.color = newOptions.color;



      brush.width = newOptions.width;



    }



  }



}, { deep: true });







watch(eraserOptions, (newOptions) => {



  if (props.readOnly) return; // Prevent options changes if readOnly



  if (activeTool.value === 'eraser' && canvas.value) {



    const brush = canvas.value.freeDrawingBrush;



    if (brush) {



      brush.width = newOptions.width;



    }



  }



}, { deep: true });







// Actions



const clearCanvas = () => {



  if (!canvas.value || props.readOnly) return; // Prevent clear if readOnly



  canvas.value.clear();



  canvas.value.backgroundColor = CANVAS_BACKGROUND_COLOR; // Ensure background is reset
  canvas.value.requestRenderAll();



  const json = JSON.stringify(canvas.value.toJSON());



  emit('update:modelValue', json);



};







const downloadCanvas = () => {



  if (!canvas.value) return;



  const dataURL = canvas.value.toDataURL({ format: 'png', quality: 1.0 });



  const link = document.createElement('a');



  link.href = dataURL;



  link.download = `smartnote-canvas-${Date.now()}.png`;



  document.body.appendChild(link);



  link.click();



  document.body.removeChild(link);



};







// State Management (Save & Load)



const loadFromJSON = (json) => {



  if (json && canvas.value) {



    canvas.value.loadFromJSON(json, () => {



      canvas.value.renderAll();



    });



  }



};







watch(() => props.modelValue, (newVal) => {



  const currentVal = JSON.stringify(canvas.value?.toJSON());



  if (newVal && newVal !== currentVal) {



    loadFromJSON(newVal);



  }



}, { deep: true });







onMounted(() => {



  // Defer canvas initialization until the next DOM update cycle



  // to ensure the container has its final dimensions.



  nextTick(() => {



    initCanvas();
    if (props.readOnly) {
      if (canvas.value) {
        canvas.value.isDrawingMode = false;
        canvas.value.selection = false; // Disable object selection
        canvas.value.getObjects().forEach(obj => {
          obj.selectable = false; // Make existing objects non-selectable
        });
      }
    }


  });



});







onBeforeUnmount(() => {



  canvas.value?.dispose();



});

</script>



<style scoped>

.canvas-board-container {

  display: flex;

  flex-direction: column;

  width: 100%;

  height: 100%;

  background-color: #f8f9fa;

  border-radius: 8px;

  overflow: hidden;

}



.canvas-toolbar {

  flex-shrink: 0;

  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 8px;

  padding: 8px 12px;

  background-color: #ffffff;

  border-bottom: 1px solid #e0e0e0;

  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  z-index: 10;

}



.tool-group {

  display: flex;

  align-items: center;

  gap: 8px;

}



.tool-group-divider {

  width: 1px;

  height: 24px;

  background-color: #e0e0e0;

  margin: 0 8px;

}



.color-swatch {

  width: 20px;

  height: 20px;

  border-radius: 50%;

  border: 1px solid #ccc;

  cursor: pointer;

}



.option-group {

  display: flex;

  flex-direction: column;

  gap: 8px;

}

.option-group label {

  font-size: 13px;

  font-weight: 500;

  color: #333;

}



.canvas-wrapper {



  flex-grow: 1;



  position: relative;



  min-height: 0; /* Important for flexbox children */



  overflow: auto;



}







canvas {



  display: block;



}

</style>
