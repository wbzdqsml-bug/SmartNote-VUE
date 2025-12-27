<template>
  <div class="rich-text-editor" :class="{ 'is-read-only': readOnly }">
    <div v-if="editor && !readOnly" class="toolbar">
       <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileSelect" />
    </div>

    <div class="editable-wrapper">
      <editor-content :editor="editor" />
    </div>

    <FilePreviewModal 
      v-model:show="showPreview" 
      :url="previewUrl" 
      :type="previewType" 
    />
  </div>
</template>

<script setup>
// ... import 保持不变
import { useUserStore } from '@/store/userStore' // [新增] 引入 userStore
// ...

// ... props, emit 保持不变 ...

const message = useMessage();
const userStore = useUserStore(); // [新增]
const fileInput = ref(null);
const showPreview = ref(false);
const previewUrl = ref('');
const previewType = ref(''); // [新增] 预览类型状态

// [新增] 为 API URL 添加认证 token
const addTokenToUrl = (url) => {
  if (url && url.startsWith('/api/') && !url.includes('access_token=')) {
    const token = userStore.token || localStorage.getItem('token') || '';
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    if (cleanToken) {
      return `${url}?access_token=${cleanToken}`;
    }
  }
  return url;
};

// [新增] 从 HTML 内容中移除所有图片的 token
const stripTokenFromHtml = (html) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.includes('?access_token=')) {
      img.setAttribute('src', src.split('?')[0]);
    }
  });
  return doc.body.innerHTML;
};

// [新增] 为 HTML 内容中的所有图片添加 token
const addTokenToHtml = (html) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach(img => {
    img.setAttribute('src', addTokenToUrl(img.getAttribute('src')));
  });
  return doc.body.innerHTML;
};

// [核心修复] 上传逻辑
const uploadImage = async (file) => {
  if (!props.noteId) {
    message.warning('请先保存笔记后再上传图片');
    return null;
  }
  
  const msgReactive = message.loading('上传图片中...', { duration: 0 });
  
  try {
    const res = await noteApi.uploadAttachment(props.noteId, file);
    // 兼容后端返回结构
    const data = res.data.data || res.data; 
    
    // [关键修改] 返回不带 token 的规范 URL
    const attachmentId = data.id || data.Id;
    const canonicalUrl = `/api/notes/attachments/${attachmentId}`;

    message.success('上传成功');
    return canonicalUrl;

  } catch (e) {
    console.error(e);
    message.error('上传失败: ' + (e.message || '未知错误'));
    return null;
  } finally {
    if (msgReactive) msgReactive.destroy();
  }
};

const editor = useEditor({
  // ... extensions 保持不变 ...
  extensions: [
    StarterKit,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    MathExtension.configure({ evaluation: false }),
    Image.configure({ inline: true, allowBase64: true }),
    Placeholder.configure({ placeholder: '开始记录... (支持粘贴图片)' }),
  ],
  editable: !props.readOnly,
  content: addTokenToHtml(props.modelValue), // [修改] 加载时添加 token
  editorProps: {
    // [修改点] 点击图片预览逻辑
    handleClickOn: (view, pos, node, nodePos, event, direct) => {
      if (node.type.name === 'image') {
        previewUrl.value = node.attrs.src;
        // [关键] 强制指定类型为图片，解决 URL 无后缀导致预览失败的问题
        previewType.value = 'image/png'; 
        showPreview.value = true;
        return true; 
      }
      return false;
    },
    // ... handlePaste 保持不变 ...
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items;
      if (!items) return false;
      const imageItem = Array.from(items).find(item => item.type.startsWith('image'));
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        uploadImage(file).then(canonicalUrl => {
          if (canonicalUrl) {
            const displayUrl = addTokenToUrl(canonicalUrl); // 为本次显示添加 token
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: displayUrl });
            const transaction = view.state.tr.replaceSelectionWith(node);
            view.dispatch(transaction);
          }
        });
        return true;
      }
      return false;
    }
  },
  onUpdate: ({ editor }) => {
    // [修改] 保存时移除 token
    if (!props.readOnly && editor && !editor.isDestroyed) {
      emit('update:modelValue', stripTokenFromHtml(editor.getHTML()));
    }
  },
});

// ... 其他逻辑保持不变 ...
const triggerImageUpload = () => fileInput.value?.click();
const handleFileSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const canonicalUrl = await uploadImage(file);
  if (canonicalUrl && editor.value) {
    const displayUrl = addTokenToUrl(canonicalUrl); // 为本次显示添加 token
    editor.value.chain().focus().setImage({ src: displayUrl }).run();
  }
  e.target.value = '';
};
// ... watch, onBeforeUnmount 等保持不变 ...
watch(() => props.modelValue, (value) => {
  // [关键修复] 增加 isDestroyed 判断，防止在即将销毁的实例上执行操作
  if (editor.value && !editor.value.isDestroyed && !editor.value.isFocused) {
    // [修改] 比较前先移除当前编辑器内容里的 token
    const currentContent = stripTokenFromHtml(editor.value.getHTML());
    if (currentContent !== value) {
      // 加载新内容时要添加 token
      editor.value.commands.setContent(addTokenToHtml(value) || '', false);
    }
  }
});
watch(() => props.readOnly, (readOnly) => {
  editor.value?.setEditable(!readOnly);
});
onBeforeUnmount(() => {
  if (editor.value && !editor.value.isDestroyed) {
    editor.value.destroy();
  }
});
</script>

<style scoped>
/* 保持您现有的无边框样式 */
.rich-text-editor { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; background: #fff; }
.toolbar { padding: 8px 0; border-bottom: 1px solid #f1f5f9; background: #fff; flex-shrink: 0; }
.editable-wrapper { flex: 1; overflow-y: auto; padding: 16px 0; line-height: 1.7; }
:deep(.ProseMirror) { min-height: 100%; outline: none; font-size: 16px; color: #333; }
:deep(img) { max-width: 100%; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; }
:deep(img:hover) { opacity: 0.9; box-shadow: 0 0 0 2px #2080f0; }
</style>