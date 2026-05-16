import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, ExternalLink, ChevronDown, Sparkles, RotateCcw, X } from 'lucide-react'
import { sendChat } from '../api'
import type { Message, Recommendation } from '../types'
import { TEST_TYPE_LABELS } from '../types'

interface Props {
  onBack: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  recommendations?: Recommendation[]
  isComplete?: boolean
  error?: boolean
}

const SUGGESTION_PROMPTS = [
  "I'm hiring a senior Java developer who works with stakeholders",
  "Looking for personality assessments for a sales manager role",
  "Need to assess data scientists at mid-level with Python skills",
  "What should I use for entry-level contact center agents?",
  "Hiring a full-stack engineer, 3 years experience",
]

export default function ChatPage({ onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your SHL assessment consultant. Tell me about the role you're hiring for — job title, seniority level, and any key skills — and I'll recommend the right assessments from SHL's catalog.",
      isComplete: true,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [allRecs, setAllRecs] = useState<Recommendation[]>([])
  const [showRecsPanel, setShowRecsPanel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const turnCount = useRef(0)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildHistory = useCallback((): Message[] => {
    return messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }))
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // Check turn cap (8 turns = 4 user + 4 assistant pairs + welcome)
    const isSignOff = /\b(thanks|thank you|done|perfect|great|goodbye|bye|that.s all)\b/i.test(trimmed)
    if (turnCount.current >= 7 && !isSignOff) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "We've reached the maximum conversation length. Based on our discussion, please review the recommendations in the panel. Start a new conversation if you need to explore different roles.",
        isComplete: true,
      }])
      return
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      isComplete: true,
    }

    const typingMsg: ChatMessage = {
      id: `typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      isComplete: false,
    }

    setMessages(prev => [...prev, userMsg, typingMsg])
    setInput('')
    setLoading(true)
    turnCount.current += 1

    try {
      const history = buildHistory()
      const fullHistory: Message[] = [...history, { role: 'user', content: trimmed }]
      const response = await sendChat(fullHistory)

      // Update recommendations panel
      if (response.recommendations.length > 0) {
        setAllRecs(response.recommendations)
        setShowRecsPanel(true)
      }

      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.id.startsWith('typing-'))
        return [...withoutTyping, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          recommendations: response.recommendations,
          isComplete: true,
        }]
      })
    } catch (err) {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.id.startsWith('typing-'))
        return [...withoutTyping, {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Please try again.'}`,
          isComplete: true,
          error: true,
        }]
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [loading, buildHistory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your SHL assessment consultant. Tell me about the role you're hiring for — job title, seniority level, and any key skills — and I'll recommend the right assessments from SHL's catalog.",
      isComplete: true,
    }])
    setAllRecs([])
    setShowRecsPanel(false)
    setInput('')
    turnCount.current = 0
    inputRef.current?.focus()
  }

  const typeColor = (type: string) => TEST_TYPE_LABELS[type]?.color || '#6366f1'
  const typeLabel = (type: string) => TEST_TYPE_LABELS[type]?.label || type

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(260,87%,3%)',
        display: 'flex',
        flexDirection: 'column',
        color: 'hsl(40,6%,95%)',
        fontFamily: "'Geist Sans', sans-serif",
      }}
    >
      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          backdropFilter: 'blur(12px)',
          background: 'rgba(3,2,8,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={13} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>
                SHL Assessment Consultant
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />
                148 assessments in catalog
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allRecs.length > 0 && (
            <button
              onClick={() => setShowRecsPanel(!showRecsPanel)}
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                padding: '6px 12px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              {allRecs.length} Recommended
              <ChevronDown size={13} style={{ transform: showRecsPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
          <button
            onClick={reset}
            title="New conversation"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Messages scroll area */}
          <div
            className="chat-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 0',
            }}
          >
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="chat-bubble-enter"
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      <Sparkles size={14} color="#a78bfa" />
                    </div>
                  )}

                  <div style={{ maxWidth: '80%' }}>
                    {/* Bubble */}
                    {!msg.isComplete ? (
                      /* Typing indicator */
                      <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px 12px 12px 4px',
                        padding: '14px 18px',
                        display: 'flex',
                        gap: 5,
                        alignItems: 'center',
                      }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} className="typing-dot" style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.4)',
                            display: 'inline-block',
                          }} />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.14))'
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${msg.error
                            ? 'rgba(239,68,68,0.3)'
                            : msg.role === 'user'
                              ? 'rgba(99,102,241,0.25)'
                              : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: msg.role === 'user'
                            ? '12px 12px 4px 12px'
                            : '12px 12px 12px 4px',
                          padding: '13px 17px',
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: msg.error ? 'rgba(252,165,165,1)' : 'hsl(40,6%,92%)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Inline recommendations */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          color: 'rgba(255,255,255,0.35)',
                          textTransform: 'uppercase',
                          marginBottom: 8,
                        }}>
                          Recommended ({msg.recommendations.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {msg.recommendations.map((rec, i) => (
                            <a
                              key={i}
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rec-card"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 13px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 9,
                                textDecoration: 'none',
                                color: 'inherit',
                              }}
                            >
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: 5,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                background: `${typeColor(rec.test_type)}25`,
                                color: typeColor(rec.test_type),
                                border: `1px solid ${typeColor(rec.test_type)}40`,
                                flexShrink: 0,
                              }}>
                                {typeLabel(rec.test_type)}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, letterSpacing: '-0.01em' }}>
                                {rec.name}
                              </span>
                              <ExternalLink size={12} color="rgba(255,255,255,0.35)" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Suggestion chips (only when no user messages yet) ──── */}
          {messages.length === 1 && (
            <div style={{ padding: '0 24px 16px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10,
              }}>
                Try asking
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTION_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontFamily: "'Geist Sans', sans-serif",
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input area ──────────────────────────────────────────────────── */}
          <div style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(3,2,8,0.5)',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the role you're hiring for..."
                rows={1}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '13px 52px 13px 16px',
                  color: 'hsl(40,6%,95%)',
                  fontSize: 14,
                  fontFamily: "'Geist Sans', sans-serif",
                  lineHeight: 1.5,
                  resize: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  caretColor: '#a78bfa',
                  minHeight: 48,
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 160) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                    : 'rgba(255,255,255,0.07)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: input.trim() && !loading ? 1 : 0.4,
                }}
              >
                <Send size={14} color="white" />
              </button>
            </div>
            <div style={{
              maxWidth: 720, margin: '8px auto 0',
              fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center',
            }}>
              Press Enter to send · Shift+Enter for new line · Max 8 turns per session
            </div>
          </div>
        </div>

        {/* ── Recommendations side panel ───────────────────────────────────── */}
        {showRecsPanel && allRecs.length > 0 && (
          <div
            style={{
              width: 340,
              flexShrink: 0,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(5,3,12,0.6)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  Recommended Assessments
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {allRecs.length} from SHL catalog
                </div>
              </div>
              <button
                onClick={() => setShowRecsPanel(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  padding: 4, borderRadius: 6,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              className="chat-scroll"
              style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}
            >
              {allRecs.map((rec, i) => (
                <a
                  key={i}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rec-card"
                  style={{
                    display: 'block',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    marginBottom: 8,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: `${typeColor(rec.test_type)}20`,
                      color: typeColor(rec.test_type),
                      border: `1px solid ${typeColor(rec.test_type)}35`,
                    }}>
                      {typeLabel(rec.test_type)}
                    </span>
                    <ExternalLink size={11} color="rgba(255,255,255,0.25)" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.4 }}>
                    {rec.name}
                  </div>
                </a>
              ))}
            </div>

            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => {
                  const csv = allRecs.map(r => `"${r.name}","${r.url}","${r.test_type}"`).join('\n')
                  const blob = new Blob([`Name,URL,Type\n${csv}`], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'shl-recommendations.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{
                  width: '100%',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  padding: '9px 14px',
                  color: '#a78bfa',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "'Geist Sans', sans-serif",
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.18)'
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                }}
              >
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
