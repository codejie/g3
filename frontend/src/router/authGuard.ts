import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '../store/userStore'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    const loaded = userStore.loadUser()
    if (!loaded) {
      if (to.path !== '/login') {
        next({ path: '/login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
      return
    }
  }

  if (to.path === '/login') {
    if (userStore.isAdmin) {
      next({ path: '/admin' })
    } else {
      next({ path: '/home' })
    }
    return
  }

  if (to.path === '/admin' && !userStore.isAdmin) {
    next({ path: '/home' })
    return
  }

  if (to.path === '/home' && userStore.isAdmin) {
    next({ path: '/admin' })
    return
  }

  next()
}