'use client'

import { Download, File, FileImage, FileText, Film, Music } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import type { Attachment } from '@/types/support'

interface FilePreviewProps {
	attachment: Attachment
	compact?: boolean
	className?: string
}

export function FilePreview({ attachment, compact = false, className = '' }: FilePreviewProps) {
	const [imageError, setImageError] = useState(false)
	const fileUrl = attachment.externalUrl || attachment.url
	const fileName = attachment.name || attachment.label || 'Attachment'
	const fileType = attachment.type || ''
	const fileSize = attachment.size

	const isImage = fileType.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName)
	const isVideo = fileType.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(fileName)
	const isAudio = fileType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(fileName)
	const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf')
	const isDoc = /\.(docx?|txt|rtf|odt)$/i.test(fileName)

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return ''
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const getFileIcon = () => {
		if (isImage) return <FileImage className="w-4 h-4" />
		if (isPdf) return <FileText className="w-4 h-4 text-zinc-5001432" />
		if (isDoc) return <FileText className="w-4 h-4 text-zinc-5001498" />
		if (isVideo) return <Film className="w-4 h-4 text-zinc-5001563" />
		if (isAudio) return <Music className="w-4 h-4 text-zinc-5001631" />
		return <File className="w-4 h-4" />
	}

	// Compact version - just icon and name
	if (compact) {
		return (
			<a
				href={fileUrl}
				target="_blank"
				rel="noopener noreferrer"
				className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm max-w-full ${className}`}
			>
				{getFileIcon()}
				<span className="truncate font-medium">{fileName}</span>
				{fileSize && <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(fileSize)}</span>}
			</a>
		)
	}

	// Full preview version
	return (
		<div className={`rounded-xl overflow-hidden border border-border bg-card shadow-sm ${className}`}>
			{/* Preview Area */}
			{isImage && fileUrl && !imageError ? (
				<div className="relative w-full aspect-[4/3] bg-muted">
					<Image
						src={fileUrl}
						alt={fileName}
						fill
						className="object-cover"
						onError={() => setImageError(true)}
						loading="lazy"
					/>
					<a
						href={fileUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors group"
					>
						<div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
								<Download className="w-3 h-3" />
								View full
							</div>
						</div>
					</a>
				</div>
			) : isVideo && fileUrl ? (
				<div className="relative w-full aspect-video bg-black">
					<video
						src={fileUrl}
						controls
						className="w-full h-full"
						preload="metadata"
					>
						Your browser does not support video playback.
					</video>
				</div>
			) : isPdf && fileUrl ? (
				<div className="relative w-full h-48 bg-gradient-to-br from-zinc-503489 to-zinc-1003501 flex items-center justify-center">
					<div className="text-center">
						<FileText className="w-16 h-16 text-zinc-5003619 mx-auto mb-2" />
						<p className="text-sm font-medium text-zinc-7003689">PDF Document</p>
					</div>
					<a
						href={fileUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors"
					/>
				</div>
			) : (
				<div className="relative w-full h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
					<div className="text-center">
						{getFileIcon()}
						<p className="text-xs text-muted-foreground mt-1">File attachment</p>
					</div>
				</div>
			)}

			{/* File Info */}
			<div className="p-3 flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium truncate">{fileName}</p>
					<div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
						{fileSize && <span>{formatFileSize(fileSize)}</span>}
						{fileType && fileSize && <span>•</span>}
						{fileType && <span className="truncate">{fileType.split('/')[1]?.toUpperCase()}</span>}
					</div>
				</div>

				{fileUrl && (
					<a
						href={fileUrl}
						target="_blank"
						rel="noopener noreferrer"
						download
						className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
						title="Download file"
					>
						<Download className="w-4 h-4 text-muted-foreground" />
					</a>
				)}
			</div>
		</div>
	)
}

interface MultipleFilesPreviewProps {
	attachments: Attachment[]
	className?: string
}

export function MultipleFilesPreview({ attachments, className = '' }: MultipleFilesPreviewProps) {
	const fileAttachments = attachments.filter(
		(att) => !att.kind || att.kind === 'file'
	)

	if (fileAttachments.length === 0) return null

	return (
		<div className={`space-y-2 ${className}`}>
			{fileAttachments.map((attachment, index) => (
				<FilePreview
					key={attachment.id || attachment.fileId || index}
					attachment={attachment}
				/>
			))}
		</div>
	)
}
