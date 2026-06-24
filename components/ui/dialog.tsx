// @ts-nocheck

'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { useMediaQuery } from '@/hooks/globals/useMediaQuery'
import { cn } from '@/lib/utils'

const desktopQuery = '(min-width: 640px)'

type DrawerRootProps = React.ComponentProps<typeof DrawerPrimitive.Root>
type MobileDrawerProps = Pick<
	DrawerRootProps,
	| 'closeThreshold'
	| 'direction'
	| 'dismissible'
	| 'fixed'
	| 'handleOnly'
	| 'repositionInputs'
	| 'scrollLockTimeout'
	| 'shouldScaleBackground'
>

type DialogRootProps = React.ComponentProps<typeof DialogPrimitive.Root> &
	Partial<MobileDrawerProps> & {
		mobileDrawer?: boolean
	}

const DialogContext = React.createContext({ mobileDrawer: true })

function useMobileDrawerMode() {
	const { mobileDrawer } = React.useContext(DialogContext)
	const isDesktop = useMediaQuery(desktopQuery)
	return mobileDrawer && !isDesktop
}

function hasDialogTitle(children: React.ReactNode): boolean {
	let found = false

	React.Children.forEach(children, (child) => {
		if (found || !React.isValidElement(child)) return

		const type = child.type as { displayName?: string; name?: string }
		const displayName = type.displayName || type.name
		if (
			displayName === DialogPrimitive.Title.displayName ||
			displayName === DrawerPrimitive.Title.displayName ||
			displayName === 'DialogTitle' ||
			displayName === 'Title'
		) {
			found = true
			return
		}

		// Recursively scan props.children (covers wrapped/nested titles)
		if (child.props) {
			const childChildren = (child.props as { children?: React.ReactNode }).children
			if (childChildren && hasDialogTitle(childChildren)) {
				found = true
			}
		}
	})

	return found
}

const Dialog = ({
	children,
	closeThreshold = 0.32,
	direction = 'bottom',
	mobileDrawer = true,
	repositionInputs = true,
	shouldScaleBackground = false,
	...props
}: DialogRootProps) => {
	const isDesktop = useMediaQuery(desktopQuery)

	if (!isDesktop && mobileDrawer) {
		return (
			<DialogContext.Provider value={{ mobileDrawer }}>
				<DrawerPrimitive.Root
					closeThreshold={closeThreshold}
					direction={direction}
					repositionInputs={repositionInputs}
					shouldScaleBackground={shouldScaleBackground}
					{...props}
				>
					{children}
				</DrawerPrimitive.Root>
			</DialogContext.Provider>
		)
	}

	return (
		<DialogContext.Provider value={{ mobileDrawer }}>
			<DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
		</DialogContext.Provider>
	)
}
Dialog.displayName = 'Dialog'

const DialogTrigger = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
	const isMobileDrawer = useMobileDrawerMode()
	const TriggerComponent = isMobileDrawer
		? DrawerPrimitive.Trigger
		: DialogPrimitive.Trigger

	return <TriggerComponent ref={ref as never} {...props} />
})
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName

const DialogPortal = (props: React.ComponentProps<typeof DialogPrimitive.Portal>) => {
	const isMobileDrawer = useMobileDrawerMode()
	const PortalComponent = isMobileDrawer
		? DrawerPrimitive.Portal
		: DialogPrimitive.Portal

	return <PortalComponent {...props} />
}
DialogPortal.displayName = DialogPrimitive.Portal.displayName

const DialogClose = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Close>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => {
	const isMobileDrawer = useMobileDrawerMode()
	const CloseComponent = isMobileDrawer
		? DrawerPrimitive.Close
		: DialogPrimitive.Close

	return <CloseComponent ref={ref as never} {...props} />
})
DialogClose.displayName = DialogPrimitive.Close.displayName

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
	const isMobileDrawer = useMobileDrawerMode()
	const OverlayComponent = isMobileDrawer
		? DrawerPrimitive.Overlay
		: DialogPrimitive.Overlay

	return (
		<OverlayComponent
			ref={ref as never}
			className={cn(
				'fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:bg-black/60',
				className,
			)}
			{...props}
		/>
	)
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		showMobileHandle?: boolean
		showCloseButton?: boolean
		fallbackTitle?: string
		fallbackDescription?: string
	}
>(
	(
		{
			className,
			children,
			showMobileHandle = true,
			showCloseButton = true,
			fallbackTitle = 'Dialog',
			fallbackDescription,
			...props
		},
		ref,
	) => {
		const isMobileDrawer = useMobileDrawerMode()
		const ContentComponent = isMobileDrawer
			? DrawerPrimitive.Content
			: DialogPrimitive.Content
		const CloseComponent = isMobileDrawer
			? DrawerPrimitive.Close
			: DialogPrimitive.Close
		const TitleComponent = isMobileDrawer
			? DrawerPrimitive.Title
			: DialogPrimitive.Title
		const DescriptionComponent = isMobileDrawer
			? DrawerPrimitive.Description
			: DialogPrimitive.Description
		const childrenHaveTitle = hasDialogTitle(children)
		const hiddenDescription = fallbackDescription ?? (fallbackTitle ? `${fallbackTitle} dialog` : '')

		return (
			<DialogPortal>
				<DialogOverlay />
				<ContentComponent
					ref={ref as never}
					className={cn(
						'fixed inset-x-0 bottom-0 top-auto z-[101] flex max-h-[calc(100dvh-0.5rem)] w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-background p-0 shadow-[0_-18px_60px_rgba(15,23,42,0.22)] outline-none',
						'sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:grid sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:overflow-y-auto sm:rounded-2xl sm:border-b sm:bg-background sm:p-6 sm:shadow-lg',
						'sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
						className,
					)}
					{...props}
				>
					{fallbackTitle && (!childrenHaveTitle || isMobileDrawer) ? (
						<TitleComponent className='sr-only'>{fallbackTitle}</TitleComponent>
					) : null}
					{isMobileDrawer && hiddenDescription ? (
						<DescriptionComponent className='sr-only'>{hiddenDescription}</DescriptionComponent>
					) : null}
					{showMobileHandle ? (
						<div className='sticky top-0 z-10 flex justify-center bg-background/95 pb-2 pt-3 sm:hidden'>
							<DrawerPrimitive.Handle className='h-1.5 w-11 rounded-full bg-muted-foreground/30 active:bg-muted-foreground/40' />
						</div>
					) : null}
					<div className='min-h-0 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain px-4 pb-4 sm:contents sm:max-h-none sm:overflow-visible sm:p-0'>
						{children}
					</div>
					{showCloseButton ? (
						<CloseComponent className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none'>
							<X className='h-4 w-4' />
							<span className='sr-only'>Close</span>
						</CloseComponent>
					) : null}
				</ContentComponent>
			</DialogPortal>
		)
	},
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
		{...props}
	/>
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2',
			className,
		)}
		{...props}
	/>
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
	const isMobileDrawer = useMobileDrawerMode()
	const TitleComponent = isMobileDrawer
		? DrawerPrimitive.Title
		: DialogPrimitive.Title

	return (
		<TitleComponent
			ref={ref as never}
			className={cn(
				'text-lg font-semibold leading-none tracking-tight text-foreground',
				className,
			)}
			{...props}
		/>
	)
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
	const isMobileDrawer = useMobileDrawerMode()
	const DescriptionComponent = isMobileDrawer
		? DrawerPrimitive.Description
		: DialogPrimitive.Description

	return (
		<DescriptionComponent
			ref={ref as never}
			className={cn('text-sm text-muted-foreground', className)}
			{...props}
		/>
	)
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
}
