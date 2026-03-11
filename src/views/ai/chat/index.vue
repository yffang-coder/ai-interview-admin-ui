<template>
  <div class="app-container chat-container">
    <el-row :gutter="20" style="height: 100%">
      <!-- User List -->
      <el-col :span="6" style="height: 100%">
        <el-card class="box-card user-list-card" :body-style="{ padding: '0px', height: '100%' }">
          <template #header>
            <div class="clearfix">
              <span>管理员列表</span>
            </div>
          </template>
          <div class="user-list">
            <div
              v-for="user in userList"
              :key="user.userId"
              class="user-item"
              :class="{ active: currentChatUser && currentChatUser.userId === user.userId }"
              @click="selectUser(user)"
            >
              <el-avatar :src="user.avatar" icon="el-icon-user-solid"></el-avatar>
              <span class="user-name">{{ user.nickName || user.userName }}</span>
              <el-badge :value="user.unreadCount" class="item" v-if="user.unreadCount > 0" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Chat Window -->
      <el-col :span="18" style="height: 100%">
        <el-card class="box-card chat-window-card" :body-style="{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column' }">
          <div v-if="currentChatUser" class="chat-wrapper">
            <!-- Header -->
            <div class="chat-header">
              <span>{{ currentChatUser.nickName || currentChatUser.userName }}</span>
            </div>
            
            <!-- Messages -->
            <div class="chat-messages" ref="scrollRef">
              <div
                v-for="msg in messageList"
                :key="msg.messageId"
                class="message-item"
                :class="{ 'message-mine': msg.senderId === currentUserId }"
              >
                <div class="message-content-wrapper">
                  <div class="message-time">{{ parseTime(msg.createTime) }}</div>
                  <div class="message-bubble">
                    <!-- Text -->
                    <span v-if="msg.msgType === '0'">{{ msg.content }}</span>
                    <!-- Image -->
                    <el-image
                      v-else-if="msg.msgType === '1'"
                      :src="msg.content"
                      :preview-src-list="[msg.content]"
                      style="max-width: 200px; max-height: 200px"
                    />
                    <!-- File -->
                    <a v-else-if="msg.msgType === '2'" :href="msg.content" target="_blank" class="file-link">
                      <el-icon><Document /></el-icon> 文件下载
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="chat-input">
              <div class="toolbar">
                <!-- Image Upload -->
                <el-upload
                  action="#"
                  :http-request="uploadImage"
                  :show-file-list="false"
                  accept="image/*"
                  style="display: inline-block; margin-right: 10px;"
                >
                  <el-button icon="Picture" circle size="small"></el-button>
                </el-upload>
                <!-- File Upload -->
                <el-upload
                  action="#"
                  :http-request="uploadFile"
                  :show-file-list="false"
                  style="display: inline-block;"
                >
                  <el-button icon="Folder" circle size="small"></el-button>
                </el-upload>
                <!-- Emoji Picker Toggle -->
                <el-button class="emoji-toggle" circle size="small" @click="toggleEmoji">😀</el-button>
              </div>
              <!-- Emoji Picker Panel -->
              <div v-if="showEmojiPicker" class="emoji-panel">
                <span
                  v-for="em in emojis"
                  :key="em"
                  class="emoji-item"
                  @click="addEmoji(em)"
                >{{ em }}</span>
              </div>
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="3"
                placeholder="请输入消息，按 Enter 发送"
                @keyup.enter.native="handleSend"
              />
              <div class="send-btn">
                <el-button type="primary" size="small" @click="handleSend">发送</el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-empty description="请选择一个联系人开始聊天" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { listUser, listHistory, sendMessage } from "@/api/ai/chat";
import { getToken } from "@/utils/auth";
import request from "@/utils/request";
import useUserStore from "@/store/modules/user";
import { getCurrentInstance, nextTick, onMounted, onBeforeUnmount, ref, reactive } from "vue";
import { parseTime } from "@/utils/ruoyi";

const { proxy } = getCurrentInstance();
const userStore = useUserStore();
const currentUserId = userStore.id;

const userList = ref([]);
const currentChatUser = ref(null);
const messageList = ref([]);
const inputMessage = ref("");
const scrollRef = ref(null);
const showEmojiPicker = ref(false);
const emojis = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","🙄",
  "😢","😭","😡","👍","👎","🙏","👏","💪","🎉","🔥",
  "🌟","💯","✅","❌","🧠","🫶","😇","😉","🤝","🫡"
];

// WebSocket related
let socket = null;
let stompClient = null;

function initWebSocket() {
  if (stompClient != null) {
    stompClient.deactivate();
  }
  connectStomp();
}

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function connectStomp() {
  const base = import.meta.env.VITE_APP_BASE_API || "";
  const factory = () => new SockJS(base + "/ws");
  stompClient = new Client({
    webSocketFactory: factory,
    connectHeaders: {
      Authorization: getToken() ? "Bearer " + getToken() : ""
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      stompClient.subscribe("/user/queue/chat", (response) => {
        if (response.body) {
          const msg = JSON.parse(response.body);
          handleReceiveMessage(msg);
        }
      });
    },
    onStompError: (frame) => {
      console.error("STOMP error", frame);
    }
  });
  stompClient.activate();
}

function handleReceiveMessage(msg) {
  // If current chat is with the sender
  if (currentChatUser.value && (msg.senderId === currentChatUser.value.userId || msg.receiverId === currentChatUser.value.userId)) {
    messageList.value.push(msg);
    scrollToBottom();
  } else {
    // Increment unread count for that user
    const user = userList.value.find(u => u.userId === msg.senderId);
    if (user) {
      user.unreadCount = (user.unreadCount || 0) + 1;
    }
  }
}

function getUsers() {
  listUser().then(res => {
    userList.value = res.data.map(u => ({ ...u, unreadCount: 0 }));
  });
}

function selectUser(user) {
  currentChatUser.value = user;
  user.unreadCount = 0;
  loadHistory(user.userId);
}

function loadHistory(userId) {
  listHistory(userId).then(res => {
    const list = Array.isArray(res.data) ? res.data.slice() : [];
    list.sort((a, b) => {
      const ta = new Date(a.createTime).getTime();
      const tb = new Date(b.createTime).getTime();
      return ta - tb;
    });
    messageList.value = list;
    scrollToBottom();
  });
}

function handleSend() {
  if (!inputMessage.value.trim()) return;
  const msg = {
    receiverId: currentChatUser.value.userId,
    content: inputMessage.value,
    msgType: '0'
  };
  sendMessage(msg).then(res => {
    // Add to list immediately (or wait for WS? Usually add immediately for UX)
    // The backend echoes it back via WS? No, convertAndSendToUser sends to Receiver.
    // So sender needs to add it manually.
    messageList.value.push({
      ...msg,
      senderId: currentUserId,
      createTime: new Date().toISOString() // approximation
    });
    inputMessage.value = "";
    showEmojiPicker.value = false;
    scrollToBottom();
  });
}

// Upload handlers
// We need to use the CommonController upload endpoint

function uploadImage(param) {
  const formData = new FormData();
  formData.append("file", param.file);
  // Using direct axios or request helper for upload
  request({
    url: '/common/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => {
    if (res.code === 200) {
      sendMediaMessage(res.url, '1');
    }
  });
}

function uploadFile(param) {
  const formData = new FormData();
  formData.append("file", param.file);
  request({
    url: '/common/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => {
    if (res.code === 200) {
      sendMediaMessage(res.url, '2'); // 2 for file
    }
  });
}

function sendMediaMessage(url, type) {
  const msg = {
    receiverId: currentChatUser.value.userId,
    content: url,
    msgType: type
  };
  sendMessage(msg).then(res => {
    messageList.value.push({
      ...msg,
      senderId: currentUserId,
      createTime: new Date().toISOString()
    });
    scrollToBottom();
  });
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  });
}

function toggleEmoji() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function addEmoji(em) {
  inputMessage.value = (inputMessage.value || "") + em;
}

onMounted(() => {
  getUsers();
  initWebSocket();
});

onBeforeUnmount(() => {
  if (stompClient) {
    stompClient.deactivate();
  }
});
</script>

<style scoped lang="scss">
.chat-container {
  height: calc(100vh - 84px);
  padding: 10px;
  background-color: #f0f2f5;

  .user-list-card {
    height: 100%;
    overflow-y: auto;
    
    .user-list {
      .user-item {
        padding: 10px;
        display: flex;
        align-items: center;
        cursor: pointer;
        &:hover {
          background-color: #f5f7fa;
        }
        &.active {
          background-color: #e6f7ff;
        }
        .user-name {
          margin-left: 10px;
          flex: 1;
        }
      }
    }
  }

  .chat-window-card {
    height: 100%;
    
    .chat-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .chat-header {
        padding: 15px;
        border-bottom: 1px solid #ebeef5;
        font-weight: bold;
      }
      
      .chat-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background-color: #fff;
        
        .message-item {
          margin-bottom: 15px;
          display: flex;
          
          &.message-mine {
            flex-direction: row-reverse;
            
            .message-bubble {
              background-color: #95ec69;
              color: #000;
            }
            .message-time {
              text-align: right;
            }
          }
          
          .message-content-wrapper {
            max-width: 70%;
            
            .message-time {
              font-size: 12px;
              color: #999;
              margin-bottom: 5px;
            }
            
            .message-bubble {
              padding: 10px;
              background-color: #f4f4f5;
              border-radius: 4px;
              word-break: break-all;
              
              .file-link {
                color: #409eff;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 5px;
              }
            }
          }
        }
      }
      
      .chat-input {
        padding: 15px;
        border-top: 1px solid #ebeef5;
        
        .toolbar {
          margin-bottom: 10px;
        }
        
        .send-btn {
          text-align: right;
          margin-top: 10px;
        }
        .emoji-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 4px;
          border: 1px solid #ebeef5;
          border-radius: 4px;
          background: #fff;
          margin-bottom: 10px;
          .emoji-item {
            cursor: pointer;
            font-size: 20px;
            line-height: 24px;
            user-select: none;
          }
        }
      }
    }
    
    .empty-state {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
