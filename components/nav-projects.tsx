"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const pathname = usePathname()

  // Helper to preserve project parameter in URLs
  const getUrlWithProject = (url: string) => {
    if (!projectId || url === '#') return url

    // Only adjust internal app routes
    if (!url.startsWith('/')) return url

    // Don't touch URLs that already have query params
    if (url.includes('?')) return url

    // Routes that should always preserve the project context
    const shouldCarryProject =
      url === '/sprints' ||
      url === '/backlog' ||
      url === '/bugs' ||
      url === '/wiki' ||
      url.startsWith('/settings/')

    if (shouldCarryProject) {
      return `${url}?project=${projectId}`
    }

    return url
  }

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Projects</SidebarGroupLabel> */}
      <SidebarMenu>
        {projects.map((item) => {
          const href = getUrlWithProject(item.url)
          const isActive =
            href.startsWith('/') && pathname === item.url
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive} className="hover:border hover:border-primary hover:text-sidebar-accent-foreground">
                {href.startsWith('/') ? (
                  <Link href={href} prefetch={true}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <a href={href}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
