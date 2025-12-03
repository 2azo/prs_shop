<script lang="ts">
  import { onMount } from "svelte";
  import ProductCard from "./lib/ProductCard.svelte";

  let products: any[] = [];

  // publishable API key
  const PUBLISHABLE_API_KEY =
    "pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea";
  const REGION_ID = "reg_01KA94WK5BH4BEDW4GS6G49V4G";

  const API_URL = "http://localhost:9000/";

  let cartId: string | null = null;

  // when the page loads
  onMount(() => {
    // check if cart id exists in localStorage
    cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      createCart();
    } else {
      console.log("Cart ID found in localStorage:", cartId);
      getCart(cartId);
    }

    fetchProducts();
  });

  function createCart() {
    fetch(API_URL + "store/carts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // store cart id in localStorage
        localStorage.setItem("cart_id", data.cart.id);
        cartId = data.cart.id;
        console.log("New cart created with ID:", data.cart.id);
        console.log(data);
      })
      .catch((error) => {
        console.error("Error creating cart:", error);
      });
  }

  function getCart(cartId: string) {
    // curl
    // curl '{backend_url}/store/carts/{id}' \ -H 'x-publishable-api-key: {your_publishable_api_key}'

    fetch(`${API_URL}store/carts/${cartId}`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Cart data:", data);
      })
      .catch((error) => {
        console.error("Error fetching cart:", error);
      });
  }

  async function fetchProducts() {
    // curl
    // fetching products (GET /store/products) -> remember to add the storefront url to Medusa .env file (STORE CORS)
    // curl -H "x-publishable-api-key: pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea" http://localhost:9000/store/products
    // adding fields=*variants.calculated_price&region_id=reg_xxx to get prices
    // curl
    /*
    GET /store/products?fields=*variants.calculated_price&region_id=reg_xxx
    x-publishable-api-key: <your-publishable-key>
    */

    try {
      const response = await fetch(
        API_URL +
          `store/products?fields=*variants.calculated_price&region_id=${REGION_ID}`,
        {
          headers: {
            "x-publishable-api-key": PUBLISHABLE_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      products = data.products;
      console.log(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  async function updateCart(
    cartId: string | null,
    update: string,
    variantId: string
  ) {
    // adding a product to cart
    // POST /store/carts/{id}/line-items
    /* 
    curl -X POST '{backend_url}/store/carts/{id}/line-items' \
    -H 'Content-Type: application/json' \
    -H 'x-publishable-api-key: {your_publishable_api_key}' \
    --data-raw '{
      "variant_id": "{value}",
      "quantity": 3360689747918848,
      "metadata": {}
    }'
    */
    if (!cartId) {
      console.error("No cart ID provided.");
      return;
    }
    if (update === "add") {
      fetch(`${API_URL}store/carts/${cartId}/line-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Product added to cart:", data);
        })
        .catch((error) => {
          console.error("Error adding product to cart:", error);
        });
    }
  }
</script>

<main class="product-page">
  <h1>Produkte</h1>

  {#if products.length > 0 && cartId}
    <ul class="product-list">
      {#each products as product}
        <ProductCard 
        product={product}
        updateCart={updateCart}
        cartId={cartId}
        />
      {/each}
    </ul>
  {:else}
    <p class="no-products">Keine Produkte oder Warenkorb gefunden.</p>
  {/if}

  <!-- <h1>Summe</h1> -->

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
