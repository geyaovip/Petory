import { PET_STYLE_CATALOG } from '../../src/shared/styles'
import type { StyleCatalogItem } from '../../src/shared/types/styles'
import { canUseStyle } from './auth/entitlementService'

export function getStyleCatalog(): StyleCatalogItem[] {
  return PET_STYLE_CATALOG.map((style) => ({
    id: style.id,
    label: style.label,
    labelZh: style.labelZh,
    description: style.description,
    proOnly: style.proOnly,
    available: canUseStyle(style.id).ok
  }))
}
