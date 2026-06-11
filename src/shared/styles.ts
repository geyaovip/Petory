import type { PetStyleType } from './types/pet'

export interface PetStyleDefinition {
  id: PetStyleType
  label: string
  labelZh: string
  description: string
  proOnly: boolean
}

export const PET_STYLE_CATALOG: PetStyleDefinition[] = [
  {
    id: 'petory',
    label: 'Petory Style',
    labelZh: 'Petory 默认',
    description: '自然柔和，最贴近你的照片。',
    proOnly: false
  },
  {
    id: 'pixel',
    label: 'Pixel',
    labelZh: '像素风',
    description: '复古像素感，轮廓清晰、色块分明。',
    proOnly: true
  },
  {
    id: 'sticker',
    label: 'Sticker',
    labelZh: '贴纸风',
    description: '扁平贴纸感，线条干净、色块明快。',
    proOnly: true
  },
  {
    id: 'plush',
    label: 'Plush',
    labelZh: '毛绒风',
    description: '柔软玩偶感，圆润饱满、温暖治愈。',
    proOnly: true
  },
  {
    id: 'clay',
    label: 'Clay',
    labelZh: '黏土风',
    description: '手捏黏土感，微磨砂、略呆萌。',
    proOnly: true
  },
  {
    id: 'cyber',
    label: 'Cyber Pet',
    labelZh: '赛博风',
    description: '科幻赛博感，霓虹点缀、未来轮廓。',
    proOnly: true
  }
]

export function getStyleDefinition(id: PetStyleType): PetStyleDefinition {
  return PET_STYLE_CATALOG.find((s) => s.id === id) ?? PET_STYLE_CATALOG[0]
}
