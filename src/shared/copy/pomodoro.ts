export const POMODORO_COPY = {
  title: '番茄钟',
  phase: {
    idle: '准备专注',
    focus: '专注中…',
    break: '休息一下吧'
  },
  paused: '已暂停',
  start: '开始专注',
  resume: '继续',
  pause: '暂停',
  end: '结束',
  durationHint: (focusMin: number, breakMin: number) =>
    `默认 ${focusMin} 分钟专注 / ${breakMin} 分钟休息`
} as const
