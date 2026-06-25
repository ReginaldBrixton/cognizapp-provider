'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupportFile, SupportMessage, SupportRequest, SupportThread } from '@/types/support'

export type MessageReference = {
	type: 'request' | 'file'
	id: string
	label: string
	meta?: string
}

export type SendMessagePayload = {
	body: string
	attachments?: Array<Record<string, unknown>>
	mentions?: MessageReference[]
	fileReferences?: MessageReference[]
	replyToMessageId?: string | null
}

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

function mergeMessage(messages: SupportMessage[] | undefined, message: SupportMessage) {
	const current = messages || []
	if (current.some((item) => item.id === message.id)) return current
	return [...current, message]
}

export function useSupportThreads() {
	return useQuery({
		queryKey: ['support', 'messages', 'threads'],
		queryFn: async () => {
			const response = await fetch('/api/support/messages/threads')
			if (!response.ok) throw new Error('Failed to load threads')
			const json = await response.json()
			return (json.data || []) as SupportThread[]
		},
		staleTime: 60 * 1000,
		gcTime: 5 * 60 * 1000,
		refetchInterval: 60 * 1000,
		refetchOnWindowFocus: false,
	})
}

export function useSupportMessages() {
	const threads = useSupportThreads()
	return {
		...threads,
		threads: threads.data || [],
	}
}

export function useSupportThreadMessages(threadId?: string) {
	return useQuery({
		queryKey: ['support', 'messages', threadId],
		enabled: Boolean(threadId),
		queryFn: async () => {
			const response = await fetch(
				`/api/support/messages/threads/${threadId}/messages`,
			)
			if (!response.ok) throw new Error('Failed to load messages')
			const json = await response.json()
			return (json.data || []) as SupportMessage[]
		},
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	})
}

export function useSupportThreadRealtime(
	threadId?: string,
	onMessage?: (message: SupportMessage) => void,
) {
	const queryClient = useQueryClient()
	const onMessageRef = useRef(onMessage)
	const [status, setStatus] = useState<RealtimeStatus>('idle')

	useEffect(() => {
		onMessageRef.current = onMessage
	}, [onMessage])

	useEffect(() => {
		if (!threadId) {
			setStatus('idle')
			return
		}

		let socket: WebSocket | null = null
		let events: EventSource | null = null
		let closed = false
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null
		let heartbeatTimer: ReturnType<typeof setInterval> | null = null
		let openedSocket = false

		const handleRealtimePayload = (payload: any) => {
			if (payload.type === 'message.created' && payload.message) {
				const message = payload.message as SupportMessage
				queryClient.setQueryData<SupportMessage[]>(
					['support', 'messages', threadId],
					(existing) => mergeMessage(existing, message),
				)
				queryClient.invalidateQueries({
					queryKey: ['support', 'messages', 'threads'],
				})
				onMessageRef.current?.(message)
			}

			// Handle message updates (edit/delete)
			if (payload.type === 'message.updated' && payload.message) {
				const message = payload.message as SupportMessage
				queryClient.setQueryData<SupportMessage[]>(
					['support', 'messages', threadId],
					(existing) => {
						if (!existing) return existing
						if (message.deletedAt) {
							return existing.map((m) =>
								m.id === message.id
									? {
										...m,
										...message,
										content: 'This message has been deleted',
										attachments: [],
										replyToMessage: null,
										canEdit: false,
										canDelete: false,
									}
									: m,
							)
						}
						return existing.map((m) => (m.id === message.id ? message : m))
					},
				)
				onMessageRef.current?.(message)
			}
		}

		const connectStream = (streamUrl: string) => {
			events?.close()
			events = new EventSource(streamUrl)
			events.onopen = () => setStatus('connected')
			events.onmessage = (event) => {
				try {
					handleRealtimePayload(JSON.parse(event.data))
				} catch {
					setStatus('error')
				}
			}
			events.onerror = () => {
				events?.close()
				if (closed) return
				setStatus('disconnected')
				reconnectTimer = setTimeout(connect, 2500)
			}
		}

		const connect = async () => {
			try {
				setStatus('connecting')
				const connectedAfter = new Date().toISOString()
				const response = await fetch(
					`/api/support/messages/ws-url?threadId=${encodeURIComponent(threadId)}&after=${encodeURIComponent(connectedAfter)}`,
				)
				if (!response.ok) throw new Error('Realtime authorization failed')
				const json = await response.json()
				const url = json.data?.url
				const streamUrl = json.data?.streamUrl
				if (!url && !streamUrl) throw new Error('Realtime URL missing')
				if (!url && streamUrl) {
					connectStream(streamUrl)
					return
				}

				socket = new WebSocket(url)
				socket.onopen = () => {
					openedSocket = true
					setStatus('connected')
					heartbeatTimer = setInterval(() => {
						if (socket?.readyState === WebSocket.OPEN) {
							socket.send(JSON.stringify({ type: 'ping' }))
						}
					}, 25000)
				}
				socket.onmessage = (event) => {
					try {
						handleRealtimePayload(JSON.parse(event.data))
					} catch {
						setStatus('error')
					}
				}
				socket.onerror = () => {
					setStatus('error')
					if (!openedSocket && streamUrl) {
						connectStream(streamUrl)
					}
				}
				socket.onclose = () => {
					if (heartbeatTimer) clearInterval(heartbeatTimer)
					if (closed) return
					if (!openedSocket && streamUrl) {
						connectStream(streamUrl)
						return
					}
					setStatus('disconnected')
					reconnectTimer = setTimeout(connect, 2000)
				}
			} catch {
				if (closed) return
				setStatus('error')
				reconnectTimer = setTimeout(connect, 3000)
			}
		}

		void connect()

		return () => {
			closed = true
			if (reconnectTimer) clearTimeout(reconnectTimer)
			if (heartbeatTimer) clearInterval(heartbeatTimer)
			socket?.close()
			events?.close()
		}
	}, [queryClient, threadId])

	return { status }
}

export function useSupportMessageReferences() {
	return useQuery({
		queryKey: ['support', 'messages', 'references'],
		queryFn: async () => {
			const response = await fetch('/api/support/messages/references')
			if (!response.ok) throw new Error('Failed to load references')
			const json = await response.json()
			const requests = (json.data?.requests || []) as SupportRequest[]
			const files = (json.data?.files || []) as SupportFile[]
			return {
				requests,
				files,
				references: [
					...requests.map((request) => ({
						type: 'request' as const,
						id: request.id,
						label: request.title || request.id,
						meta: request.status,
					})),
					...files.map((file) => ({
						type: 'file' as const,
						id: file.id,
						label: file.fileName,
						meta: file.purpose,
					})),
				],
			}
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export function useCreateSupportThread() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: { type?: 'request'; requestId: string }) => {
			const response = await fetch('/api/support/messages/threads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: input.type ?? 'request',
					requestId: input.requestId,
				}),
			})
			if (!response.ok) throw new Error('Failed to create conversation')
			const json = await response.json()
			return json.data as SupportThread
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['support', 'messages', 'threads'],
			})
		},
	})
}

export function useSendSupportMessage(thread: SupportThread | null) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: SendMessagePayload) => {
			if (!thread) throw new Error('Thread is required')

			const response = await fetch(
				`/api/support/messages/threads/${thread.id}/messages`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				},
			)
			if (!response.ok) throw new Error('Failed to send message')
			const json = await response.json()
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['support', 'messages', thread?.id],
			})
			queryClient.invalidateQueries({
				queryKey: ['support', 'messages', 'threads'],
			})
			queryClient.invalidateQueries({ queryKey: ['support', 'dashboard'] })
		},
	})
}

export function useEditSupportMessage(threadId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			messageId,
			content,
		}: {
			messageId: string
			content: string
		}) => {
			const response = await fetch(
				`/api/support/messages/threads/${threadId}/messages/${messageId}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content }),
				},
			)
			if (!response.ok) throw new Error('Failed to edit message')
			const json = await response.json()
			return json.data
		},
		onMutate: async ({ messageId, content }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['support', 'messages', threadId] })

			// Snapshot previous value
			const previousMessages = queryClient.getQueryData<SupportMessage[]>(['support', 'messages', threadId])

			// Optimistically update to the new value
			queryClient.setQueryData<SupportMessage[]>(
				['support', 'messages', threadId],
				(old) =>
					old?.map((msg) =>
						msg.id === messageId
							? { ...msg, content, editedAt: new Date().toISOString() }
							: msg
					)
			)

			return { previousMessages }
		},
		onError: (err, variables, context) => {
			// Revert to previous value on error
			if (context?.previousMessages) {
				queryClient.setQueryData(['support', 'messages', threadId], context.previousMessages)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ['support', 'messages', threadId],
			})
		},
	})
}

export function useDeleteSupportMessage(threadId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (messageId: string) => {
			const response = await fetch(
				`/api/support/messages/threads/${threadId}/messages/${messageId}`,
				{ method: 'DELETE' },
			)
			if (!response.ok) throw new Error('Failed to delete message')
			const json = await response.json()
			return json.data
		},
		onMutate: async (messageId) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['support', 'messages', threadId] })

			// Snapshot previous value
			const previousMessages = queryClient.getQueryData<SupportMessage[]>(['support', 'messages', threadId])

			const deletedAt = new Date().toISOString()
			queryClient.setQueryData<SupportMessage[]>(
				['support', 'messages', threadId],
				(old) => old?.map((msg) =>
					msg.id === messageId
						? {
							...msg,
							content: 'This message has been deleted',
							attachments: [],
							replyToMessage: null,
							deletedAt,
							canEdit: false,
							canDelete: false,
						}
						: msg,
				)
			)

			return { previousMessages }
		},
		onError: (err, variables, context) => {
			// Revert to previous value on error
			if (context?.previousMessages) {
				queryClient.setQueryData(['support', 'messages', threadId], context.previousMessages)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ['support', 'messages', threadId],
			})
		},
	})
}
