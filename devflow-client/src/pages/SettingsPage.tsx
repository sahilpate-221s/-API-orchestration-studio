import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes drift-a {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  50% { transform: translate(4%, -3%) scale(1.05); }
}
@keyframes drift-b {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  50% { transform: translate(-4%, 3%) scale(1.05); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes spin { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  .set-bg-orb--a, .set-bg-orb--b { animation: none; }
}

.set-shell {
  min-height: 100vh;
  background: #0B0C0E;
  color: #F2F3F5;
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.set-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.set-bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 85%);
  opacity: 0.6;
}

.set-bg-orb--a {
  position: absolute;
  width: min(50vw, 640px);
  height: min(50vw, 640px);
  top: -18%;
  left: -8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(62,207,142,0.08) 0%, transparent 70%);
  filter: blur(60px);
  animation: drift-a 30s ease-in-out infinite;
}

.set-bg-orb--b {
  position: absolute;
  width: min(42vw, 560px);
  height: min(42vw, 560px);
  bottom: -14%;
  right: -10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,124,246,0.06) 0%, transparent 70%);
  filter: blur(60px);
  animation: drift-b 34s ease-in-out infinite;
}

/* ── Topbar ── */
.set-topbar-wrap {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 16px 16px 0;
}

.set-topbar {
  width: 100%;
  max-width: 1320px;
  height: 60px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(11,12,14,0.72);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 16px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.45);
}

.set-topbar-inner {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 12px 16px;
}

.set-topbar-links {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  min-width: 0;
}

.set-nav-link {
  color: #93959D;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  white-space: nowrap;
  transition: color 0.16s ease, background 0.16s ease;
}

.set-nav-link:hover {
  color: #F2F3F5;
  background: rgba(255,255,255,0.06);
}

.set-nav-link.active {
  color: #3ECF8E;
  background: rgba(62,207,142,0.08);
}

.set-brand {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #131417;
  border: 1px solid rgba(255,255,255,0.1);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
}

.set-brand::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(62,207,142,0.25) 0%, transparent 65%);
}

.set-btn {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #C9CBD1;
  border-radius: 999px;
  padding: 9px 15px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.set-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  color: #ffffff;
}

/* ── Page content ── */
.set-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  animation: fadeUp 0.4s ease;
  position: relative;
  z-index: 5;
}

@media (min-width: 768px) {
  .set-page {
    padding: 56px 36px 80px;
  }
}

.set-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #3ECF8E;
  margin-bottom: 10px;
}

.set-eyebrow-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #3ECF8E;
  animation: pulse-dot 2s ease-in-out infinite;
}

.set-title {
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 36px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: #F2F3F5;
}

.set-subtitle {
  font-size: 15px;
  color: #6B6D75;
  line-height: 1.5;
  margin: 0 0 40px;
}

/* ── Cards ── */
.set-card {
  background: rgba(19,20,23,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
  transition: border-color 0.2s ease;
}

.set-card:hover {
  border-color: rgba(255,255,255,0.12);
}

.set-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #F2F3F5;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-card-desc {
  font-size: 13px;
  color: #6B6D75;
  margin: 0 0 24px;
  line-height: 1.5;
}

/* ── Avatar ── */
.set-avatar-area {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.set-avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  flex: 0 0 auto;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(62,207,142,0.3);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.set-avatar-container:hover {
  border-color: rgba(62,207,142,0.6);
  box-shadow: 0 0 0 4px rgba(62,207,142,0.1), 0 8px 24px -8px rgba(62,207,142,0.3);
}

.set-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.set-avatar-fallback {
  width: 100%;
  height: 100%;
  background: rgba(62,207,142,0.14);
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 700;
  color: #3ECF8E;
  font-family: 'JetBrains Mono', monospace;
}

.set-avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 50%;
}

.set-avatar-container:hover .set-avatar-overlay {
  opacity: 1;
}

.set-avatar-info h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #F2F3F5;
}

.set-avatar-info p {
  margin: 0;
  font-size: 12px;
  color: #6B6D75;
  line-height: 1.4;
}

/* ── Form elements ── */
.set-field {
  margin-bottom: 20px;
}

.set-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #93959D;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.set-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #F2F3F5;
  font-size: 14px;
  font-family: 'Inter', system-ui, sans-serif;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-sizing: border-box;
}

.set-input:focus {
  border-color: rgba(62,207,142,0.5);
  box-shadow: 0 0 0 3px rgba(62,207,142,0.1);
  background: rgba(255,255,255,0.06);
}

.set-input::placeholder {
  color: #4A4C54;
}

.set-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.set-btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: 'Inter', system-ui, sans-serif;
  background: #3ECF8E;
  color: #06110C;
  box-shadow: 0 0 0 1px rgba(62,207,142,0.3), 0 4px 14px -4px rgba(62,207,142,0.4);
}

.set-btn-save:hover:not(:disabled) {
  background: #5BDA9F;
  box-shadow: 0 0 0 1px rgba(62,207,142,0.4), 0 8px 22px -6px rgba(62,207,142,0.5);
  transform: translateY(-1px);
}

.set-btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.set-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #C9CBD1;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: 'Inter', system-ui, sans-serif;
}

.set-btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  color: #ffffff;
}

/* ── Password fields row ── */
.set-password-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .set-password-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Danger zone ── */
.set-danger-card {
  background: rgba(19,20,23,0.8);
  border: 1px solid rgba(226,75,74,0.2);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
  transition: border-color 0.2s ease;
}

.set-danger-card:hover {
  border-color: rgba(226,75,74,0.35);
}

.set-danger-title {
  font-size: 16px;
  font-weight: 700;
  color: #F09595;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  gap: 16px;
}

.set-danger-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.set-danger-info h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #F2F3F5;
}

.set-danger-info p {
  margin: 0;
  font-size: 12.5px;
  color: #6B6D75;
  line-height: 1.4;
}

.set-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(226,75,74,0.35);
  background: transparent;
  color: #F09595;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: 'Inter', system-ui, sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}

.set-btn-danger:hover:not(:disabled) {
  background: rgba(226,75,74,0.1);
  border-color: rgba(226,75,74,0.5);
  color: #F7C1C1;
}

.set-btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.set-btn-delete {
  border-color: rgba(226,75,74,0.5);
  background: rgba(226,75,74,0.08);
  color: #E24B4A;
}

.set-btn-delete:hover:not(:disabled) {
  background: rgba(226,75,74,0.18);
  border-color: rgba(226,75,74,0.7);
  color: #F7C1C1;
  box-shadow: 0 4px 14px -4px rgba(226,75,74,0.3);
}

/* ── Toast / Status messages ── */
.set-toast {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  animation: fadeUp 0.25s ease;
}

.set-toast-success {
  color: #3ECF8E;
  background: rgba(62,207,142,0.08);
  border: 1px solid rgba(62,207,142,0.15);
}

.set-toast-error {
  color: #E24B4A;
  background: rgba(226,75,74,0.08);
  border: 1px solid rgba(226,75,74,0.15);
}

/* ── Modal ── */
.set-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeUp 0.2s ease;
}

.set-modal {
  background: #131417;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.7);
  position: relative;
}

.set-modal h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #F2F3F5;
}

.set-modal p {
  font-size: 13.5px;
  color: #6B6D75;
  margin: 0 0 24px;
  line-height: 1.5;
}

.set-modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
}

.set-modal-icon.danger {
  background: rgba(226,75,74,0.12);
  border: 1px solid rgba(226,75,74,0.2);
}

.set-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* ── Spinner ── */
.set-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

/* ── Muted text ── */
.set-muted { color: #6B6D75; }

/* ── User pill in topbar ── */
.set-user {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 4px 6px 4px 4px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
}

.set-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(62,207,142,0.14);
  border: 1px solid rgba(62,207,142,0.3);
  color: #3ECF8E;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  flex: 0 0 auto;
  overflow: hidden;
}

.set-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Divider ── */
.set-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%);
  margin: 8px 0 24px;
}

/* ── Back link ── */
.set-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #93959D;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 24px;
  transition: all 0.16s ease;
}

.set-back-link:hover {
  color: #F2F3F5;
  background: rgba(255,255,255,0.06);
}

.set-back-link svg {
  transition: transform 0.16s ease;
}

.set-back-link:hover svg {
  transform: translateX(-2px);
}
`

// ── SVG Icons ──
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function AlertTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function SettingsPage() {
  const { user, clearAuth, updateUser, setAuth } = useAuthStore()

  // ── Profile state ──
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Modal state ──
  const [modal, setModal] = useState<'disable' | 'delete' | null>(null)
  const [modalPassword, setModalPassword] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Sync if user changes externally
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setAvatarPreview(user.avatarUrl || '')
    }
  }, [user])

  // Clear messages after 4 seconds
  useEffect(() => {
    if (profileMsg) {
      const t = setTimeout(() => setProfileMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [profileMsg])

  useEffect(() => {
    if (passwordMsg) {
      const t = setTimeout(() => setPasswordMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [passwordMsg])

  // ── Avatar upload ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 500 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be under 500KB' })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setAvatarPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty' })
      return
    }

    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const payload: Record<string, string> = {}
      if (name.trim() !== user?.name) payload.name = name.trim()
      if (email.trim().toLowerCase() !== user?.email) payload.email = email.trim()
      if (avatarPreview !== (user?.avatarUrl || '')) payload.avatarUrl = avatarPreview

      if (Object.keys(payload).length === 0) {
        setProfileMsg({ type: 'success', text: 'No changes to save' })
        setProfileSaving(false)
        return
      }

      const res = await api.put('/user/profile', payload)
      const updatedUser = res.data.user

      // If a new token was returned (email change), update auth
      if (res.data.token) {
        setAuth(
          { ...updatedUser, id: updatedUser.id ?? updatedUser._id, _id: updatedUser._id ?? updatedUser.id },
          res.data.token
        )
      } else {
        updateUser({
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl,
        })
      }

      setProfileMsg({ type: 'success', text: 'Profile updated successfully' })
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile'
      setProfileMsg({ type: 'error', text: msg })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Fill in all password fields' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      await api.put('/user/password', { currentPassword, newPassword })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password'
      setPasswordMsg({ type: 'error', text: msg })
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Disable account ──
  const handleDisableAccount = async () => {
    if (!modalPassword) {
      setModalError('Password is required')
      return
    }
    setModalLoading(true)
    setModalError('')
    try {
      await api.put('/user/disable', { password: modalPassword })
      setModal(null)
      clearAuth()
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to disable account')
    } finally {
      setModalLoading(false)
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (!modalPassword) {
      setModalError('Password is required')
      return
    }
    setModalLoading(true)
    setModalError('')
    try {
      await api.delete('/user/account', { data: { password: modalPassword } })
      setModal(null)
      clearAuth()
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to delete account')
    } finally {
      setModalLoading(false)
    }
  }

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className="set-shell">
      <style>{CSS}</style>

      <div className="set-bg-layer" aria-hidden="true">
        <div className="set-bg-dots" />
        <div className="set-bg-orb--a" />
        <div className="set-bg-orb--b" />
      </div>

      {/* ── Topbar ── */}
      <div className="set-topbar-wrap">
        <nav className="set-topbar">
          <div className="set-topbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="set-brand" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'relative' }}>
                  <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="15" r="1.8" fill="#3ECF8E" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: '#F2F3F5', fontFamily: "'Inter Tight', 'Inter', sans-serif" }}>DevFlow</div>
                <div className="set-muted" style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>settings</div>
              </div>
            </div>

            <div className="set-topbar-links" role="navigation" aria-label="Site pages">
              <Link className="set-nav-link" to="/">Home</Link>
              <Link className="set-nav-link" to="/dashboard">Dashboard</Link>
              <Link className="set-nav-link" to="/about">About</Link>
              <Link className="set-nav-link" to="/contact">Contact</Link>
              <Link className="set-nav-link active" to="/settings">Settings</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <div className="set-user">
                <div className="set-user-avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{firstName}</div>
                  <div className="set-muted" style={{ fontSize: 10.5, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              <button className="set-btn" onClick={clearAuth}>Sign out</button>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Main Content ── */}
      <main className="set-page">
        <Link to="/dashboard" className="set-back-link">
          <ArrowLeftIcon />
          Back to Dashboard
        </Link>

        <span className="set-eyebrow">
          <span className="set-eyebrow-dot" />
          Account Settings
        </span>
        <h1 className="set-title">Profile & Settings</h1>
        <p className="set-subtitle">
          Manage your personal information, security preferences, and account settings.
        </p>

        {/* ═══════════════════════════════════ PROFILE CARD ═══════════════════════════════════ */}
        <div className="set-card">
          <div className="set-card-title">
            <UserIcon />
            Profile Information
          </div>
          <div className="set-card-desc">Update your display name, email address, and profile picture.</div>

          {/* Avatar upload */}
          <div className="set-avatar-area">
            <div className="set-avatar-container" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img className="set-avatar-img" src={avatarPreview} alt="Profile" />
              ) : (
                <div className="set-avatar-fallback">{initials}</div>
              )}
              <div className="set-avatar-overlay">
                <CameraIcon />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <div className="set-avatar-info">
              <h4>Profile Photo</h4>
              <p>Click the avatar to upload a new image.<br />Max size: 500KB. Recommended: 200×200px.</p>
              {avatarPreview && (
                <button
                  style={{ marginTop: 8, fontSize: 12, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                  onClick={() => setAvatarPreview('')}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="set-divider" />

          {/* Name field */}
          <div className="set-field">
            <label className="set-label">Display Name</label>
            <input
              className="set-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email field */}
          <div className="set-field">
            <label className="set-label">Email Address</label>
            <input
              className="set-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="set-actions">
            <button
              className="set-btn-save"
              onClick={handleSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? (
                <><span className="set-spinner" /> Saving...</>
              ) : (
                <><CheckIcon /> Save Changes</>
              )}
            </button>
            {profileMsg && (
              <span className={`set-toast ${profileMsg.type === 'success' ? 'set-toast-success' : 'set-toast-error'}`}>
                {profileMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════ SECURITY CARD ═══════════════════════════════════ */}
        <div className="set-card">
          <div className="set-card-title">
            <LockIcon />
            Security
          </div>
          <div className="set-card-desc">Change your password to keep your account secure.</div>

          <div className="set-field">
            <label className="set-label">Current Password</label>
            <input
              className="set-input"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div className="set-password-grid">
            <div className="set-field">
              <label className="set-label">New Password</label>
              <input
                className="set-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="set-field">
              <label className="set-label">Confirm Password</label>
              <input
                className="set-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="set-actions">
            <button
              className="set-btn-save"
              onClick={handleChangePassword}
              disabled={passwordSaving || !currentPassword || !newPassword}
            >
              {passwordSaving ? (
                <><span className="set-spinner" /> Updating...</>
              ) : (
                <><ShieldIcon /> Update Password</>
              )}
            </button>
            {passwordMsg && (
              <span className={`set-toast ${passwordMsg.type === 'success' ? 'set-toast-success' : 'set-toast-error'}`}>
                {passwordMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════ DANGER ZONE ═══════════════════════════════════ */}
        <div className="set-danger-card">
          <div className="set-danger-title">
            <AlertTriangleIcon />
            Danger Zone
          </div>
          <div className="set-card-desc" style={{ color: '#7A4040' }}>
            These actions are irreversible. Please proceed with caution.
          </div>

          <div className="set-danger-item">
            <div className="set-danger-info">
              <h4>Disable Account</h4>
              <p>Your account will be deactivated and you won't be able to log in. Your data will be preserved.</p>
            </div>
            <button className="set-btn-danger" onClick={() => { setModal('disable'); setModalPassword(''); setModalError('') }}>
              <BanIcon />
              Disable
            </button>
          </div>

          <div className="set-danger-item">
            <div className="set-danger-info">
              <h4>Delete Account</h4>
              <p>Permanently delete your account, workflows, workspaces, and all associated data. This cannot be undone.</p>
            </div>
            <button className="set-btn-danger set-btn-delete" onClick={() => { setModal('delete'); setModalPassword(''); setModalError('') }}>
              <TrashIcon />
              Delete
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* ═══════════════════════════════════ CONFIRMATION MODAL ═══════════════════════════════════ */}
      {modal && (
        <div className="set-modal-backdrop" onClick={() => !modalLoading && setModal(null)}>
          <div className="set-modal" onClick={e => e.stopPropagation()}>
            <div className={`set-modal-icon danger`}>
              {modal === 'disable' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.9 4.9 14.2 14.2" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </div>

            <h3>{modal === 'disable' ? 'Disable Your Account?' : 'Delete Your Account?'}</h3>
            <p>
              {modal === 'disable'
                ? 'Your account will be deactivated immediately. You will be logged out and unable to sign in until support re-enables your account. Your data will be preserved.'
                : 'This will permanently delete your account and all associated data including workflows, workspaces, templates, and execution history. This action cannot be undone.'
              }
            </p>

            <div className="set-field" style={{ marginBottom: 0 }}>
              <label className="set-label">Confirm Your Password</label>
              <input
                className="set-input"
                type="password"
                value={modalPassword}
                onChange={e => setModalPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                autoComplete="current-password"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    modal === 'disable' ? handleDisableAccount() : handleDeleteAccount()
                  }
                }}
              />
            </div>

            {modalError && (
              <div className="set-toast set-toast-error" style={{ marginTop: 12, display: 'flex' }}>
                {modalError}
              </div>
            )}

            <div className="set-modal-actions">
              <button className="set-btn-secondary" onClick={() => setModal(null)} disabled={modalLoading}>
                Cancel
              </button>
              <button
                className={modal === 'delete' ? 'set-btn-danger set-btn-delete' : 'set-btn-danger'}
                onClick={modal === 'disable' ? handleDisableAccount : handleDeleteAccount}
                disabled={modalLoading || !modalPassword}
              >
                {modalLoading ? (
                  <><span className="set-spinner" /> Processing...</>
                ) : modal === 'disable' ? (
                  <><BanIcon /> Disable Account</>
                ) : (
                  <><TrashIcon /> Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
