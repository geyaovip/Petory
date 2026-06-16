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
  },
  pendingResume: {
    banner: '这只桌宠已上传照片，但生成尚未完成。',
    action: '继续生成'
  },
  cloudRecoverable: {
    banner: (count: number) =>
      count === 1
        ? '发现 1 个已在云端生成完成的桌宠，可导入后继续命名。'
        : `发现 ${count} 个已在云端生成完成的桌宠，可导入后继续命名。`,
    action: '导入并完成创建',
    importing: '正在导入…'
  }
} as const
