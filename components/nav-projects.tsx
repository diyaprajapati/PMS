"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
  const { isMobile } = useSidebar()
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
      url === '/dashboard' ||
      url === '/sprints' ||
      url.startsWith('/settings/')

    if (shouldCarryProject) {
      return `${url}?project=${projectId}`
    }

    return url
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {/* <SidebarGroupLabel>Projects</SidebarGroupLabel> */}
      <SidebarMenu>
        {projects.map((item) => {
          const href = getUrlWithProject(item.url)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                {href.startsWith('/') ? (
                  <Link href={href}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
