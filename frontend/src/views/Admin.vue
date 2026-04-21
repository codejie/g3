<template>
  <div class="admin-container">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="logo">管理后台</div>
        <el-menu>
          <el-menu-item index="1">用户管理</el-menu-item>
          <el-menu-item index="2">日志查看</el-menu-item>
          <el-menu-item index="3">系统配置</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <h2>管理面板</h2>
        <p>系统管理功能区域</p>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.admin-container {
  height: var(--app-height, 100vh);
  display: flex;
}

.sidebar {
  background: #1e3a5f;
  color: #fff;
  height: 100%;
}

.logo {
  padding: 20px;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.el-container {
  height: 100%;
}
</style>
