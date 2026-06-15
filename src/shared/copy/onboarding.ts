/**
 * User-facing copy for upload → generate onboarding.
 * Do not echo internal generation prompts (e.g. preserve identity, pose-only, reference, subject).
 */
export const ONBOARDING_COPY = {
  welcome: {
    title: '上传一张照片，让它住进你的电脑。',
    subtitle: '猫、狗、玩偶或原创角色，都能变成陪你工作学习的桌宠。',
    createCta: '创建我的桌宠',
    sampleCta: '先体验示例宠物',
    sampleLoading: '正在准备示例宠物…'
  },
  upload: {
    titleNew: '上传图片',
    titleReplace: '更换桌宠',
    hintNew: '选一张主体清晰、无遮挡的照片，我们会生成与原图一致的六种桌宠姿势。',
    hintReplace: '换一张主体清晰的照片，我们会保留它的外形、颜色与标志性特征。',
    cta: '点击或拖拽上传',
    uploading: '上传中…'
  },
  generating: {
    upload: '正在上传照片…',
    remote: '正在创造你的桌宠…',
    local: '正在准备它的样子…',
    poseProgress: (poseLabel: string, index: number, total: number) =>
      `正在画「${poseLabel}」（${index}/${total}）`,
    poseWorking: (poseLabel: string) => `正在准备「${poseLabel}」…`,
    identityNote: '会保留原图主体的外形、颜色、纹理与标志性细节'
  },
  result: {
    title: '你的桌宠准备好了',
    subtitle: '已生成与原图主体一致的六种桌宠姿势。',
    useCta: '使用这只桌宠',
    regenerate: '重新生成',
    uploadAnother: '上传另一张'
  },
  naming: {
    title: '给它起个名字',
    subtitleSample: '这是内置示例宠物，起个名字就能马上体验。',
    subtitleCustom: '你的桌宠马上就能住进桌面了。'
  }
} as const
