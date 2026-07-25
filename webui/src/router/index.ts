import { createRouter, createWebHashHistory } from 'vue-router/auto';

const router = createRouter({
  history: createWebHashHistory(),
});

router.beforeEach((to) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn.value && to.path !== '/login') {
    return { name: 'Login' };
  } else if (isLoggedIn.value && to.path === '/login') {
    return { name: 'Index' };
  }
});

export { router };
