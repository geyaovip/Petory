export type GuideStepId =
  | 'drag'
  | 'bubble'
  | 'menu'
  | 'styles'
  | 'multiPet'
  | 'poses'

export interface GuideStep {
  id: GuideStepId
  title: string
  body: string
}

export const GUIDE_COPY = {
  stepLabel: (current: number, total: number) => `新手引导 ${current}/${total}`,
  skip: '跳过',
  prev: '上一步',
  next: '下一步',
  finish: '开始陪伴',
  steps: [
    {
      id: 'drag',
      title: '拖拽桌宠',
      body: '按住桌宠拖动，把它放在你习惯的位置。它会一直待在桌面上陪你。'
    },
    {
      id: 'bubble',
      title: '点击气泡聊天',
      body: '点击头顶气泡，或按 ⌘⇧C（Windows：Ctrl+Shift+C）打开聊天窗。'
    },
    {
      id: 'menu',
      title: '右键打开菜单',
      body: '在桌宠上右键，可开始专注、查看成长、打开设置，或更换宠物。'
    },
    {
      id: 'styles',
      title: '多种画风',
      body: '创建或更换桌宠时可选不同风格；Pro 可解锁像素、贴纸、毛绒等画风。宠物管理里也能换风格重新生成。'
    },
    {
      id: 'multiPet',
      title: '多宠并行（Pro）',
      body: '在宠物管理中把多只桌宠「显示在桌面」。主宠负责聊天与成长，同伴宠会一起陪你待着。'
    },
    {
      id: 'poses',
      title: '多姿势切换',
      body: '生成桌宠时会产出多种姿势。专注、开心、提醒、久未互动睡觉等状态下，主宠会自动换姿势图。升级 Pro 可补全缺失姿势。'
    }
  ] as const satisfies readonly GuideStep[]
} as const
