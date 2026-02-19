import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export type UpdateCartParams = {
  cartId: string | null;
  action: "add" | "remove" | "update_addresses";
  variantId?: string;
  itemId?: string;
  billingAddress?: {
    companyName?: string;
    email?: string;
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  shippingAddress?: {
    companyName?: string;
    email?: string;
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
};

export default app;
