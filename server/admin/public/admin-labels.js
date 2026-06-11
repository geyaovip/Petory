/**
 * Admin console display labels — map internal field values to readable Chinese.
 */
;(function () {
  const PLAN = { free: '免费版', pro: 'Pro 会员' }
  const USER_STATUS = { active: '正常', disabled: '已禁用' }
  const JOB_STATUS = {
    pending: '排队中',
    processing: '生成中',
    succeeded: '成功',
    failed: '失败',
    cancelled: '已取消'
  }
  const JOB_TYPE = {
    full_batch: '完整生成',
    pose_completion: '补全姿势',
    single_pose: '单姿势',
    single_pose_regen: '单姿势重生成',
    client_local: '客户端本地生成'
  }
  const STYLE = {
    petory: 'Petory 默认',
    pixel: '像素风',
    sticker: '贴纸风',
    plush: '毛绒风',
    clay: '黏土风',
    cyber: '赛博风'
  }
  const POSE = {
    idle: '日常待机',
    happy: '开心',
    focus: '专注中',
    sleep: '睡觉',
    remind: '提醒你',
    angry: '小生气'
  }
  const PAYMENT_STATUS = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    cancelled: '已取消'
  }
  const ERROR_CODE = {
    GENERATION_FAILED: '生成失败',
    CHAT_FAILED: '对话失败',
    CHAT_QUOTA_EXCEEDED: '对话额度不足',
    QUOTA_EXCEEDED: '生成额度不足',
    STYLE_LOCKED: '风格需 Pro',
    AUTH_EXPIRED: '登录过期',
    SERVICE_DISABLED: '服务维护中',
    NETWORK_ERROR: '网络错误',
    RATE_LIMIT: '请求过于频繁',
    UPLOAD_INVALID: '图片无效',
    REMBG_FAILED: '桌面抠图失败',
    UNKNOWN: '未知错误'
  }
  const AUDIT_ACTION = {
    admin_login: '管理员登录',
    update_system_config: '更新系统配置',
    disable_user: '禁用用户',
    enable_user: '恢复用户',
    grant_quota: '赠送生成额度',
    activate_pro: '开通 Pro',
    deactivate_pro: '取消 Pro',
    flag_device: '标记异常设备',
    unflag_device: '取消设备标记',
    create_redeem_code: '创建兑换码',
    disable_redeem_code: '停用兑换码',
    enable_redeem_code: '启用兑换码'
  }
  const TARGET_TYPE = { user: '用户', device: '设备', redeem_code: '兑换码', system: '系统' }
  const CONFIG_LABEL = {
    freeDailyGenerationLimit: '免费用户每日生成次数',
    proDailyGenerationLimit: 'Pro 用户每日生成次数',
    freeDailyChatLimit: '免费用户每日对话次数',
    proDailyChatLimit: 'Pro 用户每日对话次数',
    jobTimeoutSeconds: '单任务超时（秒）',
    registrationOpen: '允许新用户注册',
    generationServiceEnabled: '开启图片生成服务',
    chatServiceEnabled: '开启 AI 对话服务',
    paymentEnabled: '开启支付功能',
    mockPaymentEnabled: '开启模拟支付（测试）',
    maintenanceNotice: '维护公告（客户端可见）'
  }
  const CONFIG_HINT = {
    jobTimeoutSeconds: '超过此时长未完成的生成任务将标记失败。',
    mockPaymentEnabled: '仅测试环境使用，正式环境请关闭。',
    maintenanceNotice: '留空表示无公告；填写后会在客户端展示。'
  }
  const OS = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function pick(map, key, fallback = '—') {
    if (key == null || key === '') return fallback
    const raw = String(key)
    return map[raw] ?? map[raw.toLowerCase()] ?? map[raw.toUpperCase()] ?? raw
  }

  function badge(text, variant = '') {
    const v = variant ? ` ${variant}` : ''
    return `<span class="badge${v}">${esc(text)}</span>`
  }

  function statusBadge(status) {
    const label = pick(JOB_STATUS, status, status)
    if (status === 'succeeded' || status === 'active' || status === 'paid') return badge(label, 'ok')
    if (status === 'failed' || status === 'disabled' || status === 'cancelled') return badge(label, 'danger')
    if (status === 'processing' || status === 'pending') return badge(label, 'warn')
    return badge(label, 'info')
  }

  function planBadge(plan) {
    const label = pick(PLAN, plan, plan)
    return plan === 'pro' ? badge(label, 'info') : badge(label)
  }

  function userStatusBadge(status) {
    const label = pick(USER_STATUS, status, status)
    if (status === 'active') return badge(label, 'ok')
    if (status === 'disabled') return badge(label, 'danger')
    return badge(label)
  }

  function formatTime(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('zh-CN', { hour12: false })
    } catch {
      return iso
    }
  }

  function formatDate(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('zh-CN')
    } catch {
      return iso
    }
  }

  function formatDuration(ms) {
    if (ms == null || ms === '' || Number.isNaN(Number(ms))) return '—'
    const n = Number(ms)
    if (n < 1000) return `${n} 毫秒`
    if (n < 60000) return `${(n / 1000).toFixed(1)} 秒`
    return `${(n / 60000).toFixed(1)} 分钟`
  }

  function shortId(id, len = 8) {
    if (!id) return '—'
    const s = String(id)
    return s.length <= len + 1 ? s : `${s.slice(0, len)}…`
  }

  function errorLabel(code) {
    if (!code) return '—'
    const upper = String(code).toUpperCase()
    if (ERROR_CODE[upper]) return ERROR_CODE[upper]
    if (upper.startsWith('MINIMAX_')) return '图像服务异常'
    if (upper.startsWith('KIMI_')) return '对话服务异常'
    return pick(ERROR_CODE, code, code)
  }

  function friendlyError(code, message) {
    const label = errorLabel(code)
    if (!message || /MiniMax|rembg|HTTP|KIMI_|pip3|api\./i.test(message)) return label
    return `${label}：${message}`
  }

  function formatAuditDetail(detail) {
    if (!detail) return '—'
    const raw = String(detail).trim()
    if (!raw.startsWith('{') && !raw.startsWith('[')) {
      if (raw.includes('=')) {
        return raw
          .split(',')
          .map((part) => {
            const [k, v] = part.split('=')
            return `${esc(k?.trim())}：${esc(v?.trim())}`
          })
          .join('；')
      }
      return esc(raw)
    }
    try {
      const obj = JSON.parse(raw)
      if (typeof obj !== 'object' || obj == null) return esc(raw)
      return Object.entries(obj)
        .map(([k, v]) => `${esc(pick(CONFIG_LABEL, k, k))}：${esc(String(v))}`)
        .join('；')
    } catch {
      return esc(raw)
    }
  }

  function deviceLabel(device) {
    if (device.deviceName) return esc(device.deviceName)
    return `<span class="muted" title="${esc(device.localDeviceId)}">设备 ${esc(shortId(device.localDeviceId))}</span>`
  }

  function osLabel(os, version, appVersion) {
    const name = pick(OS, os, os || '未知系统')
    const parts = [name]
    if (version) parts.push(version)
    if (appVersion) parts.push(`客户端 ${appVersion}`)
    return esc(parts.join(' · '))
  }

  window.AdminFmt = {
    esc,
    pick,
    badge,
    statusBadge,
    planBadge,
    userStatusBadge,
    formatTime,
    formatDate,
    formatDuration,
    shortId,
    errorLabel,
    friendlyError,
    formatAuditDetail,
    deviceLabel,
    osLabel,
    maps: { PLAN, USER_STATUS, JOB_STATUS, JOB_TYPE, STYLE, POSE, PAYMENT_STATUS, ERROR_CODE, AUDIT_ACTION, TARGET_TYPE, CONFIG_LABEL, CONFIG_HINT }
  }
})()
