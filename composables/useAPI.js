// export function useAPI() {
//   const loadingGetApi = ref(false)

//   const getData = async (endpoint, options = {}) => {

//     loadingGetApi.value = true
//     const { data, error } = await useFetch(endpoint, options)
//     loadingGetApi.value = false
//     return { data, error, loadingGetApi }
//   }

//   return { getData }
// }

export function useAPI () {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.baseUrl
  
  const loadingGetApi = ref(false)
  const loadingPostApi = ref(false)
  const loadingDeleteApi = ref(false)

  // Create full URL with API base URL
  const createApiUrl = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${apiBaseUrl}${cleanEndpoint}`
  }

  const getData = async (endpoint, options = {}) => {
    loadingGetApi.value = true

    try {
      const url = createApiUrl(endpoint)
      const data = await $fetch(url, options)
      return { data }
    } catch (error) {
      console.error('Error GET data:', error)
      return { data: null, error: error.message }
    } finally {
      loadingGetApi.value = false
    }
  }

  const getDataServerSide = async (endpoint, options = {}) => {
    loadingGetApi.value = true
    const url = createApiUrl(endpoint)
    const { data, error } = await useFetch(url, options)
    loadingGetApi.value = false
    return { data, error }
  }

  const postData = async (endpoint, payload, options = {}) => {
    loadingPostApi.value = true

    try {
      const url = createApiUrl(endpoint)
      const data = await $fetch(url, {
        method: 'POST',
        body: payload,
        ...options
      })
      return { data }
    } catch (error) {
      console.error('Error POST data:', error)
      return { data: null, error: error.message }
    } finally {
      loadingPostApi.value = false
    }
  }

  const updateData = async (endpoint, payload, options = {}) => {
    loadingPostApi.value = true

    try {
      const url = createApiUrl(endpoint)
      const data = await $fetch(url, {
        method: 'PUT',
        body: payload,
        ...options
      })
      return { data }
    } catch (error) {
      console.error('Error UPDATE data:', error)
      return { data: null, error: error.message }
    } finally {
      loadingPostApi.value = false
    }
  }

  const deleteData = async (endpoint, options = {}) => {
    loadingDeleteApi.value = true

    try {
      const url = createApiUrl(endpoint)
      const response = await $fetch(url, {
        method: 'DELETE',
        ...options
      })
      return { data: response }
    } catch (error) {
      console.error('Error deleting data:', error)
      return { data: null, error: error.message }
    } finally {
      loadingDeleteApi.value = false
    }
  }

  return {
    getData,
    loadingGetApi,
    postData,
    updateData,
    deleteData,
    getDataServerSide,
  }
}
