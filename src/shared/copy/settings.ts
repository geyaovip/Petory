export const SETTINGS_COPY = {
  loading: '加载设置中…',
  tabs: {
    account: '账号',
    pet: '桌宠',
    privacy: '隐私',
    advanced: '高级'
  },
  account: {
    quotaRemaining: (chat: number, gen: number) =>
      `今日剩余：对话 ${chat} 次 · 生成 ${gen} 次`,
    proExpires: 'Pro 有效期至',
    cloudSync: '云端同步',
    genMaintenance: ' · 生成维护中',
    chatMaintenance: ' · 对话维护中',
    redeemPlaceholder: '兑换码',
    redeem: '兑换',
    redeemSuccess: '兑换成功',
    redeemSuccessWithPoses: (count: number) => `兑换成功，已补全 ${count} 张 Pro 姿势`,
    logout: '退出登录'
  },
  desktop: {
    launchAtStartup: '开机自启动',
    alwaysOnTop: '桌宠置顶',
    petSize: '桌宠大小',
    sizeSmall: '小',
    sizeMedium: '中',
    sizeLarge: '大',
    opacity: (percent: number) => `透明度 ${percent}%`,
    enableSound: '声音效果'
  },
  reminders: {
    sedentary: '久坐提醒',
    sedentaryInterval: '久坐间隔',
    sedentaryMinutes: (min: number) => `${min} 分钟`,
    pomodoro: '番茄钟提醒'
  },
  api: {
    title: '服务地址',
    placeholder: '留空使用默认服务',
    hint: '配置后登录、生成与对话将同步云端额度；密钥由服务端保管，无需在本机填写。'
  },
  personality: {
    title: '宠物性格',
    updated: '性格已更新'
  },
  poseCompletion: {
    title: 'Pro 姿势补全',
    hint: '升级 Pro 后可为已有桌宠补生成专注、睡觉等姿势（不消耗生成额度）。',
    missing: (name: string, count: number) => `${name}：缺 ${count} 种`,
    running: '补全中…',
    cta: '补全 Pro 姿势',
    success: (total: number) => (total > 0 ? `已补全 ${total} 张姿势图` : '姿势已是最新')
  },
  activePet: {
    title: '当前桌宠',
    lastStyle: (style: string, poseCount: number) =>
      `上次生成风格：${style} · ${poseCount} 种姿势`,
    replace: '更换桌宠 / 换风格'
  },
  legal: {
    title: '法律与隐私',
    terms: '用户协议',
    privacy: '隐私政策',
    crashReporting: '本地崩溃日志（不上传服务器）',
    reopenGuide: '重新查看新手引导'
  },
  data: {
    title: '数据与隐私',
    hint: '导出/导入完整备份（含桌宠图片与设置）。换机后请重新登录账号；导入前会自动备份当前数据。',
    export: '导出本地数据',
    exportSuccess: '已保存到本地',
    import: '从备份导入',
    importSuccess: (count: number) =>
      `导入成功：${count} 个资源文件。请重启应用或重新打开桌宠窗口。`,
    clearChat: '清除聊天记录',
    clearChatSuccess: '聊天记录已清除',
    petManager: '宠物管理',
    wipeAll: '删除全部本地数据',
    confirmImport: {
      title: '导入备份',
      message:
        '导入将覆盖当前桌宠与设置（账号登录状态保留）。导入前会自动备份当前数据，确定继续吗？',
      confirm: '继续导入'
    },
    confirmWipe: {
      title: '删除全部数据',
      message: '确定删除全部本地数据？此操作不可恢复。',
      confirm: '确定删除'
    }
  },
  update: {
    title: '更新',
    available: (version: string) => `发现新版本 v${version}`,
    ready: (version: string) => `v${version} 已下载，可安装`,
    downloading: (percent: number) => `正在下载 ${percent}%`,
    defaultMessage: '启动后会自动检查更新',
    check: '检查更新',
    checked: '已检查更新',
    download: '下载更新',
    install: '立即安装并重启'
  },
  about: {
    title: '关于',
    version: (ver: string) => `Petory v${ver}`,
    website: '访问官网',
    downloadPage: '下载页（分享链接）',
    feedback: '反馈与建议',
    quit: '退出 Petory'
  }
} as const
