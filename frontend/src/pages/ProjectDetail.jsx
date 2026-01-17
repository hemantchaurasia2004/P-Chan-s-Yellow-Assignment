import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { projectAPI, promptAPI, fileAPI, chatAPI } from '../services/api'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [project, setProject] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [files, setFiles] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('settings')
  
  // Edit states
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', system_prompt: '' })
  const [saving, setSaving] = useState(false)
  
  // Prompt modal
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' })
  const [creatingPrompt, setCreatingPrompt] = useState(false)
  
  // File upload
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      const [projectRes, promptsRes, filesRes, sessionsRes] = await Promise.all([
        projectAPI.get(projectId),
        promptAPI.list(projectId),
        fileAPI.list(projectId).catch(() => ({ data: [] })),
        chatAPI.listSessions(projectId)
      ])
      
      setProject(projectRes.data)
      setPrompts(promptsRes.data)
      setFiles(filesRes.data)
      setSessions(sessionsRes.data)
      setEditForm({
        name: projectRes.data.name,
        description: projectRes.data.description || '',
        system_prompt: projectRes.data.system_prompt
      })
    } catch (err) {
      console.error('Failed to fetch project:', err)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await projectAPI.update(projectId, editForm)
      setProject(response.data)
      setEditing(false)
    } catch (err) {
      console.error('Failed to update project:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePrompt = async (e) => {
    e.preventDefault()
    setCreatingPrompt(true)
    
    try {
      const response = await promptAPI.create(projectId, newPrompt)
      setPrompts([response.data, ...prompts])
      setShowPromptModal(false)
      setNewPrompt({ name: '', content: '' })
    } catch (err) {
      console.error('Failed to create prompt:', err)
    } finally {
      setCreatingPrompt(false)
    }
  }

  const handleDeletePrompt = async (promptId) => {
    if (!confirm('Delete this prompt?')) return
    
    try {
      await promptAPI.delete(promptId)
      setPrompts(prompts.filter(p => p._id !== promptId))
    } catch (err) {
      console.error('Failed to delete prompt:', err)
    }
  }

  const handleTogglePrompt = async (prompt) => {
    try {
      await promptAPI.update(prompt._id, { is_active: !prompt.is_active })
      setPrompts(prompts.map(p => 
        p._id === prompt._id ? { ...p, is_active: !p.is_active } : p
      ))
    } catch (err) {
      console.error('Failed to toggle prompt:', err)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    try {
      const response = await fileAPI.upload(projectId, file)
      setFiles([response.data, ...files])
    } catch (err) {
      console.error('Failed to upload file:', err)
      alert(err.response?.data?.detail || 'File upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return
    
    try {
      await fileAPI.delete(fileId)
      setFiles(files.filter(f => f._id !== fileId))
    } catch (err) {
      console.error('Failed to delete file:', err)
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-700/50 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-dark-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="font-display font-semibold text-white">{project?.name}</h1>
                <p className="text-dark-400 text-sm">{project?.description || 'No description'}</p>
              </div>
            </div>

            <Link
              to={`/project/${projectId}/chat`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Open Chat
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-dark-700/50 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {['settings', 'prompts', 'files', 'sessions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-primary-400 border-primary-400'
                    : 'text-dark-400 border-transparent hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Project Settings</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdateProject} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">System Prompt</label>
                    <textarea
                      value={editForm.system_prompt}
                      onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                      className="input-field resize-none font-mono text-sm"
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">Name</label>
                    <p className="text-white">{project?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">Description</label>
                    <p className="text-dark-200">{project?.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">System Prompt</label>
                    <pre className="text-dark-200 font-mono text-sm whitespace-pre-wrap bg-dark-800/50 p-4 rounded-lg">
                      {project?.system_prompt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Custom Prompts</h2>
                <p className="text-dark-400 text-sm mt-1">Add context and instructions for your agent</p>
              </div>
              <button onClick={() => setShowPromptModal(true)} className="btn-primary text-sm">
                Add Prompt
              </button>
            </div>

            {prompts.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-dark-400">No prompts yet. Add prompts to customize your agent's behavior.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div key={prompt._id} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePrompt(prompt)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            prompt.is_active ? 'bg-primary-500' : 'bg-dark-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ml-1 ${
                            prompt.is_active ? 'translate-x-4' : ''
                          }`}></div>
                        </button>
                        <h3 className="font-medium text-white">{prompt.name}</h3>
                      </div>
                      <button
                        onClick={() => handleDeletePrompt(prompt._id)}
                        className="text-dark-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-dark-300 text-sm pl-13">{prompt.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Project Files</h2>
                <p className="text-dark-400 text-sm mt-1">Upload files for your agent to reference</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`btn-primary text-sm cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </label>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-dark-400">No files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file._id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{file.filename}</p>
                        <p className="text-dark-500 text-xs">
                          {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Chat Sessions</h2>
                <p className="text-dark-400 text-sm mt-1">View your conversation history</p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-dark-400">No chat sessions yet. Start a conversation!</p>
                <Link to={`/project/${projectId}/chat`} className="btn-primary mt-4 inline-block">
                  Open Chat
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={session._id}
                    to={`/project/${projectId}/chat/${session._id}`}
                    className="glass-card p-4 block hover:border-primary-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">
                          {session.last_message || 'New conversation'}
                        </p>
                        <p className="text-dark-500 text-xs mt-1">
                          {session.message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPromptModal(false)}></div>
          
          <div className="glass-card w-full max-w-lg relative animate-slide-up">
            <div className="p-6 border-b border-dark-700/50">
              <h2 className="text-xl font-semibold text-white">Add Custom Prompt</h2>
            </div>

            <form onSubmit={handleCreatePrompt} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Name</label>
                <input
                  type="text"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Product Info, FAQ"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Content</label>
                <textarea
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                  className="input-field resize-none"
                  rows={6}
                  placeholder="Enter the prompt content..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPromptModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={creatingPrompt} className="btn-primary flex-1">
                  {creatingPrompt ? 'Creating...' : 'Add Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
