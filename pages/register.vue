<template>
  <div class="register relative min-h-[100vh] w-full">
    <div class="back-img" :style="`background-image: url(${'images/background-dance-1.jpg'})`"></div>
    <div class="z-10 absolute h-full w-full">
      <div class="relative h-full w-full">
        <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <div class="inputs-login-wrap">
            <Form @submit="createUser" :validation-schema="schema" class="text-white text-[14px] text-right" dir="rtl">
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
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  تکرار رمز عبور
                </div>
                <Field name="repeatPassword" type="password" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="repeatPassword" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <div class="my-input mb-3">
                <div class="farsi text-right mb-2">
                  موبایل (اختیاری)
                </div>
                <Field name="mobile" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="mobile" class="farsi text-[12px] text-[#c81543]" />
              </div>
              <!-- <div class="my-input mb-10">
                <div class="farsi text-right mb-2">
                  ایمیل
                </div>
                <Field name="email" class="w-full py-2 px-3 rounded-lg" />
                <ErrorMessage name="email" class="farsi text-[12px] text-[#c81543]" />
              </div> -->
              <button
                class="w-full h-[50px] bg-[#84f3ff45] hover:bg-[#84f3ff] farsi font-bold text-[17px] rounded-xl">ثبت
                نام</button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAPI } from "@/composables/useAPI"
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';

definePageMeta({
  layout: "simple"
})

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
  password: yup.string().required("لطفن رمز عبور تا 5 رقم انتخاب کن.").min(5, "لطفن رمز عبور رو تا 5 رقم انتخاب کن."),
  repeatPassword: yup.string()
    .required("برای اطمینان رمز عبورت رو تکرار کن.")
    .oneOf([yup.ref('password'), null], "رمز عبورها یکی نیست."),
  mobile: yup.string().matches(/^09\d{9}$/, 'لطفن شماره موبایل رو صحیح وارد کن.'),
  // email: yup.string().email("لطفن ایمیل رو صحیح وارد کن"),
});

const config = useRuntimeConfig()

function createUser(data) {
  // Remove repeatPassword from the data before sending to backend
  const { repeatPassword, ...userData } = data;
  
  console.log('Sending user data:', userData);

  postData(`${config.public.baseUrl}/api/auth/register`, userData).then((response) => {
    console.log(response)
    // You can add success handling here, like redirecting to login
  }).catch((err) => alert(err))
}

function getUsers() {

  // getData(`${config.public.baseUrl}/api/users`)
  getData(`${config.public.baseUrl}/api/users`)
}

onMounted(async () => {
  getUsers()
})
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