import type { FastifyInstance } from 'fastify'

declare module '@inertiajs/react' {
  interface PageProps {
    auth: {
      user: App.Models.User & {
        id: number
        name: string
        email: string
        avatar_url?: string | null
        avatar?: string
        current_team?: { id: number; name: string } | null
        all_teams?: { id: number; name: string }[] | null
        role?: string
      }
    }
    ziggy: {
      base: string
      baseUrl: string
      defaults: Record<string, unknown>
      location: string | null
      namedRoutes: Record<string, { uri: string; methods: string[] }>
      queryParams: Record<string, string | string[]>
      route: (
        name: string,
        params?: Record<string, string | number>,
        absolute?: boolean,
        options?: { queryParams?: Record<string, string | string[]> }
      ) => string
      routes: (name: string) => { uri: string; methods: string[] } | undefined
      current: (routeName?: string) => boolean
      previousRoute: { name: string; uri: string; methods: string[] } | null
      queryParams: Record<string, string | string[]>
      isActive: (routeName: string, params?: Record<string, string | number>) => boolean
      isNotActive: (routeName: string, params?: Record<string, string | number>) => boolean
      setForgetCache: (value: boolean) => void
      isDirty: (routeName: string, params?: Record<string, string | number>) => boolean
    }
    errors: Record<string, string>
    ziggyStringifyArgs?: boolean
  }
}