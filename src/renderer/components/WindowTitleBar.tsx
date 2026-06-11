import type { AppMode } from '@shared/ipc'
import type { ReactElement } from 'react'

const TITLES: Partial<Record<AppMode, string>> = {
  auth: '登录',
  onboarding: '创建桌宠',
  chat: '和它说话',
  pomodoro: '专注',
  growth: '成长',
  settings: '设置',
  pets: '宠物管理',
  guide: '功能指南'
}

interface WindowTitleBarProps {
  mode: AppMode | 'loading'
}

export function WindowTitleBar({ mode }: WindowTitleBarProps): ReactElement {
  const isMac = window.petory.platform === 'darwin'
  const title = mode === 'loading' ? 'Petory' : (TITLES[mode] ?? 'Petory')

  return (
    <div
      className={`electron-drag flex h-11 shrink-0 items-center border-b border-petory-border/50 bg-petory-bg ${
        isMac ? 'pl-[76px]' : 'pl-4'
      } pr-4`}
      title="拖动标题栏移动窗口"
    >
      <span className="select-none text-[12px] font-medium text-petory-text-secondary">{title}</span>
    </div>
  )
}
