<script lang="ts">
    export let products: any[] = [];
</script>

{#if products.length > 0}
    <ul class="product-list">
        {#each products as product}
            <li class="product-card">
                <img
                    src={product.thumbnail}
                    alt={product.title}
                    class="product-image"
                />
                <div class="product-info">
                    <h2 class="product-title">{product.title}</h2>
                    <p class="product-description">{product.description}</p>
                </div>
            </li>
        {/each}
    </ul>
{:else}
    <p class="no-products">Keine Produkte gefunden.</p>
{/if}
