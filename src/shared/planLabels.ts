export function getPlanLabel(plan: string | undefined): string {
  if (plan === 'pro') return 'Pro 会员'
  if (plan === 'free') return '免费版'
  return plan ?? '—'
}
