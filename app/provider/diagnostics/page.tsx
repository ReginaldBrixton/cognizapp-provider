'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	BadgePercent,
	CreditCard,
	FileText,
	Loader2,
	MessageSquare,
	RefreshCcw,
	Send,
	Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SupportFile } from '@/types/support'

type ProviderRequest = {
	id: string
	taskId?: string
	title?: string
	currency?: string
	paymentAmount?: number
	quotedAmount?: number
	originalAmount?: number
	messageThreadId?: string | null
}

type DiagnosticResult = {
	label: string
	ok: boolean
	status: number
	body: unknown
}

function money(value?: number, currency = 'GHS') {
	return new Intl.NumberFormat('en-GH', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(Number(value ?? 0))
}

function getPayloadError(payload: unknown, fallback: string) {
	if (payload && typeof payload === 'object' && 'error' in payload) {
		return String((payload as { error?: unknown }).error || fallback)
	}
	return fallback
}

export default function ProviderDiagnosticsPage() {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [requests, setRequests] = useState<ProviderRequest[]>([])
	const [requestId, setRequestId] = useState('')
	const [threadId, setThreadId] = useState('')
	const [cardAmount, setCardAmount] = useState('10')
	const [message, setMessage] = useState('Provider diagnostic message')
	const [discountPercent, setDiscountPercent] = useState('100')
	const [discountLabel, setDiscountLabel] = useState('Production diagnostic')
	const [file, setFile] = useState<File | null>(null)
	const [busy, setBusy] = useState<string | null>(null)
	const [results, setResults] = useState<DiagnosticResult[]>([])

	const selectedRequest = useMemo(
		() => requests.find((item) => item.id === requestId) ?? null,
		[requestId, requests],
	)
	const baseAmount = Number(
		selectedRequest?.originalAmount ??
			selectedRequest?.paymentAmount ??
			selectedRequest?.quotedAmount ??
			0,
	)

	const recordResult = (result: DiagnosticResult) => {
		setResults((current) => [result, ...current].slice(0, 8))
	}

	const callJson = async (label: string, url: string, init: RequestInit = {}) => {
		const response = await fetch(url, {
			cache: 'no-store',
			...init,
			headers: {
				'Content-Type': 'application/json',
				...(init.headers || {}),
			},
		})
		const body = await response.json().catch(() => null)
		recordResult({ label, ok: response.ok, status: response.status, body })
		if (!response.ok) throw new Error(getPayloadError(body, `${label} failed`))
		return body
	}

	const loadRequests = async () => {
		setBusy('requests')
		try {
			const payload = await callJson('Load provider requests', '/api/support/provider/requests')
			const data = (payload?.data || []) as ProviderRequest[]
			setRequests(data)
			if (!requestId && data[0]?.id) {
				setRequestId(data[0].id)
				setThreadId(data[0].messageThreadId || '')
			}
		} finally {
			setBusy(null)
		}
	}

	useEffect(() => {
		void loadRequests()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		setThreadId(selectedRequest?.messageThreadId || '')
	}, [selectedRequest?.messageThreadId])

	const ensureThread = async () => {
		if (threadId) return threadId
		if (!requestId) throw new Error('Select a request first')
		const payload = await callJson('Create request thread', '/api/support/messages/threads', {
			method: 'POST',
			body: JSON.stringify({ type: 'request', requestId }),
		})
		const nextThreadId = String(payload?.data?.id || '')
		if (!nextThreadId) throw new Error('Thread was not returned')
		setThreadId(nextThreadId)
		return nextThreadId
	}

	const runPaymentCard = async () => {
		if (!requestId) return
		setBusy('card')
		try {
			await callJson('Send payment card', `/api/support/provider/requests/${requestId}/send-card`, {
				method: 'POST',
				body: JSON.stringify({
					kind: 'payment',
					amount: Number(cardAmount || 0),
					paymentType: 'deposit',
					note: 'Production diagnostic payment card',
				}),
			})
		} finally {
			setBusy(null)
		}
	}

	const runDiscountCode = async () => {
		setBusy('code')
		try {
			await callJson('Create discount code', '/api/support/provider/discount-codes', {
				method: 'POST',
				body: JSON.stringify({
					label: discountLabel,
					discountPercent: Number(discountPercent || 100),
					maxRedemptions: 1,
				}),
			})
		} finally {
			setBusy(null)
		}
	}

	const runRequestDiscount = async () => {
		if (!requestId) return
		setBusy('discount')
		try {
			const percent = Number(discountPercent || 100)
			await callJson('Apply request discount', `/api/support/provider/requests/${requestId}/discount-decision`, {
				method: 'POST',
				body: JSON.stringify({
					status: 'approved',
					requestedAmount: baseAmount,
					approvedAmount: Math.round(((baseAmount * percent) / 100) * 100) / 100,
					discountPercent: percent,
					depositPercent: percent >= 100 ? 0 : 70,
					reason: 'Provider production diagnostic discount',
				}),
			})
		} finally {
			setBusy(null)
		}
	}

	const runMessageAndFile = async () => {
		setBusy('message')
		try {
			const activeThreadId = await ensureThread()
			let uploaded: SupportFile[] = []
			if (file) {
				const formData = new FormData()
				formData.append('files', file)
				formData.append('threadId', activeThreadId)
				if (requestId) formData.append('requestId', requestId)
				formData.append('purpose', 'provider_message_upload')
				const uploadResponse = await fetch('/api/support/files/upload', {
					method: 'POST',
					body: formData,
				})
				const uploadBody = await uploadResponse.json().catch(() => null)
				recordResult({
					label: 'Upload provider chat file',
					ok: uploadResponse.ok,
					status: uploadResponse.status,
					body: uploadBody,
				})
				if (!uploadResponse.ok) throw new Error(getPayloadError(uploadBody, 'File upload failed'))
				uploaded = (uploadBody?.data || []) as SupportFile[]
			}
			await callJson('Send provider message', `/api/support/messages/threads/${activeThreadId}/messages`, {
				method: 'POST',
				body: JSON.stringify({
					body: message || (uploaded.length ? `Sent file: ${uploaded[0].fileName}` : 'Provider diagnostic message'),
					attachments: uploaded.map((item) => ({
						kind: 'file',
						id: item.id,
						fileId: item.id,
						name: item.fileName,
						label: item.fileName,
						url: item.fileUrl || `/api/support/files/${item.id}/download`,
						externalUrl: item.externalFileUrl ?? null,
						type: item.fileType,
						size: Number(item.fileSize ?? 0),
						purpose: item.purpose || 'provider_message_upload',
					})),
					fileReferences: uploaded.map((item) => ({
						type: 'file',
						id: item.id,
						label: item.fileName,
						meta: item.purpose || 'provider message',
					})),
				}),
			})
		} finally {
			setBusy(null)
		}
	}

	return (
		<div className='h-full overflow-y-auto bg-slate-50 px-3 py-3 sm:px-5 sm:py-5 lg:px-8'>
			<div className='mx-auto flex w-full max-w-screen-xl flex-col gap-4'>
				<div>
					<h1 className='text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl'>Provider Diagnostics</h1>
					<p className='text-[12px] text-slate-500 lg:text-sm'>Production-safe test console for cards, chat files, messages, and 1-100% discounts.</p>
				</div>

				<div className='grid gap-3 lg:grid-cols-[minmax(280px,360px)_1fr]'>
					<section className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
						<div className='mb-3 flex items-center justify-between gap-2'>
							<p className='text-[12px] font-semibold uppercase tracking-wide text-slate-500'>Target request</p>
							<Button size='sm' variant='outline' onClick={loadRequests} disabled={busy === 'requests'} className='h-8 gap-1.5'>
								{busy === 'requests' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <RefreshCcw className='h-3.5 w-3.5' />}
								Refresh
							</Button>
						</div>
						<select
							value={requestId}
							onChange={(event) => setRequestId(event.target.value)}
							className='h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px]'
						>
							<option value=''>Select a request</option>
							{requests.map((item) => (
								<option key={item.id} value={item.id}>
									{item.title || item.taskId || item.id}
								</option>
							))}
						</select>
						<Input value={requestId} onChange={(event) => setRequestId(event.target.value)} className='mt-2 h-9 text-[13px]' placeholder='Request ID' />
						<Input value={threadId} onChange={(event) => setThreadId(event.target.value)} className='mt-2 h-9 text-[13px]' placeholder='Thread ID, optional' />
						<p className='mt-2 text-[12px] text-slate-500'>
							Request value: <span className='font-semibold text-slate-800'>{money(baseAmount, selectedRequest?.currency)}</span>
						</p>
					</section>

					<section className='grid gap-3 md:grid-cols-2'>
						<div className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
							<div className='mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900'>
								<CreditCard className='h-4 w-4 text-emerald-600' /> Card test
							</div>
							<Input value={cardAmount} onChange={(event) => setCardAmount(event.target.value)} type='number' className='h-9 text-[13px]' placeholder='Amount' />
							<Button onClick={runPaymentCard} disabled={!requestId || busy === 'card'} className='mt-2 h-9 w-full gap-1.5'>
								{busy === 'card' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
								Send card
							</Button>
						</div>

						<div className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
							<div className='mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900'>
								<BadgePercent className='h-4 w-4 text-emerald-600' /> Discount test
							</div>
							<div className='grid grid-cols-[1fr_88px] gap-2'>
								<Input value={discountLabel} onChange={(event) => setDiscountLabel(event.target.value)} className='h-9 text-[13px]' placeholder='Label' />
								<Input value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} type='number' min='1' max='100' className='h-9 text-[13px]' placeholder='100' />
							</div>
							<div className='mt-2 grid grid-cols-2 gap-2'>
								<Button onClick={runDiscountCode} disabled={busy === 'code'} variant='outline' className='h-9 gap-1.5'>
									{busy === 'code' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <BadgePercent className='h-3.5 w-3.5' />}
									Code
								</Button>
								<Button onClick={runRequestDiscount} disabled={!requestId || busy === 'discount'} className='h-9 gap-1.5'>
									{busy === 'discount' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
									Apply
								</Button>
							</div>
						</div>

						<div className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2'>
							<div className='mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900'>
								<MessageSquare className='h-4 w-4 text-emerald-600' /> Message and file test
							</div>
							<Textarea value={message} onChange={(event) => setMessage(event.target.value)} className='min-h-20 resize-none text-[13px]' />
							<input ref={fileInputRef} type='file' className='hidden' onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
							<div className='mt-2 flex flex-col gap-2 sm:flex-row sm:items-center'>
								<Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()} className='h-9 gap-1.5'>
									<Upload className='h-3.5 w-3.5' />
									{file ? file.name : 'Choose file'}
								</Button>
								<Button onClick={runMessageAndFile} disabled={busy === 'message'} className='h-9 gap-1.5 sm:ml-auto'>
									{busy === 'message' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <FileText className='h-3.5 w-3.5' />}
									Send message/file
								</Button>
							</div>
						</div>
					</section>
				</div>

				<section className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
					<p className='mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500'>Latest results</p>
					<div className='space-y-2'>
						{results.length === 0 ? (
							<p className='rounded-lg border border-dashed border-slate-200 py-6 text-center text-[12px] text-slate-400'>No diagnostics run yet</p>
						) : (
							results.map((result, index) => (
								<div key={`${result.label}-${index}`} className='rounded-lg border border-slate-200 bg-slate-50 p-2'>
									<div className='flex items-center justify-between gap-2'>
										<p className='text-[12px] font-semibold text-slate-800'>{result.label}</p>
										<span className={result.ok ? 'text-[11px] font-semibold text-emerald-700' : 'text-[11px] font-semibold text-red-600'}>
											{result.status}
										</span>
									</div>
									<pre className='mt-1 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] text-slate-600'>
										{JSON.stringify(result.body, null, 2)}
									</pre>
								</div>
							))
						)}
					</div>
				</section>
			</div>
		</div>
	)
}
