'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Bell, Briefcase, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ProviderSettings = {
	displayName: string
	bio: string
	timezone: string
	availabilityStatus: 'available' | 'busy' | 'away' | 'offline'
	weeklyCapacity: number
	responseTargetHours: number
	notificationPreferences: {
		email: boolean
		newRequests: boolean
		messages: boolean
		deadlineReminders: boolean
	}
	workloadPreferences: {
		preferredServices: string[]
		maxActiveRequests: number
		autoAssign: boolean
	}
}

const defaultSettings: ProviderSettings = {
	displayName: '',
	bio: '',
	timezone: 'Africa/Accra',
	availabilityStatus: 'available',
	weeklyCapacity: 20,
	responseTargetHours: 24,
	notificationPreferences: { email: true, newRequests: true, messages: true, deadlineReminders: true },
	workloadPreferences: { preferredServices: [], maxActiveRequests: 10, autoAssign: false },
}

const availabilityColors: Record<string, string> = {
	available: 'bg-emerald-500',
	busy: 'bg-amber-500',
	away: 'bg-orange-400',
	offline: 'bg-slate-400',
}

export function ProviderSettingsForm() {
	const [settings, setSettings] = useState<ProviderSettings>(defaultSettings)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			try {
				const res = await fetch('/api/provider/settings', { cache: 'no-store' })
				const payload = await res.json()
				if (!res.ok) throw new Error(payload.error || 'Failed to load settings')
				if (!cancelled) {
					setSettings({
						...defaultSettings,
						...(payload.data || {}),
						notificationPreferences: { ...defaultSettings.notificationPreferences, ...(payload.data?.notificationPreferences || {}) },
						workloadPreferences: { ...defaultSettings.workloadPreferences, ...(payload.data?.workloadPreferences || {}) },
					})
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to load settings')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		void load()
		return () => { cancelled = true }
	}, [])

	const save = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/provider/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings),
			})
			const payload = await res.json()
			if (!res.ok) throw new Error(payload.error || 'Failed to save')
			setSettings({
				...defaultSettings,
				...(payload.data || settings),
				notificationPreferences: { ...defaultSettings.notificationPreferences, ...(payload.data?.notificationPreferences || settings.notificationPreferences) },
				workloadPreferences: { ...defaultSettings.workloadPreferences, ...(payload.data?.workloadPreferences || settings.workloadPreferences) },
			})
			toast.success('Settings saved')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not save settings')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className='flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200 bg-white'>
				<Loader2 className='h-5 w-5 animate-spin text-slate-400' />
			</div>
		)
	}

	return (
		<div className='space-y-3'>
			{/* Profile section */}
			<Section icon={User} title='Profile & Availability'>
				<div className='space-y-2.5'>
					<FormRow>
						<Label htmlFor='displayName' className='text-[12px]'>Display name</Label>
						<Input id='displayName' value={settings.displayName} onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} placeholder='Your name' className='h-8 text-[13px]' />
					</FormRow>
					<FormRow>
						<Label htmlFor='bio' className='text-[12px]'>Bio</Label>
						<Textarea id='bio' value={settings.bio} onChange={(e) => setSettings({ ...settings, bio: e.target.value })} placeholder='Short note for internal context…' rows={3} className='resize-none text-[13px]' />
					</FormRow>
					<div className='grid gap-2.5 sm:grid-cols-2'>
						<FormRow>
							<Label className='text-[12px]'>Availability</Label>
							<div className='flex items-center gap-2'>
								<span className={`h-2.5 w-2.5 rounded-full ${availabilityColors[settings.availabilityStatus]}`} />
								<Select
									value={settings.availabilityStatus}
									onValueChange={(v: ProviderSettings['availabilityStatus']) => setSettings({ ...settings, availabilityStatus: v })}
								>
									<SelectTrigger className='h-8 flex-1 text-[13px]'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='available'>Available</SelectItem>
										<SelectItem value='busy'>Busy</SelectItem>
										<SelectItem value='away'>Away</SelectItem>
										<SelectItem value='offline'>Offline</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</FormRow>
						<FormRow>
							<Label htmlFor='timezone' className='text-[12px]'>Timezone</Label>
							<Input id='timezone' value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className='h-8 text-[13px]' />
						</FormRow>
						<FormRow>
							<Label htmlFor='weeklyCapacity' className='text-[12px]'>Weekly capacity (hrs)</Label>
							<Input id='weeklyCapacity' type='number' min={0} max={168} value={settings.weeklyCapacity} onChange={(e) => setSettings({ ...settings, weeklyCapacity: Number(e.target.value) })} className='h-8 text-[13px]' />
						</FormRow>
						<FormRow>
							<Label htmlFor='responseTarget' className='text-[12px]'>Response target (hrs)</Label>
							<Input id='responseTarget' type='number' min={1} max={168} value={settings.responseTargetHours} onChange={(e) => setSettings({ ...settings, responseTargetHours: Number(e.target.value) })} className='h-8 text-[13px]' />
						</FormRow>
					</div>
				</div>
			</Section>

			{/* Two-column: notifications + workload */}
			<div className='grid gap-3 md:grid-cols-2'>
				<Section icon={Bell} title='Notifications'>
					<div className='space-y-2'>
						<SwitchRow label='Email notifications' checked={settings.notificationPreferences.email} onCheckedChange={(v) => setSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, email: v } })} />
						<SwitchRow label='New requests' checked={settings.notificationPreferences.newRequests} onCheckedChange={(v) => setSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, newRequests: v } })} />
						<SwitchRow label='Messages' checked={settings.notificationPreferences.messages} onCheckedChange={(v) => setSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, messages: v } })} />
						<SwitchRow label='Deadline reminders' checked={settings.notificationPreferences.deadlineReminders} onCheckedChange={(v) => setSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, deadlineReminders: v } })} />
					</div>
				</Section>

				<Section icon={Briefcase} title='Workload'>
					<div className='space-y-2.5'>
						<FormRow>
							<Label htmlFor='maxRequests' className='text-[12px]'>Max active requests</Label>
							<Input id='maxRequests' type='number' min={1} max={200} value={settings.workloadPreferences.maxActiveRequests} onChange={(e) => setSettings({ ...settings, workloadPreferences: { ...settings.workloadPreferences, maxActiveRequests: Number(e.target.value) } })} className='h-8 text-[13px]' />
						</FormRow>
						<SwitchRow label='Auto-assign requests' checked={settings.workloadPreferences.autoAssign} onCheckedChange={(v) => setSettings({ ...settings, workloadPreferences: { ...settings.workloadPreferences, autoAssign: v } })} />
					</div>
				</Section>
			</div>

			<Button onClick={save} disabled={saving} className='w-full gap-2 bg-emerald-600 hover:bg-emerald-700'>
				{saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
				Save settings
			</Button>
		</div>
	)
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
	return (
		<div className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Icon className='h-4 w-4 text-slate-500' />
				<p className='text-[13px] font-semibold text-slate-800'>{title}</p>
			</div>
			{children}
		</div>
	)
}

function FormRow({ children }: { children: React.ReactNode }) {
	return <div className='space-y-1'>{children}</div>
}

function SwitchRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
	return (
		<div className='flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2'>
			<span className='text-[12px] font-medium text-slate-700'>{label}</span>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	)
}
