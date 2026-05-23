"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import * as React from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

function useCollapsibleOpen(key: string, defaultOpen: boolean) {
  const [open, setOpen] = React.useState(() => {
    if (typeof window === "undefined") return defaultOpen
    try {
      const stored = window.localStorage.getItem(`sidebar-collapsible-${key}`)
      return stored !== null ? stored === "true" : defaultOpen
    } catch {
      return defaultOpen
    }
  })

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      setOpen(value)
      try {
        window.localStorage.setItem(`sidebar-collapsible-${key}`, String(value))
      } catch {
        // ignore storage errors
      }
    },
    [key]
  )

  return [open, handleOpenChange] as const
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  // Helper to preserve project parameter in URLs
  const getUrlWithProject = (url: string) => {
    if (!projectId || url === '#') return url

    // Only adjust internal app routes
    if (!url.startsWith('/')) return url

    // Don't touch URLs that already have query params
    if (url.includes('?')) return url

    // Routes that should always preserve the project context
    const shouldCarryProject =
      // url === '/dashboard' ||
      url === '/sprints' ||
      url.startsWith('/settings/')

    if (shouldCarryProject) {
      return `${url}?project=${projectId}`
    }

    return url
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const [open, onOpenChange] = useCollapsibleOpen(
            item.title,
            item.isActive ?? false
          )
          return (
          <Collapsible
            key={item.title}
            asChild
            open={open}
            onOpenChange={onOpenChange}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const href = getUrlWithProject(subItem.url)
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          {href.startsWith('/') ? (
                            <Link href={href}>
                              <span>{subItem.title}</span>
                            </Link>
                          ) : (
                            <a href={href}>
                              <span>{subItem.title}</span>
                            </a>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
