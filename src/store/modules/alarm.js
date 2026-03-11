const useAlarmStore = defineStore(
  'alarm',
  {
    state: () => ({
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      unreadCount: 0
    }),
    actions: {
      setList(payload) {
        this.list = payload.list || []
        this.total = payload.total || 0
      },
      addAlarm(alarm) {
        // insert to top
        this.list.unshift(alarm)
        this.unreadCount = (this.unreadCount || 0) + 1
      },
      markHandled(alarmId, update = {}) {
        const idx = this.list.findIndex(i => i.alarmId === alarmId)
        if (idx !== -1) {
          this.list[idx] = Object.assign({}, this.list[idx], update)
          // reduce unread if status changed to handled (2)
          if (update.status === 2 && this.unreadCount > 0) {
            this.unreadCount--
          }
        }
      },
      clearAll() {
        this.list = []
        this.total = 0
        this.unreadCount = 0
      },
      setUnreadCount(count) {
        this.unreadCount = count
      }
    }
  })

export default useAlarmStore

