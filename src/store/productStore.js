// src/store/productStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref([
    {
      id: 1,
      title: 'Smartphone',
      description: 'Latest Android smartphone.',
      price: 799,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: 2,
      title: 'Earbuds',
      description: 'Noise cancelling wireless earbuds.',
      price: 149,
      imageUrl: 'https://via.placeholder.com/150'
    },
    // ... 생략
  ])

  function addProduct(product) {
    product.id = Date.now() // 고유 id 부여
    products.value.push(product)
  }

  return { products, addProduct }
})
