<template>
  <div class="auth-page relative min-h-[100vh] w-full">
    <div class="back-img" :style="`background-image: url(${'images/background-dance-1.jpg'})`"></div>
    <div class="auth-overlay"></div>

    <Transition name="toast">
      <div v-if="showToast" class="auth-toast" role="status">
        <p class="font-bold mb-1">Check your email</p>
        <p>
          Please check your inbox and confirm your signup to complete registration.
          The confirmation email is sent by <strong>Supabase</strong>.
        </p>
        <div class="toast-progress"></div>
      </div>
    </Transition>

    <div class="z-10 absolute inset-0 flex items-center justify-center px-4 py-10">
      <div class="auth-card w-full max-w-[380px]">
        <div class="auth-brand font-days text-center mb-6">
          DANCE BABY RADIO
        </div>
        <h2 class="text-white text-center text-[18px] font-bold mb-1">Sign up</h2>
        <p class="text-center text-[13px] text-[#b8eef5] opacity-80 mb-6">
          Create an account with your email and password
        </p>

        <Form
          @submit="handleRegister"
          :validation-schema="schema"
          class="text-white text-[14px] text-left"
          dir="ltr"
        >
          <div class="my-input mb-4">
            <label class="text-left mb-2 block">Email</label>
            <Field
              name="email"
              type="email"
              autocomplete="email"
              placeholder="example@email.com"
              class="w-full py-3 px-3 rounded-lg"
            />
            <ErrorMessage name="email" class="text-[12px] text-[#ff6b8a] mt-1 block" />
          </div>

          <div class="my-input mb-4">
            <label class="text-left mb-2 block">Password</label>
            <Field
              name="password"
              type="password"
              autocomplete="new-password"
              class="w-full py-3 px-3 rounded-lg"
            />
            <ErrorMessage name="password" class="text-[12px] text-[#ff6b8a] mt-1 block" />
          </div>

          <div class="my-input mb-4">
            <label class="text-left mb-2 block">Confirm password</label>
            <Field
              name="repeatPassword"
              type="password"
              autocomplete="new-password"
              class="w-full py-3 px-3 rounded-lg"
            />
            <ErrorMessage name="repeatPassword" class="text-[12px] text-[#ff6b8a] mt-1 block" />
          </div>

          <p v-if="authError" class="text-[13px] text-[#ff6b8a] text-center mb-3 leading-relaxed">
            {{ authError }}
          </p>

          <button
            type="submit"
            :disabled="loading || showToast"
            class="auth-btn w-full h-[50px] font-bold text-[17px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Creating account...' : 'Sign up' }}
          </button>

          <div class="mt-5 text-center">
            <NuxtLink to="/login" class="text-[#84f3ff] hover:opacity-70 text-[14px] transition-opacity">
              Already have an account? Sign in
            </NuxtLink>
          </div>
        </Form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

definePageMeta({
  layout: 'simple',
})

const router = useRouter()
const { signUp, loading, authError, clearAuthError } = useSupabase()
const showToast = ref(false)
let toastTimer = null

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

const schema = yup.object({
  email: yup
    .string()
    .required('Please enter your email.')
    .email('Please enter a valid email.'),
  password: yup
    .string()
    .required('Please enter your password.')
    .min(6, 'Password must be at least 6 characters.'),
  repeatPassword: yup
    .string()
    .required('Please confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
})

const handleRegister = async (values) => {
  clearAuthError()
  showToast.value = false
  if (toastTimer) clearTimeout(toastTimer)

  const { error } = await signUp({
    email: values.email,
    password: values.password,
  })

  if (error) {
    return
  }

  showToast.value = true

  toastTimer = setTimeout(async () => {
    showToast.value = false
    await router.push('/login')
  }, 10000)
}
</script>

<style scoped>
.back-img {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  z-index: 0;
  filter: blur(8px);
}

.auth-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    160deg,
    rgba(8, 24, 32, 0.55) 0%,
    rgba(4, 16, 22, 0.72) 100%
  );
}

.auth-card {
  position: relative;
  z-index: 2;
  padding: 28px 24px;
  background: rgba(8, 40, 44, 0.55);
  border: 1px solid rgba(132, 243, 255, 0.18);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  animation: auth-in 0.45s ease-out;
}

.auth-brand {
  color: #94d4e3;
  font-size: 26px;
  letter-spacing: 1px;
}

.auth-btn {
  background: rgba(132, 243, 255, 0.28);
  color: #fff;
  transition: background 0.25s ease, transform 0.2s ease;
}

.auth-btn:hover:not(:disabled) {
  background: rgba(132, 243, 255, 0.75);
  transform: translateY(-1px);
}

.my-input :deep(input) {
  background: rgba(16, 25, 26, 0.72);
  color: #fff;
  border: 1px solid rgba(132, 243, 255, 0.15);
  outline: none;
  transition: border-color 0.2s ease;
}

.my-input :deep(input:focus) {
  border-color: rgba(132, 243, 255, 0.55);
}

.my-input :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}

.auth-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: calc(100% - 32px);
  max-width: 420px;
  padding: 16px 18px 14px;
  background: rgba(6, 28, 34, 0.95);
  border: 1px solid rgba(132, 243, 255, 0.35);
  border-radius: 12px;
  color: #e8fbff;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.toast-progress {
  margin-top: 12px;
  height: 3px;
  border-radius: 999px;
  background: rgba(132, 243, 255, 0.85);
  transform-origin: left center;
  animation: toast-progress 10s linear forwards;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@keyframes auth-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
