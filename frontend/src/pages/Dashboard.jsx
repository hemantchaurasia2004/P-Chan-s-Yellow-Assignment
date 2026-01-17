import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { projectAPI } from '../services/api'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', system_prompt: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.list()
      setProjects(response.data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const response = await projectAPI.create({
        name: newProject.name,
        description: newProject.description || null,
        system_prompt: newProject.system_prompt || 'You are a helpful AI assistant.'
      })
      setProjects([response.data, ...projects])
      setShowModal(false)
      setNewProject({ name: '', description: '', system_prompt: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (projectId, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? All associated data will be lost.')) {
      return
    }

    try {
      await projectAPI.delete(projectId)
      setProjects(projects.filter(p => p._id !== projectId))
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-700/50 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="font-display font-semibold text-white">Chatbot Platform</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-dark-300 text-sm hidden sm:block">
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="text-dark-400 hover:text-white transition-colors text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-semibold text-white">Your Projects</h1>
            <p className="text-dark-400 mt-1">Build and manage your AI agents</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading-dots flex gap-2">
              <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
              <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
              <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-dark-400 mb-6">Create your first AI agent project to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Link
                key={project._id}
                to={`/project/${project._id}`}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 group stagger-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center group-hover:from-primary-500/30 group-hover:to-primary-600/30 transition-colors">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(project._id, e)}
                    className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-dark-400 text-sm line-clamp-2 mb-4">
                  {project.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
                  <span className="text-xs text-dark-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Open
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="glass-card w-full max-w-lg relative animate-slide-up">
            <div className="p-6 border-b border-dark-700/50">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <p className="text-dark-400 text-sm mt-1">Set up a new AI agent for your use case</p>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input-field"
                  placeholder="Customer Support Bot"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="A brief description of what this agent does..."
                />
              </div>

              <div>
                <label htmlFor="system_prompt" className="block text-sm font-medium text-dark-200 mb-2">
                  System Prompt
                </label>
                <textarea
                  id="system_prompt"
                  value={newProject.system_prompt}
                  onChange={(e) => setNewProject({ ...newProject, system_prompt: e.target.value })}
                  className="input-field resize-none font-mono text-sm"
                  rows={4}
                  placeholder="You are a helpful AI assistant..."
                />
                <p className="mt-1 text-xs text-dark-500">
                  Define the behavior and personality of your AI agent
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
