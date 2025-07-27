<template>
  <div class="login relative min-h-[100vh] w-full">
    <div class="back-img" :style="`background-image: url(${'images/background-dance-1.jpg'})`"></div>
    <div class="z-10 absolute h-full w-full">
      <div class="relative h-full w-full">
        <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <div class="inputs-login-wrap">
            <Form @submit="handleLogin" :validation-schema="schema" class="text-white text-[14px] text-right" dir="rtl">
              <div class="my-input min-w-[300px] mb-3">
                <div class="farsi text-right mb-2">
                  نام کاربری
                </div>
                <Field name="username" class="w-full py-2 px-3 rounded-lg farsi" />
                <ErrorMessage name="username" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  رمز عبور
                </div>
                <Field name="password" type="password" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="password" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <button
                :disabled="loadingPostApi"
                class="w-full h-[50px] bg-[#84f3ff45] hover:bg-[#84f3ff] farsi font-bold text-[17px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {{ loadingPostApi ? 'در حال ورود...' : 'ورود' }}
              </button>
              
              <div class="mt-4 text-center">
                <NuxtLink to="/register" class="farsi text-[#84f3ff] hover:text-[#84f3ff80] text-[14px]">
                  حساب کاربری ندارید؟ ثبت نام کنید
                </NuxtLink>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAPI } from "@/composables/useAPI"
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';

definePageMeta({
  layout: "simple"
})

const router = useRouter()

const {
  getData,
  postData,
  updateData,
  deleteData,
  getDataServerSide,
  loadingGetApi,
  loadingPostApi,
  loadingDeleteApi
} = useAPI()

const schema = yup.object({
  username: yup.string().required("لطفن نام کاربری خود را وارد کنید."),
  password: yup.string().required("لطفن رمز عبور خود را وارد کنید.").min(5, "رمز عبور باید حداقل 5 کاراکتر باشد."),
});

const config = useRuntimeConfig()

const handleLogin = async (values) => {
  try {
    console.log('Login attempt with values:', values);
    const response = await postData(`${config.public.baseUrl}/api/auth/login`, values);
    
    if (response.data && response.data.token) {
      // Save token to localStorage
      localStorage.setItem('authToken', response.data.token);
      
      // Save user data if provided
      if (response.data.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      console.log('Login successful, token saved');
      
      // Navigate to home page
      await router.push('/');
    } else {
      console.error('Login failed: No token received');
      alert('خطا در ورود. لطفن دوباره تلاش کنید.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('خطا در ورود: ' + (error.message || 'لطفن دوباره تلاش کنید.'));
  }
};
</script>

<style scoped>
.back-img {
  position: absolute;
  background-position: center;
  background-size: cover;
  width: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;
      filter: blur(8px);
    -webkit-filter: blur(8px);
}
</style>