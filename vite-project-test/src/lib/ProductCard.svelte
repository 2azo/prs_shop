<script lang="ts">
  import type { Update } from "vite/types/hmrPayload.js";
  import type { UpdateCartParams } from "../main";

  export let product: any;
  export let updateCart: (params: UpdateCartParams) => void;
  export let cartId: string | null;
  //   console.log("Product in ProductCard:", product);

  let currentImageIndex = 0;

  $: images = product.images || [];
  $: currentImage = images.length > 0 ? images[currentImageIndex] : null;

  const nextImage = () => {
    if (images.length > 1) {
      currentImageIndex = (currentImageIndex + 1) % images.length;
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      currentImageIndex =
        (currentImageIndex - 1 + images.length) % images.length;
    }
  };

  let selectedVariantId: string | null = null;
  function handleClick(variantId: string) {
    if (selectedVariantId === variantId) {
      // Deselect if the same variant is clicked
      selectedVariantId = null;
      return;
    }
    selectedVariantId = variantId;
    console.log("the variant chosen is:", variantId);
  }
</script>

<li class="product-card">
  <div class="image-container">
    {#if currentImage}
      <img src={currentImage.url} alt={product.title} class="product-image" />
      {#if images.length > 1}
        <button class="nav-btn prev" on:click={prevImage}>&lt;</button>
        <button class="nav-btn next" on:click={nextImage}>&gt;</button>
        <div class="dots">
          {#each images as _, i}
            <span class="dot" class:active={i === currentImageIndex}></span>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="no-image">No Image</div>
    {/if}
  </div>

  <div class="product-info">
    <h2 class="product-title">{product.title}</h2>
    <p class="product-description">{product.description}</p>

    <div class="product-variants">
      <h3>Variations</h3>
      <div class="variant-buttons">
        {#each product.variants as variant}
          <!-- if clicked, make it blue -->
          <button
            class="variant-btn {selectedVariantId === variant.id
              ? 'selected-variant'
              : ''}"
            type="button"
            on:click={() => handleClick(variant.id)}
          >
            <span class="variant-title">{variant.title}</span>
            {#if variant.prices && variant.prices.length > 0}
              <span class="variant-price">
                {variant.prices[0].amount / 100}
                {variant.prices[0].currency_code.toUpperCase()}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="variant-price">
      <h3>Price:</h3>
      {#if product.variants && product.variants.length > 0}
        {#each product.variants as variant (variant.id)}
          {#if selectedVariantId === variant.id}
            <span>
              {variant.calculated_price.calculated_amount}
              {variant.calculated_price.currency_code.toUpperCase()}
            </span>
          {/if}
        {/each}
      {/if}
    </div>

    <!-- disable clicking if no variant is selected -->
    <div class="add-to-cart" class:disabled={!selectedVariantId}>
      <button
        disabled={!selectedVariantId}
        on:click={() =>
          updateCart({ cartId, action: "add", variantId: selectedVariantId! })}
      >
        In den Warenkorb
      </button>
    </div>
  </div>
</li>

<style>
  :root {
    --main-orange: #faa61a;
    --light-orange: rgba(250, 168, 26, 0.2);
    --light-grey: #a5aeb4;
    --dark-grey: #6f7c84;
    --white: #ffffff;
    --black: #111827;
  }
  .product-card {
    background: var(--white);
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .image-container {
    position: relative;
    width: 100%;
    padding-top: 100%; /* 1:1 Aspect Ratio */
    background-color: var(--light-grey);
    overflow: hidden;
  }

  .product-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    color: #333;
    opacity: 0;
    transition:
      opacity 0.2s,
      background 0.2s;
    z-index: 2;
  }

  .image-container:hover .nav-btn {
    opacity: 1;
  }

  .nav-btn:hover {
    background: white;
  }

  .prev {
    left: 10px;
  }
  .next {
    right: 10px;
  }

  .dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
    z-index: 2;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transition: background 0.2s;
  }

  .dot.active {
    background: white;
  }

  .product-info {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .product-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .product-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.5;
    flex-grow: 1;
  }

  .product-variants h3,
  .variant-price h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .variant-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .variant-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--white);
    border: 1px solid var(--main-orange);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 80px;
  }

  .variant-btn:hover {
    border-color: var(--white);
    background: var(--light-orange);
  }

  .variant-btn.selected-variant {
    border-color: var(--white);
    background: var(--main-orange);
  }

  .add-to-cart button {
    margin-top: 1.5rem;
    text-align: center;
    padding: 0.5rem 0.75rem;
    background: var(--light-orange);
    border: 1px solid var(--main-orange);
    color: var(--black);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 80px;
  }

  .add-to-cart button:hover {
    background: var(--main-orange);
    color: var(--white);
  }

  .add-to-cart button:disabled {
    background: var(--light-grey);
    color: var(--dark-grey);
    cursor: not-allowed;
  }

  .variant-title,
  .variant-price span {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .variant-price {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 2rem;
  }
</style>
