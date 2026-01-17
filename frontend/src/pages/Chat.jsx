import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { projectAPI, chatAPI } from '../services/api'

export default function Chat() {
  const { projectId, sessionId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const [project, setProject] = useState(null)
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [projectId])

  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId)
      fetchSession(sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchInitialData = async () => {
    try {
      const [projectRes, sessionsRes] = await Promise.all([
        projectAPI.get(projectId),
        chatAPI.listSessions(projectId)
      ])
      
      setProject(projectRes.data)
      setSessions(sessionsRes.data)
      
      if (sessionId) {
        await fetchSession(sessionId)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchSession = async (sid) => {
    try {
      const response = await chatAPI.getSession(projectId, sid)
      setMessages(response.data.messages || [])
    } catch (err) {
      console.error('Failed to fetch session:', err)
      setMessages([])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || sending) return

    const message = inputValue.trim()
    setInputValue('')
    setSending(true)

    // Optimistically add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await chatAPI.sendMessage(projectId, message, currentSessionId)
      
      // Update session ID if this is a new session
      if (!currentSessionId) {
        setCurrentSessionId(response.data.session_id)
        navigate(`/project/${projectId}/chat/${response.data.session_id}`, { replace: true })
        
        // Refresh sessions list
        const sessionsRes = await chatAPI.listSessions(projectId)
        setSessions(sessionsRes.data)
      }
      
      // Add assistant message
      setMessages(prev => [...prev, response.data.message])
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the optimistic message on error
      setMessages(prev => prev.slice(0, -1))
      alert(err.response?.data?.detail || 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleNewChat = async () => {
    setCurrentSessionId(null)
    setMessages([])
    navigate(`/project/${projectId}/chat`, { replace: true })
    inputRef.current?.focus()
  }

  const handleSelectSession = (sid) => {
    if (sid === currentSessionId) return
    setCurrentSessionId(sid)
    navigate(`/project/${projectId}/chat/${sid}`)
    fetchSession(sid)
  }

  const handleDeleteSession = async (sid, e) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    
    try {
      await chatAPI.deleteSession(projectId, sid)
      setSessions(sessions.filter(s => s._id !== sid))
      
      if (sid === currentSessionId) {
        handleNewChat()
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots flex gap-2">
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className={`${showSidebar ? 'w-72' : 'w-0'} bg-dark-900/80 border-r border-dark-700/50 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-dark-700/50">
          <button
            onClick={handleNewChat}
            className="w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-4">No conversations yet</p>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => handleSelectSession(session._id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    session._id === currentSessionId
                      ? 'bg-dark-700/50 text-white'
                      : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-2 flex-1">
                      {session.last_message || 'New conversation'}
                    </p>
                    <button
                      onClick={(e) => handleDeleteSession(session._id, e)}
                      className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-red-400 transition-all p-1 -mr-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-dark-500 mt-1">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back to Project */}
        <div className="p-4 border-t border-dark-700/50">
          <Link
            to={`/project/${projectId}`}
            className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Project Settings
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="h-16 border-b border-dark-700/50 bg-dark-900/50 backdrop-blur-xl flex items-center px-4 gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-white truncate">{project?.name}</h1>
          </div>

          <Link
            to="/dashboard"
            className="text-dark-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-semibold text-white mb-2">Start a conversation</h2>
              <p className="text-dark-400 max-w-md">
                Send a message to chat with your AI agent. The agent will respond based on the system prompt and any custom prompts you've configured.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] ${
                    message.role === 'user' ? 'order-2' : 'order-1'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                        <span className="text-xs text-dark-400">AI Assistant</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'message-user rounded-br-md'
                        : 'message-assistant rounded-bl-md'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                    </div>
                    <p className={`text-xs text-dark-500 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="message-assistant px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="loading-dots flex gap-1">
                      <span className="w-2 h-2 bg-dark-400 rounded-full"></span>
                      <span className="w-2 h-2 bg-dark-400 rounded-full"></span>
                      <span className="w-2 h-2 bg-dark-400 rounded-full"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-dark-700/50 bg-dark-900/50 backdrop-blur-xl p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 input-field"
                disabled={sending}
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || sending}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-2 text-center">
              Press Enter to send • Powered by OpenAI
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
