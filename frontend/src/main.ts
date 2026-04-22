import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import './style.css';
import { useUserStore } from './store/userStore';
import { onAuthFailure } from './apis/extension/api/request';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

const userStore = useUserStore()
userStore.loadUser()

onAuthFailure(() => {
  userStore.logout()
  router.push('/login')
})

app.use(router);
app.use(ElementPlus);

app.mount('#app');
