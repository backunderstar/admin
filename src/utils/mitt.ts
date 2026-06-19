/**
 * 事件总线模块
 *
 * 基于 mitt 的全局事件通信工具
 *
 * @module utils/mitt
 * @author Zhao
 */
import mitt from 'mitt'

type Events = {
  'open-settings': void
  'open-search': void
}

export default mitt<Events>()
