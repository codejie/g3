<template>
  <div class="home-container">
    <el-container>
      <el-aside width="260px" class="sidebar">
        <div class="logo">G3</div>
        <el-menu>
          <el-menu-item index="1">会话列表</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <div class="chat-area">
          <div class="messages">
            <p>欢迎使用 G3</p>
          </div>
          <div class="input-area">
            <el-input
              v-model="message"
              type="textarea"
              placeholder="输入消息..."
              :rows="3"
            />
            <el-button type="primary" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('');

const sendMessage = () => {
  console.log('Send:', message.value);
  message.value = '';
};
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.sidebar {
  background: #2c3e50;
  color: #fff;
}

.logo {
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}

.main-content {
  background: #f5f5f5;
}

.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.input-area {
  padding: 20px;
  display: flex;
  gap: 10px;
}
</style>
