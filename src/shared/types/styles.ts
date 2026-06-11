import type { PetStyleType } from './pet'

export interface StyleCatalogItem {
  id: PetStyleType
  label: string
  labelZh: string
  description: string
  proOnly: boolean
  available: boolean
}
