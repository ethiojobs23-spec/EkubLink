'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload, AlertCircle, CheckCircle2, Loader2, Camera, FileText } from 'lucide-react'
import Link from 'next/link'
import { validateCBEReference } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string; roundId: string }>
}

export default function UploadReceiptPage({ params }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    reference: '',
    amount: '',
    payment_date: '',
    payment_time: '',
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, roundId } = await params

    if (!file) { setError('Please upload your CBE receipt'); return }
    if (!validateCBEReference(form.reference)) {
      setError('Invalid CBE reference. Must start with "FT" (e.g. FT240582GR64)')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    // Check for duplicate reference number
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('transaction_reference', form.reference.trim().toUpperCase())
      .single()

    if (existing) {
      setError('⚠️ This CBE reference number has already been used. Please check your receipt.')
      setLoading(false)
      return
    }

    // Get group info
    const { data: round } = await supabase
      .from('rounds')
      .select('group_id')
      .eq('id', roundId)
      .single()

    if (!round) { setError('Round not found'); setLoading(false); return }

    // Upload receipt to Supabase Storage
    let receipt_url: string | null = null
    const ext = file.name.split('.').pop()
    const filePath = `receipts/${round.group_id}/${roundId}/${user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, { upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
      receipt_url = urlData.publicUrl
    }

    // Get group contribution amount
    const { data: groupData } = await supabase
      .from('ekub_groups')
      .select('contribution_amount')
      .eq('id', round.group_id)
      .single()

    // Create transaction record
    const paymentDateTime = form.payment_date && form.payment_time
      ? new Date(`${form.payment_date}T${form.payment_time}`).toISOString()
      : new Date().toISOString()

    const { error: txError } = await supabase.from('transactions').insert({
      round_id: roundId,
      group_id: round.group_id,
      member_id: user.id,
      transaction_reference: form.reference.trim().toUpperCase(),
      receipt_url,
      amount: groupData?.contribution_amount || parseFloat(form.amount),
      payment_date: paymentDateTime,
      status: 'pending_verification',
    })

    if (txError) {
      if (txError.code === '23505') {
        setError('⚠️ This CBE reference number has already been submitted.')
      } else {
        setError(txError.message)
      }
      setLoading(false)
      return
    }

    router.push(`/groups/${id}?submitted=true`)
  }

  return (
    <div className="min-h-dvh bg-gray-950 pb-10">
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold">Upload Payment Receipt</h1>
          <p className="text-xs text-gray-500">CBE transfer receipt verification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Upload Area */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-medium">CBE Receipt Screenshot or PDF</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full glass rounded-2xl p-6 border-2 border-dashed border-white/10 hover:border-brand-500/40 transition-colors flex flex-col items-center gap-3"
          >
            {preview ? (
              <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-contain rounded-xl" />
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-brand-400" />
                <p className="text-sm text-gray-400">{file.name}</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-brand-600/20 rounded-2xl flex items-center justify-center">
                  <Upload className="w-7 h-7 text-brand-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Tap to upload receipt</p>
                  <p className="text-xs text-gray-500 mt-0.5">PNG, JPG or PDF — screenshot from CBE app</p>
                </div>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="hidden"
            capture="environment"
          />
          {file && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-brand-400 underline"
            >
              Change file
            </button>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-medium">
            CBE Transaction Reference Number
          </label>
          <div className="relative">
            <input
              name="reference"
              type="text"
              required
              placeholder="e.g. FT240582GR64"
              value={form.reference}
              onChange={handleChange}
              className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-600 font-mono uppercase"
              style={{ letterSpacing: '0.05em' }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            Find this on your CBE receipt — starts with "FT"
          </p>
        </div>

        {/* Payment Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Payment Date</label>
            <input
              name="payment_date"
              type="date"
              required
              value={form.payment_date}
              onChange={handleChange}
              className="w-full glass rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Payment Time</label>
            <input
              name="payment_time"
              type="time"
              required
              value={form.payment_time}
              onChange={handleChange}
              className="w-full glass rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-gray-900"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="glass rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">How to find your receipt</p>
            <p>1. Open CBE Mobile Banking app</p>
            <p>2. Go to Transaction History</p>
            <p>3. Tap your recent transfer</p>
            <p>4. Screenshot the receipt showing the FT reference number</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {loading ? 'Submitting...' : 'Submit Receipt for Verification'}
        </button>
      </form>
    </div>
  )
}
