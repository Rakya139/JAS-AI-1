
import { useEffect, useState } from 'react'
import {
  Sparkles, MessageSquare, Code2, Image, Video,
  Mic, Search, Settings, Plus, Send, Menu,
  BrainCircuit, Globe, Paperclip, Loader2
} from 'lucide-react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const features = [
  { icon: BrainCircuit, name: 'AI Assistant', desc: 'Think, learn and solve complex problems' },
  { icon: Code2, name: 'Coding Studio', desc: 'Build and debug software with AI' },
  { icon: Image, name: 'Image Studio', desc: 'Create images from your imagination' },
  { icon: Video, name: 'Video Studio', desc: 'Explore AI-powered video creation' },
  { icon: Globe, name: 'Deep Research', desc: 'Explore topics and discover insights' },
  { icon: Mic, name: 'Voice Studio', desc: 'Interact with your AI using voice' }
]

export default function App() {
  const [message, setMessage] = useState('')
  const [active, setActive] = useState('AI Assistant')
  const [sidebar, setSidebar] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
  try {
    const saved = localStorage.getItem('jas-ai-chat')
    return saved ? JSON.parse(saved) as ChatMessage[] : []
  } catch {
    return []
  }
})
  useEffect(() => {
  localStorage.setItem('jas-ai-chat', JSON.stringify(messages))
}, [messages])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage() {
    const text = message.trim()
    if (!text || loading) return

    const updated: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text }
    ]

    setMessages(updated)
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setMessages([
        ...updated,
        { role: 'assistant', content: data.reply }
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to JAS AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <aside className={sidebar ? 'sidebar' : 'sidebar hidden'}>
        <div className="brand">
          <div className="brand-icon"><Sparkles /></div>
          <div><strong>JAS AI</strong><small>ENTERPRISE</small></div>
        </div>

        <button className="new-chat" onClick={() => {
          setMessages([])
          setMessage('')
          setError('')
        }}>
          <Plus size={18} /> New conversation
        </button>

        <p className="section-label">WORKSPACE</p>
        {features.map(({ icon: Icon, name }) => (
          <button
            key={name}
            className={`nav-item ${active === name ? 'selected' : ''}`}
            onClick={() => setActive(name)}
          >
            <Icon size={18} /> {name}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button className="nav-item"><Settings size={18} /> Settings</button>
          <div className="profile">
            <div className="avatar">J</div>
            <div><strong>JAS User</strong><small>Personal workspace</small></div>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button" onClick={() => setSidebar(!sidebar)}>
            <Menu size={20} />
          </button>
          <span className="top-title">{active}</span>
          <div className="status"><span /> AI WORKSPACE</div>
        </header>

        <div className="content">
          {messages.length === 0 ? (
            <>
              <div className="welcome">
                <div className="welcome-icon"><Sparkles size={25} /></div>
                <p className="eyebrow">YOUR INTELLIGENT WORKSPACE</p>
                <h1>Imagine what's<br /><span>possible.</span></h1>
                <p className="subtitle">
                  Meet JAS AI. One workspace for thinking, creating,
                  researching and building extraordinary things.
                </p>
              </div>

              <div className="feature-grid">
                {features.map(({ icon: Icon, name, desc }) => (
                  <button className="feature-card" key={name} onClick={() => setActive(name)}>
                    <div className="feature-icon"><Icon size={21} /></div>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="chat-messages">
              {messages.map((item, index) => (
                <div className={`chat-message ${item.role}`} key={index}>
                  <strong>{item.role === 'user' ? 'You' : 'JAS AI'}</strong>
                  <p>{item.content}</p>
                </div>
              ))}
              {loading && (
                <div className="chat-message assistant">
                  <strong>JAS AI</strong>
                  <p><Loader2 size={16} className="spinner" /> Thinking...</p>
                </div>
              )}
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          <div className="composer">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`Message JAS AI in ${active}...`}
              rows={2}
            />
            <div className="composer-bottom">
              <div>
                <button className="tool-button" aria-label="Attachments"><Paperclip size={17} /></button>
                <span>AI-powered workspace</span>
              </div>
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                aria-label="Send message"
              >
                {loading ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
              </button>
            </div>
          </div>
          <p className="disclaimer">JAS AI can make mistakes. Verify important information.</p>
        </div>
      </section>
    </main>
  )
}
