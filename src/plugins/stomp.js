import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getToken } from '@/utils/auth'

let client = null
let subscription = null

export function initStomp(onMessageCallback, onConnectCallback, onDisconnectCallback) {
  if (client) {
    return
  }

  client = new Client({
    // use SockJS factory so server-side SockJS endpoint is used
    webSocketFactory: () => {
      // assumes backend exposes SockJS at /ws relative to base api
      const base = import.meta.env.VITE_APP_BASE_API || ''
      return new SockJS(base + '/ws')
    },
    connectHeaders: {
      Authorization: getToken() ? 'Bearer ' + getToken() : ''
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: frame => {
      // subscribe to alarm topic
      try {
        subscription = client.subscribe('/topic/alarm', message => {
          if (message.body) {
            let payload = null
            try {
              payload = JSON.parse(message.body)
            } catch (e) {
              payload = message.body
            }
            onMessageCallback && onMessageCallback(payload)
          }
        })
      } catch (e) {
        // ignore
      }
      onConnectCallback && onConnectCallback(frame)
    },
    onStompError: frame => {
      console.error('STOMP error', frame)
    },
    onDisconnect: frame => {
      onDisconnectCallback && onDisconnectCallback(frame)
    }
  })

  client.activate()
}

export function disconnectStomp() {
  try {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
    if (client) {
      client.deactivate()
      client = null
    }
  } catch (e) {
    // ignore
  }
}

export function isStompConnected() {
  return client && client.connected
}

