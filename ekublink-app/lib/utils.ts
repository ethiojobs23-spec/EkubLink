import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Frequency, TransactionStatus, RoundStatus, GroupStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('am-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function frequencyLabel(freq: Frequency): string {
  const map: Record<Frequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
  }
  return map[freq]
}

export function transactionStatusLabel(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    pending_verification: 'Pending Verification',
    verified_paid: 'Verified Paid',
    rejected: 'Rejected',
  }
  return map[status]
}

export function roundStatusLabel(status: RoundStatus): string {
  const map: Record<RoundStatus, string> = {
    contribution_window: 'Contribution Window',
    draw_ready: 'Ready to Draw',
    drawing: 'Drawing...',
    payout_pending: 'Payout Pending',
    completed: 'Completed',
  }
  return map[status]
}

export function groupStatusLabel(status: GroupStatus): string {
  const map: Record<GroupStatus, string> = {
    forming: 'Forming',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status]
}

export function generateInviteLink(inviteCode: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://ekublink.app'
  return `${base}/groups/join?code=${inviteCode}`
}

export function validateCBEReference(ref: string): boolean {
  // CBE transaction references start with FT and are typically 12-14 chars
  return /^FT[A-Z0-9]{8,12}$/i.test(ref.trim())
}
