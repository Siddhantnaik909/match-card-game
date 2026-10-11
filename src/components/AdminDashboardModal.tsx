/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Users, Radio, Ban, CheckCircle, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { PublicUserProfile } from '../types/auth';
import { sound } from '../services/sound';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [tab, setTab] = useState<'overview' | 'users' | 'rooms' | 'logs'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setActionError(null);
    try {
      const [resOverview, resUsers, resLogs] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resOverview.ok) {
        const d = await resOverview.json();
        setStats(d.stats);
        setActiveRooms(d.activeRooms || []);
      }
      if (resUsers.ok) {
        const d = await resUsers.json();
        setUsers(d.users || []);
      }
      if (resLogs.ok) {
        const d = await resLogs.json();
        setLogs(d.logs || []);
      }
    } catch {
      setActionError('Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleToggleBan = async (targetUserId: string, currentBanned: boolean) => {
    if (!token) return;
    sound.playButtonClick();
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId, isBanned: !currentBanned }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const d = await res.json();
        setActionError(d.error || 'Failed to update ban status.');
      }
    } catch {
      setActionError('Connection error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-b from-[#111827] via-[#0b101b] to-[#070912] border border-rose-500/30 p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Platform Admin Command Center
              </h2>
              <p className="text-xs text-slate-400">Server oversight, user moderation &amp; live room monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 my-4 border-b border-slate-800/80 pb-2">
          {(['overview', 'users', 'rooms', 'logs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
                tab === t
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {actionError}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase">Registered Users</div>
                  <div className="text-2xl font-black text-white mt-1">{stats?.totalRegisteredUsers ?? 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase">Active Sessions</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{stats?.activeSessions ?? 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase">Completed Matches</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{stats?.totalMatchesCompleted ?? 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase">Live Rooms</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{activeRooms.length}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  System Health &amp; Security Leases
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Websocket connections are monitored by 20-second heartbeat leases. Passwords are hash-protected with Node crypto scrypt. All privileged administration calls require verified server session tokens.
                </p>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-bold mb-2">
                Registered Platform Users ({users.length})
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{u.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{u.displayName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.publicPlayerId} · Rating: {u.stats.rating} · {u.stats.wins}W/{u.stats.losses}L
                      </div>
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleBan(u.id, (u as any).isBanned || false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                        (u as any).isBanned
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                      }`}
                    >
                      {(u as any).isBanned ? 'Unban User' : 'Suspend / Ban'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'rooms' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-bold mb-2">
                Live Active Game Rooms ({activeRooms.length})
              </div>
              {activeRooms.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No rooms currently active.</div>
              ) : (
                activeRooms.map((r) => (
                  <div
                    key={r.roomCode}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">{r.roomCode}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                          {r.gameMode}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Players: {r.playerCount} / {r.maxPlayers} · Locked: {r.isLocked ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-bold mb-2">
                Administrative Audit Trail ({logs.length})
              </div>
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No admin actions logged yet.</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-rose-400">{log.action}</span>
                      <span className="text-slate-400"> on target: </span>
                      <span className="text-white font-mono">{log.target || 'N/A'}</span>
                      <div className="text-[10px] text-slate-500">By admin: {log.adminName}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
