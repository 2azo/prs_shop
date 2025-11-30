<script lang="ts">
  import { onMount } from "svelte";
  import ProductCard from "./lib/ProductCard.svelte";

  // publishable API key
  const PUBLISHABLE_API_KEY =
    "pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea";
    
  const API_URL = "http://localhost:9000/";

  // fetching products (GET /store/products)
  let products: any[] = [];
  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL + "store/products", {
        headers: {
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      products = data.products;
      console.log(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // curl
  // fetching products (GET /store/products) -> remember to add the storefront url to Medusa .env file (STORE CORS)
  // curl -H "x-publishable-api-key: pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea" http://localhost:9000/store/products
  //
</script>

<main class="product-page">
  <h1>Produkte</h1>
  <button class="fetch-button" on:click={fetchProducts}>Produkte holen</button>

  {#if products.length > 0}
    <ul class="product-list">
      {#each products as product}
        <ProductCard {product} />
      {/each}
    </ul>
  {:else}
    <p class="no-products">Keine Produkte gefunden.</p>
  {/if}
</main>

<style>
  .product-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: "Inter", sans-serif;
  }

  h1 {
    text-align: center;
    color: #111827;
    margin-bottom: 2rem;
  }

  .fetch-button {
    display: block;
    margin: 0 auto 2rem;
    padding: 0.75rem 1.5rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .fetch-button:hover {
    background-color: #2563eb;
  }

  .product-list {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .no-products {
    text-align: center;
    color: #6b7280;
    font-size: 1.1rem;
  }
</style>
