import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { CHAT_COPY } from '@shared/copy/chat'
import { CONTENT_SAFETY } from '@shared/constants'
import type { ChatMessage } from '@shared/types/chat'
import type { Pet } from '@shared/types/pet'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { TextButton } from '../components/ui/TextButton'
import { EmptyState } from '../components/ui/EmptyState'
import { PanelLoading } from '../components/ui/PanelLoading'
import { Toggle } from '../components/ui/Toggle'

export function ChatPanel(): ReactElement {
  const [pet, setPet] = useState<Pet | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveHistory, setSaveHistory] = useState(true)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      const [activePet, history, settings] = await Promise.all([
        window.petory.pet.getActive(),
        window.petory.chat.getHistory(),
        window.petory.chat.getSettings()
      ])
      setPet(activePet)
      setMessages(history)
      setSaveHistory(settings.enableChatHistory)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    return window.petory.auth.onSessionExpired(({ message }) => {
      setError(message)
      setSending(false)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setError(null)
    setSending(true)
    setInput('')

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      petId: pet?.id ?? '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimistic])

    const result = await window.petory.chat.send(text)
    setSending(false)

    if (!result.success) {
      setError(result.message)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      return
    }

    if (saveHistory) {
      const history = await window.petory.chat.getHistory()
      setMessages(history)
    } else {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        optimistic,
        result.message
      ])
    }
  }

  const handleToggleHistory = async (next: boolean): Promise<void> => {
    setSaveHistory(next)
    await window.petory.chat.setSettings({ enableChatHistory: next })
    if (!next) {
      await window.petory.chat.clearHistory()
      setMessages([])
    } else {
      const history = await window.petory.chat.getHistory()
      setMessages(history)
    }
  }

  if (loading) {
    return <PanelLoading label={CHAT_COPY.loading} />
  }

  if (!pet) {
    return (
      <EmptyState
        title={CHAT_COPY.empty.title}
        description={CHAT_COPY.empty.description}
        actionLabel={CHAT_COPY.empty.action}
        onAction={() => window.petory.pet.openOnboarding({ mode: 'new' })}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-petory-bg text-petory-text">
      <header className="border-b border-petory-border px-4 pb-3 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold">{pet.name}</h1>
            <span className="mt-1 inline-block rounded-full bg-petory-primary-soft px-2 py-0.5 text-[12px] text-petory-primary">
              {pet.personality}
            </span>
          </div>
          <TextButton onClick={() => window.petory.chat.close()}>{CHAT_COPY.close}</TextButton>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-[13px] text-petory-text-tertiary">{CHAT_COPY.emptyThread}</p>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={[
                'max-w-[75%] rounded-xl px-3 py-2 text-[14px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-petory-accent-soft text-petory-text'
                  : 'bg-petory-primary-soft text-petory-text'
              ].join(' ')}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-xl bg-petory-primary-soft px-3 py-2 text-[13px] text-petory-text-secondary">
              {CHAT_COPY.thinking}
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="mx-4 mb-2 rounded-lg bg-petory-error-soft px-3 py-2 text-[13px] text-petory-text">
          {error}
        </div>
      ) : null}

      <footer className="border-t border-petory-border px-4 py-3">
        <div className="mb-3">
          <Toggle
            checked={saveHistory}
            onChange={(next) => void handleToggleHistory(next)}
            label={CHAT_COPY.saveHistory}
          />
        </div>
        <form className="flex gap-2" onSubmit={(e) => void handleSend(e)}>
          <Input
            className="flex-1 bg-petory-surface"
            fullWidth={false}
            placeholder={CHAT_COPY.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            {CHAT_COPY.send}
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-petory-text-tertiary">
          {CONTENT_SAFETY.chat}
        </p>
        <p className="mt-1 text-center text-[11px] text-petory-text-tertiary">{CHAT_COPY.shortcut}</p>
      </footer>
    </div>
  )
}
