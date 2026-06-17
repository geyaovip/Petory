export {
  rejectLegacyOfflineSession,
  getAuthState,
  isAuthenticated,
  requestMagicLink,
  consumeMagicLink,
  logout,
  redeemCode,
  clearAuthData,
  bootstrapRemoteSession,
  refreshAuthState
} from './authService'

export { incrementChatUsage, incrementGenerationUsage } from './usageStore'
export {
  canActivatePet,
  canCreatePet,
  canGeneratePet,
  canRegenerateCustomPet,
  canSendChat,
  buildAuthState
} from './entitlementService'
