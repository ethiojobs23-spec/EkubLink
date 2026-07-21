export type UserRole = 'giver' | 'collector'
export type GroupStatus = 'forming' | 'active' | 'completed' | 'cancelled'
export type DrawMode = 'random' | 'scheduled'
export type RoundStatus = 'contribution_window' | 'draw_ready' | 'drawing' | 'payout_pending' | 'completed'
export type TransactionStatus = 'pending_verification' | 'verified_paid' | 'rejected'
export type Frequency = 'weekly' | 'biweekly' | 'monthly'

export interface Profile {
  id: string
  full_name: string
  phone_number: string | null
  role: UserRole
  cbe_account_number: string | null
  cbe_account_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface EkubGroup {
  id: string
  collector_id: string
  name: string
  description: string | null
  contribution_amount: number
  frequency: Frequency
  max_members: number
  start_date: string
  draw_mode: DrawMode
  invite_code: string
  status: GroupStatus
  cbe_account_number: string
  cbe_account_name: string
  current_round_number: number
  created_at: string
  updated_at: string
  // Joined fields
  collector?: Profile
  group_members?: GroupMember[]
  rounds?: Round[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  slot_number: number | null
  has_won: boolean
  joined_at: string
  // Joined
  profile?: Profile
}

export interface Round {
  id: string
  group_id: string
  round_number: number
  status: RoundStatus
  winner_id: string | null
  payout_receipt_url: string | null
  total_pool: number | null
  due_date: string | null
  draw_date: string | null
  payout_date: string | null
  created_at: string
  updated_at: string
  // Joined
  winner?: Profile
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  round_id: string
  group_id: string
  member_id: string
  transaction_reference: string
  receipt_url: string | null
  amount: number
  payment_date: string | null
  status: TransactionStatus
  collector_notes: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
  // Joined
  member?: Profile
}
