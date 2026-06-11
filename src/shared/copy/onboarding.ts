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
    hintNew: '选一张清晰的宠物照片，下一步可以挑风格。',
    hintReplace: '换一张照片，就能生成新的桌宠。',
    cta: '点击或拖拽上传',
    uploading: '上传中…'
  },
  styleSelect: {
    title: '准备生成',
    hint: '挑好风格后，我们会根据你的照片创造桌宠。',
    hintReplace: '挑好风格后，会为你生成新的桌宠。'
  },
  generating: {
    upload: '正在上传照片…',
    remote: '正在创造你的桌宠…',
    local: '正在准备它的样子…',
    poseProgress: (poseLabel: string, index: number, total: number) =>
      `正在画「${poseLabel}」（${index}/${total}）`,
    poseWorking: (poseLabel: string) => `正在画「${poseLabel}」…`,
    styleNote: (styleLabel: string) => `风格：${styleLabel}`
  },
  result: {
    title: '你的桌宠准备好了',
    subtitle: (styleLabel: string) => `当前风格：${styleLabel}`,
    useCta: '使用这只桌宠',
    restyleToggle: '换风格试试',
    restyleHint: '选好后点重新生成，会消耗一次生成额度。',
    regenerate: '按此风格重新生成',
    uploadAnother: '上传另一张'
  },
  naming: {
    title: '给它起个名字',
    subtitleSample: '这是内置示例宠物，起个名字就能马上体验。',
    subtitleCustom: '你的桌宠马上就能住进桌面了。',
    styleNote: (styleLabel: string) => `风格：${styleLabel}`
  }
} as const
