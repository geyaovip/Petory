export const PETS_COPY = {
  loading: '正在加载宠物列表…',
  empty: {
    title: '还没有宠物',
    description: '上传一张照片，创造你的第一只桌宠吧。',
    action: '创建桌宠'
  },
  confirmDeleteImages: {
    title: '删除图片',
    message: (name: string) => `确定删除「${name || '未命名'}」的图片文件？`,
    confirm: '删除'
  },
  pendingFinalize: {
    banner: '这只桌宠已生成完成，还差最后一步命名即可住进桌面。',
    action: '完成创建'
  }
} as const
