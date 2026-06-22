// src/hooks/core/useMenuNavigation.ts
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { findMenuItem } from '@/utils/navigation/route'
import type { AppRouteRecord } from '@/types/router'

export function useMenuNavigation() {
  const router = useRouter()
  const menuStore = useMenuStore()
  const worktabStore = useWorktabStore()

  /**
   * 根据菜单 key 导航（由 ZhaoSidebar 使用）
   */
  const navigateByKey = (key: string, options?: { closeMobile?: () => void }) => {
    const item = findMenuItem(menuStore.menuList, key)
    if (!item) {
      router.push(key)
      return
    }
    const path = item.meta?.link || item.path || key
    router.push(path)
    openTabForItem(item)
    options?.closeMobile?.()
  }

  /**
   * 根据菜单 item 导航（由 HeaderBar 的 horizontal/mixed menu 使用）
   */
  const navigateByItem = (item: AppRouteRecord) => {
    const path = item.meta?.link || item.path
    if (!path) return
    router.push(path)
    openTabForItem(item)
  }

  /**
   * 统一为菜单项打开工作标签页
   */
  const openTabForItem = (item: AppRouteRecord) => {
    const path = item.meta?.link || item.path
    if (!path) return
    worktabStore.openTab({
      path,
      name: item.name as string,
      title: item.meta?.title || '',
      icon: item.meta?.icon,
      keepAlive: item.meta?.keepAlive ?? true,
      fixedTab: item.meta?.fixedTab ?? false,
    })
  }

  return { navigateByKey, navigateByItem, openTabForItem }
}
