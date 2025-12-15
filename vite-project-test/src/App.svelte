<script lang="ts">
  import { onMount } from "svelte";
  import ProductCard from "./lib/ProductCard.svelte";
  import type { UpdateCartParams } from "./main";

  let products: any[] = [];

  // publishable API key - Medusa
  const PUBLISHABLE_API_KEY =
    "pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea";
  const REGION_ID = "reg_01KA94WK5BH4BEDW4GS6G49V4G";

  // path to backend server - Medusa
  const API_URL = "http://localhost:9000/";

  // Stripe public key
  const STRIPE_PUBLIC_KEY =
    "pk_test_51SaNuj4tfJBc4SjuVHvVgMXBnJP8uFW1h0GNvmiyPhGeINwKJXoKL5CdEAK1CdIaUSEHDqfONOdEs6M78GMx4wG3004ZUdxQRS";

  // admin email
  const ADMIN_EMAIL = "mouaz.allahham@martini-werbeagentur.de";

  import { loadStripe } from "@stripe/stripe-js";

  let stripe: any = null;
  let elements: any = null;
  let card: any = null;

  let cartId: string | null = null;
  let cart: any = null;
  let paymentCollectionId: string | null = null;
  let clientSecret: string | null = null;

  let showModal = false;
  let showPaymentModal = false;
  let loading = false;

  /* 
  Checkout logic (+ Stripe) source: 
  https://docs.medusajs.com/resources/storefront-development/checkout/payment/stripe#3-create-stripe-component
  */

  onMount(async () => {
    loading = true;
    console.log("onMount called");

    // check if cart id exists in localStorage
    cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      await createCart();
    } else {
      console.log("Cart ID found in localStorage:", cartId);
      await getCart(cartId);
    }

    // await createPaymentCollection(cartId!);

    await fetchProducts();

    // // initialize Stripe
    // stripe = await loadStripe(STRIPE_PUBLIC_KEY);
    // console.log("Stripe initialized:", stripe);
    loading = false;
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

    // adding the method (post/get) and headers
    fetch(`${API_URL}store/carts/${cartId}?fields=+payment_collection`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        cart = data.cart;
        console.log("Cart data:", cart);
        console.log("cart data at a tree");
        console.dir(data);
      })
      .catch((error) => {
        console.error("Error fetching cart:", error);
      });
  }

  async function createPaymentCollection(cartId: string): Promise<string> {
    // curl
    /*
    curl -X POST '{backend_url}/store/payment-collections' \
    -H 'Content-Type: application/json' \
    -H 'x-publishable-api-key: {your_publishable_api_key}' \
    --data-raw '{
      "cart_id": "{value}"
    }'
    */

    try {
      const response = await fetch(`${API_URL}store/payment-collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
        body: JSON.stringify({
          cart_id: cartId,
        }),
      });

      const data = await response.json();
      console.log("Payment collection created:", data);
      paymentCollectionId = data.payment_collection.id;
      console.log("Payment Collection ID:", data.payment_collection.id);

      return await initializePaymentSession();
    } catch (error) {
      console.error("Error creating payment collection:", error);
      throw error;
    }
  }

  async function initializePaymentSession(): Promise<string> {
    // curl
    /*
    curl -X POST '{backend_url}/store/payment-collections/{id}/payment-sessions' \
    -H 'Content-Type: application/json' \
    -H 'x-publishable-api-key: {your_publishable_api_key}' \
    --data-raw '{
      "provider_id": "{value}"
    }'
    */
    console.log(
      "Initializing payment session for collection ID:",
      paymentCollectionId
    );

    try {
      const response = await fetch(
        `${API_URL}store/payment-collections/${paymentCollectionId}/payment-sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": PUBLISHABLE_API_KEY,
          },
          body: JSON.stringify({
            provider_id: "pp_stripe_stripe",
          }),
        }
      );

      const data = await response.json();
      clientSecret =
        data.payment_collection.payment_sessions[0].data.client_secret;
      console.log("Client Secret:", clientSecret);
      return clientSecret!;
    } catch (error) {
      console.error("Error initializing payment session:", error);
      throw error;
    }
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
      // console.log(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  async function updateCart({
    cartId,
    action,
    variantId,
    itemId,
    billingAddress,
    shippingAddress,
  }: UpdateCartParams) {
    if (!cartId) {
      console.error("No cart ID provided.");
      return;
    }
    if (action === "add") {
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
          cart = data.cart;
          console.log("Product added to cart:", data);
        })
        .catch((error) => {
          console.error("Error adding product to cart:", error);
        });
    } else if (action === "remove") {
      // curl - remove one quantity of a line item from cart
      /*
      curl -X POST '{backend_url}/store/carts/{id}/line-items/{line_id}' \
      -H 'Content-Type: application/json' \
      -H 'x-publishable-api-key: {your_publishable_api_key}' \
      --data-raw '{
        "quantity": 8980402259623936,
        "metadata": {}
      }'
      */
      let quantity = cart.items.find(
        (item: any) => item.variant_id === variantId
      )?.quantity;

      // console.log("Current quantity of item to remove:", quantity);

      if (!quantity || quantity <= 0) {
        console.error("Item not found in cart or quantity is zero.");
        return;
      }

      fetch(`${API_URL}store/carts/${cartId}/line-items/${itemId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
        body: JSON.stringify({
          quantity: quantity - 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          cart = data.cart;
          console.log("Product removed from cart:", data);
        })
        .catch((error) => {
          console.error("Error removing product from cart:", error);
        });
    } else if (action === "update_addresses") {
      let bodyData: any = {};

      if (
        !email ||
        !firstName ||
        !lastName ||
        !billingAddress?.street ||
        !billingAddress?.streetNumber ||
        !billingAddress?.city ||
        !billingAddress?.postalCode ||
        !billingAddress?.country
      ) {
        console.error("please fill in all required address fields");
        return;
      }

      if (billingAddress) {
        // bodyData.billing_address = billingAddress;
        bodyData.billing_address = {};
        if (
          billingAddress.country.toLowerCase() == "germany" ||
          billingAddress.country.toLowerCase() == "de" ||
          billingAddress.country.toLowerCase() == "deutschland"
        ) {
          bodyData.billing_address.country_code = "de";
          // bodyData.billing_address.country = "Deutschland";
        } else {
          alert("Nur Deutschland wird unterstützt.");
        }

        bodyData.billing_address.company = billingAddress.companyName;
        bodyData.billing_address.first_name = firstName;
        bodyData.billing_address.last_name = lastName;
        bodyData.billing_address.address_1 =
          billingAddress.street +
          " " +
          billingAddress.streetNumber +
          ", " +
          billingAddress.city +
          ", " +
          billingAddress.postalCode +
          ", " +
          billingAddress.country;
        bodyData.billing_address.city = billingAddress.city;
        bodyData.billing_address.postal_code = billingAddress.postalCode;
      }
      if (shippingAddress) {
        // bodyData.shipping_address = shippingAddress;
      }

      bodyData.email = email;

      console.log("Updating cart with address data:", bodyData);
      // return;

      fetch(`${API_URL}store/carts/${cartId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
        body: JSON.stringify({
          ...bodyData,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          cart = data.cart;
          console.log("cart updated - checkout info", data);
        })
        .catch((error) => {
          console.error("Error updating cart with address data:", error);
        });
    }
  }

  let firstName: string = "";
  let lastName: string = "";
  let email: string = "";
  let phone: string = "";
  let sameAddress: boolean = true;

  let billingAddress = {
    companyName: "",
    street: "",
    streetNumber: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  };

  let shippingAddress = {
    companyName: "",
    street: "",
    streetNumber: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  };

  async function paymentButton() {
    showPaymentModal = true;
    loading = true;
    console.log("Payment button clicked");
    console.log("Billing Address:", billingAddress);
    const missing = [];

    if (!firstName) missing.push("First name");
    if (!lastName) missing.push("Last name");
    if (!email) missing.push("Email");
    if (!billingAddress.street) missing.push("Street");
    if (
      !billingAddress.streetNumber ||
      isNaN(Number(billingAddress.streetNumber)) ||
      Number(billingAddress.streetNumber) <= 0 ||
      Number(billingAddress.streetNumber) % 1 !== 0 ||
      Number(billingAddress.streetNumber) > 10000
    )
      missing.push("Street number");
    if (!billingAddress.city) missing.push("City");
    if (!billingAddress.postalCode) missing.push("Postal code");
    if (!billingAddress.country) missing.push("Country");

    if (missing.length > 0) {
      alert("Please check the following fields: " + missing.join(", "));
      return;
    }

    if (sameAddress) {
      updateCart({
        cartId: cartId,
        action: "update_addresses",
        billingAddress: {
          companyName: billingAddress.companyName,
          street: billingAddress.street,
          streetNumber: billingAddress.streetNumber,
          city: billingAddress.city,
          postalCode: billingAddress.postalCode,
          country: billingAddress.country,
          phone: billingAddress.phone,
        },
      });
    } else {
      updateCart({
        cartId: cartId,
        action: "update_addresses",
        billingAddress: {
          street: billingAddress.street,
          streetNumber: billingAddress.streetNumber,
          city: billingAddress.city,
          postalCode: billingAddress.postalCode,
          country: billingAddress.country,
          phone: billingAddress.phone,
        },
        shippingAddress: {
          street: shippingAddress.street,
          streetNumber: shippingAddress.streetNumber,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
        },
      });
    }
    console.log("Cart updated with checkout info, proceeding to payment...");
    // the cart is now updated with the checkout information
    // proceed to create payment collection, and

    await createPaymentCollection(cartId!);

    // starting Stripe

    // 1.initialize Stripe
    stripe = await loadStripe(STRIPE_PUBLIC_KEY);
    console.log("Stripe initialized:", stripe);

    // 2.create elements
    // source: https://docs.stripe.com/js/elements_object/create
    // "Use Element instances to collect sensitive information in your checkout flow."

    // console.log("Client secret:", clientSecret);
    const elements = stripe.elements({
      clientSecret: clientSecret!,
    });

    // 3.create card element
    // source: https://docs.stripe.com/js/elements_object/create_element?type=card

    card = elements?.create("card", {
      style: {
        base: {
          fontSize: "16px",
          color: "#32325d",
        },
      },
    });

    // 4.mount card element
    // source: https://docs.stripe.com/js/element/mount
    // "You need to create a container DOM element to mount an Element"

    card.mount("#card-element");

    // confirm card payment
    // resource: https://docs.stripe.com/js/payment_intents/confirm_card_payment

    try {
      await stripe?.confirmCardPayment(clientSecret!, {
        payment_method: {
          card: card!,
          billing_details: {
            name: firstName + " " + lastName,
            email,
            phone,
            address: {
              line1: billingAddress.street + " " + billingAddress.streetNumber,
              city: billingAddress.city,
              postal_code: billingAddress.postalCode,
              country: "DE",
            },
          },
        },
        // return_url: window.location.href, // only if you are handling next actions yourself
        receipt_email: ADMIN_EMAIL,
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
    }

    // stripe
    //   .confirmCardPayment(clientSecret!, {
    //     payment_method: {
    //       card: card!,
    //       billing_details: {
    //         name: "Jenny Rosen",
    //       },
    //     },
    //   })
    //   .then(function (result) {
    //     console.log(result);
    //   });

    // const { error, paymentIntent } = await stripe.confirmCardPayment(
    //   clientSecret!,
    //   {
    //     payment_method: {
    //       card: card!,
    //       billing_details: {
    //         name: `${firstName} ${lastName}`,
    //         email,
    //         phone,
    //         address: {
    //           line1: `${billingAddress.street} ${billingAddress.streetNumber}`,
    //           city: billingAddress.city,
    //           postal_code: billingAddress.postalCode,
    //           country: "DE",
    //         },
    //       },
    //     },
    //   }
    // );

    // if (error) {
    //   errorEl.textContent = error.message || "Payment failed";
    //   btn.disabled = false;
    //   return;
    // }

    const res = await completeCart();

    // const data = await res.json();

    // if (data.type === "order" && data.order) {
    //   alert("Order placed.");
    //   console.log(data.order);
    // } else {
    //   console.error(data);
    //   errorEl.textContent = "Could not complete order.";
    // }

    // btn.disabled = false;

    loading = false;
  }

  async function completeCart() {
    // curl
    /*
      curl -X POST '{backend_url}/store/carts/{id}/complete' \
      -H 'x-publishable-api-key: {your_publishable_api_key}'
     */

    try {
      const res = await fetch(`${API_URL}store/carts/${cartId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY,
        },
      });

      const data = await res.json();

      if (data.type === "order" && data.order) {
        alert("Order placed.");
        console.log(data.order);
      } else {
        console.error(data);
        // error.textContent = "Could not complete order.";
      }
    } catch (error: any) {
      console.error("Error completing cart:", error);
    }
  }

  function checkoutButton() {
    console.log("Checkout button clicked");
    showModal = true;
  }
</script>

<main class="product-page">
  <h1>Produkte</h1>

  {#if products.length > 0 && cartId}
    <ul class="product-list">
      {#each products as product}
        <ProductCard {product} {updateCart} {cartId} />
      {/each}
    </ul>
  {:else}
    <p class="no-products">Keine Produkte oder Warenkorb gefunden.</p>
  {/if}

  <div class="cart-summary">
    <h2>Warenkorb</h2>
    <h2>Produkte</h2>
    {#if cart}
      <ul>
        {#each cart.items as item}
          <li>
            {item.title}
            {item.variant_title} - Menge: {item.quantity}
            <button
              on:click={() =>
                updateCart({
                  cartId,
                  action: "remove",
                  variantId: item.variant_id,
                  itemId: item.id,
                })}
            >
              Entfernen
            </button>
          </li>
        {/each}
      </ul>
      <p>Gesamt: {cart.total} {cart.currency_code.toUpperCase()}</p>
    {:else}
      <p>Warenkorb ist leer.</p>
    {/if}
  </div>

  <div class="checkout">
    {#if cart && cart.items.length > 0}
      <a href={cart.checkout_url}>
        <button on:click={checkoutButton}>Zur Kasse gehen</button>
      </a>
    {/if}
  </div>

  {#if showModal}
    <div class="modal-backdrop">
      <div class="modal">
        <button
          type="button"
          class="close"
          on:click={() => (showModal = false)}
        >
          ✖ schließen
        </button>
        <h2>Checkout Information</h2>

        <form on:submit|preventDefault={paymentButton}>
          <label for="first-name" aria-required="true">Vorname</label>
          <input type="text" id="first-name" bind:value={firstName} />

          <label for="last-name" aria-required="true">Nachname</label>
          <input type="text" id="last-name" bind:value={lastName} />

          <label for="email" aria-required="true">Email</label>
          <input type="email" id="email" bind:value={email} />

          <label for="phone">Telefonnummer</label>
          <input type="tel" id="phone" bind:value={phone} />

          <h3>Rechnungsadresse</h3>

          <label for="same-address"
            >Rechnungsadresse ist gleich wie Lieferadresse</label
          >
          <input type="checkbox" id="same-address" bind:checked={sameAddress} />

          <label for="billing-company-name">Firmenname</label>
          <input
            type="text"
            id="billing-company-name"
            bind:value={billingAddress.companyName}
            placeholder=""
          />

          <label for="billing-street" aria-required="true">Straße</label>
          <input
            type="text"
            id="billing-street"
            aria-required="true"
            bind:value={billingAddress.street}
          />

          <label for="billing-street-number" aria-required="true"
            >Hausnummer</label
          >
          <input
            type="number"
            id="billing-street-number"
            aria-required="true"
            bind:value={billingAddress.streetNumber}
          />
          <label for="billing-city" aria-required="true">Stadt</label>
          <input
            type="text"
            id="billing-city"
            aria-required="true"
            bind:value={billingAddress.city}
          />

          <label for="billing-postal-code" aria-required="true"
            >Postleitzahl</label
          >
          <input
            type="text"
            id="billing-postal-code"
            aria-required="true"
            bind:value={billingAddress.postalCode}
          />

          <label for="billing-country" aria-required="true">Land</label>
          <input
            type="text"
            id="billing-country"
            aria-required="true"
            bind:value={billingAddress.country}
          />

          {#if !sameAddress}
            <h3>Lieferadresse</h3>
            <label for="shipping-company-name">Firmenname</label>
            <input
              type="text"
              id="shipping-company-name"
              bind:value={shippingAddress.companyName}
            />
            <label for="shipping-street">Straße</label>
            <input
              type="text"
              id="shipping-street"
              bind:value={shippingAddress.street}
            />
            <label for="shipping-street-number">Hausnummer</label>
            <input
              type="text"
              id="shipping-street-number"
              bind:value={shippingAddress.streetNumber}
            />
            <label for="shipping-city">Stadt</label>
            <input
              type="text"
              id="shipping-city"
              bind:value={shippingAddress.city}
            />
            <label for="shipping-postal-code">Postleitzahl</label>
            <input
              type="text"
              id="shipping-postal-code"
              bind:value={shippingAddress.postalCode}
            />
            <label for="shipping-country">Land</label>
            <input
              type="text"
              id="shipping-country"
              bind:value={shippingAddress.country}
            />
          {/if}

          <button type="submit">Weiter Zur Bezahlung</button>
        </form>

        <button class="close" on:click={() => (showModal = false)}>
          ✖ schließen
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading-backdrop">
      <div class="loading-spinner">Lädt...</div>
    </div>
  {/if}

  {#if showPaymentModal}
    <div class="modal-backdrop">
      <div class="modal">
        <button
          type="button"
          class="close"
          on:click={() => (showPaymentModal = false)}
        >
          ✖ schließen
        </button>
        <h2>Payment Information</h2>
        <form id="payment-form">
          <label for="card-element">Card</label>
          <div id="card-element"></div>

          <p id="card-error" style="color:red;"></p>
          <div id="payment-element"></div>
          <button id="pay-btn" type="submit">Place Order</button>
          <div id="error-message"></div>
        </form>
      </div>
    </div>
  {/if}
</main>

<style>
  .loading-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }
  .loading-spinner {
    font-size: 1.5rem;
    color: #111827;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }

  .modal-backdrop form {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  label[aria-required="true"]::after {
    content: " *";
    color: red;
  }

  .modal-backdrop label {
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .modal-backdrop input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
  }

  .modal-backdrop button {
    margin-top: 0.75rem;
    padding: 0.35rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .modal-backdrop button:hover {
    background-color: #2563eb;
  }

  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 400px;
    max-width: 90%;
    position: relative;
  }

  .close {
    position: absolute;
    top: 8px;
    right: 12px;
    border: none;
    background: none;
    font-size: 1.4rem;
    cursor: pointer;
  }
  .checkout {
    margin-top: 2rem;
    text-align: center;
  }

  .checkout button {
    padding: 0.75rem 1.5rem;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .checkout button:hover {
    background-color: #059669;
  }

  .cart-summary {
    margin-top: 3rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background-color: #f9fafb;
  }

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
