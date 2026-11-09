import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Users,
  Database,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage({ onSelectProject }) {
  const { currentUser, isViewer } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');

  const fetchProjects = () => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load projects:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clinova_token') || ''}`,
        },
        body: JSON.stringify({
          name,
          description,
          target_objective: target,
        }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        setTarget('');
        setShowModal(false);
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive this clinical project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clinova_token') || ''}`,
        },
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#456B56]" />
            <span>Clinical Research Projects</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Manage multi-user KDD workspaces, associate datasets, and track algorithmic runs.
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card hover:shadow-clinova-hover transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-bold text-[#35463B]">{p.name}</span>
                <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] font-semibold px-2 py-0.5 rounded-full shrink-0 border border-[#CDDED0]">
                  Active KDD
                </span>
              </div>

              <p className="text-xs text-[#758278] line-clamp-2 leading-relaxed">
                {p.description || 'Clinical knowledge discovery project examining patient cohorts.'}
              </p>

              {p.target_objective && (
                <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3] text-[11px] text-[#456B56]">
                  <strong className="font-semibold">Objective:</strong> {p.target_objective}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[#F0F5EF] flex items-center justify-between text-xs text-[#758278]">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#456B56]" />
                  <span>{p.member_count || 1} Members</span>
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-[#456B56]" />
                  <span>{p.dataset_count || 1} Datasets</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isViewer && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-[#758278] hover:text-[#8C533D] hover:bg-[#F3E5DC]/50 transition-colors"
                    title="Archive Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#35463B]/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#35463B]">Create Clinical KDD Project</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#35463B] font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ICU Sepsis Biomarker Phenotyping"
                  className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:outline-none focus:ring-1 focus:ring-[#779985]"
                />
              </div>
              <div>
                <label className="block text-[#35463B] font-semibold mb-1">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clinical cohort scope, diagnostic criteria, inclusion/exclusion rules..."
                  className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:outline-none focus:ring-1 focus:ring-[#779985]"
                ></textarea>
              </div>
              <div>
                <label className="block text-[#35463B] font-semibold mb-1">Target Analytical Objective</label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Discover high-lift medication rules predicting early return"
                  className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:outline-none focus:ring-1 focus:ring-[#779985]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-[#758278] hover:bg-[#F0F5EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
