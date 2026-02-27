"use client"

import * as React from "react"
import { Suspense } from "react"
import {
  Bug,
  Inbox,
  Layers,
  Settings2,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar"
import { NavProjects } from "./nav-projects"
import { ThemeToggle } from "./theme-toggle"
import Image from "next/image"
import { useCurrentUserQuery } from "@/queries/auth.queries"
import Link from "next/link"

export type SidebarUser = {
  name: string
  email: string
  avatar: string
}

// This is sample data (nav, projects). User comes from API.
const data = {
  projects: [
    {
      name: "Sprints",
      url: "/sprints",
      icon: Layers,
    },
    {
      name: "Backlog",
      url: "/backlog",
      icon: Inbox,
    },
    {
      name: "Bug Tracker",
      url: "/bugs",
      icon: Bug,
    },
  ],
  navMain: [
    // {
    //   title: "Playground",
    //   url: "#",
    //   icon: SquareTerminal,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "History",
    //       url: "#",
    //     },
    //     {
    //       title: "Starred",
    //       url: "#",
    //     },
    //     {
    //       title: "Settings",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Project Details",
          url: "/settings/project-details",
        },
        {
          title: "Team Members",
          url: "/settings/team-members",
        },
        // {
        //   title: "Monitoring",
        //   url: "#",
        // },
      ],
    },
  ],
}

const defaultUser: SidebarUser = {
  name: "User",
  email: "Loading…",
  avatar: "",
}

// Placeholder user used only for initial SSR + first client paint to avoid hydration mismatch.
const placeholderUser: SidebarUser = {
  name: "…",
  email: "…",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false)
  const { data: user } = useCurrentUserQuery(mounted)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Use a fixed placeholder until mounted so server and client render the same (avoids hydration error).
  const displayUser = mounted
    ? {
        name: user?.name ?? user?.email ?? defaultUser.name,
        email: user?.email ?? defaultUser.email,
        avatar: user?.image ?? defaultUser.avatar,
      }
    : placeholderUser

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="flex gap-4">
              <Link href="/projects">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/icon.png" alt="Runway" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Runway</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavProjects projects={data.projects} />
        </Suspense>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex w-full items-center justify-between gap-2">
          <NavUser user={displayUser} />
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
