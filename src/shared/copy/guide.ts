export type GuideStepId =
  | 'drag'
  | 'bubble'
  | 'menu'
  | 'identity'
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
      id: 'identity',
      title: '忠于原图',
      body: '上传照片后会直接生成桌宠，不做风格迁移，并尽量保留主体的外形、颜色、纹理和标志性细节。'
    },
    {
      id: 'multiPet',
      title: '多宠陪伴',
      body: '在宠物管理中把多只桌宠「显示在桌面」。主宠负责聊天与成长，同伴宠会一起陪你待着。'
    },
    {
      id: 'poses',
      title: '多姿势切换',
      body: '每只桌宠默认生成六种姿势。专注、开心、提醒、睡觉等状态下，主宠会自动切换对应姿势。'
    }
  ] as const satisfies readonly GuideStep[]
} as const
