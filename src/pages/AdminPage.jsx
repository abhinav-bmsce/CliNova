import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = () => {
    const token = localStorage.getItem('clinova_token') || '';
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => setUsers(d.users || []))
      .catch((e) => console.warn(e));

    fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => {
        setAuditLogs(d.audit_logs || []);
        setLoading(false);
      })
      .catch((e) => {
        console.warn(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (userId, currentActive) => {
    const token = localStorage.getItem('clinova_token') || '';
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    const token = localStorage.getItem('clinova_token') || '';
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_id: newRoleId }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#456B56]" />
            <span>Administration & Clinical Access Governance</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Role-Based Access Control (RBAC), user activation, and immutable HIPAA security audit logging.
          </p>
        </div>

        <span className="text-xs bg-[#DFEAE0] text-[#456B56] px-3 py-1.5 rounded-xl font-bold border border-[#CDDED0]">
          Admin Enforcement Active
        </span>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B]">Registered Clinical Investigators & Roles</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">System Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5EF]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F7F9F6] transition-colors">
                  <td className="py-3 font-semibold text-[#35463B]">{u.full_name}</td>
                  <td className="py-3 font-mono text-[11px] text-[#758278]">{u.email}</td>
                  <td className="py-3 text-[#758278]">{u.department}</td>
                  <td className="py-3">
                    <select
                      value={u.role_id}
                      onChange={(e) => handleRoleChange(u.id, parseInt(e.target.value, 10))}
                      className="px-2 py-1 rounded-lg bg-[#F7F9F6] border border-[#E4EAE3] text-xs font-semibold text-[#456B56]"
                    >
                      <option value={1}>Administrator</option>
                      <option value={2}>Researcher</option>
                      <option value={3}>Viewer</option>
                    </select>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active
                          ? 'bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0]'
                          : 'bg-[#F3E5DC] text-[#8C533D] border border-[#EBD1C3]'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      className="px-3 py-1 rounded-lg border border-[#E4EAE3] text-[11px] font-semibold text-[#35463B] hover:bg-[#F0F5EF]"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B]">Security & KDD Operation Audit Trail</h3>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#F0F5EF]">
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Resource</th>
                <th className="p-2.5">User</th>
                <th className="p-2.5">Details</th>
                <th className="p-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5EF]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F7F9F6]">
                  <td className="p-2.5 font-mono font-bold text-[#456B56]">{log.action}</td>
                  <td className="p-2.5 text-[#35463B]">{log.resource_type}</td>
                  <td className="p-2.5 text-[#758278]">{log.user_full_name || 'System'}</td>
                  <td className="p-2.5 text-[#758278] max-w-xs truncate">{log.details}</td>
                  <td className="p-2.5 text-right text-[#758278] font-mono text-[10px]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

