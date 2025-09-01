<template>
  <div class="register-admin relative min-h-[100vh] w-full">
    <div class="back-img" :style="`background-image: url(${'images/background-dance-1.jpg'})`"></div>
    <div class="z-10 absolute h-full w-full">
      <div class="relative h-full w-full">
        <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <div class="inputs-login-wrap">
            <Form @submit="createAdminUser" :validation-schema="schema" class="text-white text-[14px] text-right" dir="rtl">
              <div class="my-input min-w-[300px] mb-3">
                <div class="farsi text-right mb-2">
                  نام کاربری
                </div>
                <Field name="username" class="w-full py-2 px-3 rounded-lg farsi" />
                <ErrorMessage name="username" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  ایمیل
                </div>
                <Field name="email" type="email" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="email" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  رمز عبور
                </div>
                <Field name="password" type="password" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="password" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  تکرار رمز عبور
                </div>
                <Field name="repeatPassword" type="password" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="repeatPassword" class="farsi text-[12px] text-[#c81543]" />
              </div>
              
              <div class="my-input mb-10">
                <div class="farsi text-right mb-2">
                  رمز عبور ادمین
                </div>
                <Field name="adminPassword" type="password" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="adminPassword" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <button
                :disabled="loadingPostApi"
                class="w-full h-[50px] bg-[#84f3ff45] hover:bg-[#84f3ff] farsi font-bold text-[17px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {{ loadingPostApi ? 'در حال ثبت نام...' : 'ثبت نام ادمین' }}
              </button>
              
              <div class="mt-4 text-center">
                <NuxtLink to="/login" class="farsi text-[#84f3ff] hover:text-[#84f3ff80] text-[14px]">
                  قبلاً ثبت نام کرده‌اید؟ وارد شوید
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
  username: yup.string().required("لطفن یک نام کاربری برای خودت انتخاب کن."),
  email: yup.string().email("لطفن ایمیل رو صحیح وارد کن").required("لطفن ایمیل خود را وارد کنید."),
  password: yup.string().required("لطفن رمز عبور تا 5 رقم انتخاب کن.").min(5, "لطفن رمز عبور رو تا 5 رقم انتخاب کن."),
  repeatPassword: yup.string()
    .required("برای اطمینان رمز عبورت رو تکرار کن.")
    .oneOf([yup.ref('password'), null], "رمز عبورها یکی نیست."),
  adminPassword: yup.string().required("لطفن رمز عبور ادمین را وارد کنید.").min(1, "رمز عبور ادمین الزامی است."),
});

const config = useRuntimeConfig()

function createAdminUser(data) {
  // Remove repeatPassword from the data before sending to backend
  const { repeatPassword, ...adminData } = data;
  
  console.log('Sending admin user data:', adminData);

  postData('/api/auth/register-admin', adminData).then((response) => {
    console.log('Admin registration successful:', response)
    alert('ثبت نام ادمین با موفقیت انجام شد!')
    // Redirect to login page after successful registration
    router.push('/login')
  }).catch((err) => {
    console.error('Admin registration error:', err)
    alert('خطا در ثبت نام ادمین: ' + (err.message || 'لطفن دوباره تلاش کنید.'))
  })
}
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
