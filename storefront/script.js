const container = document.getElementById("products");

fetch("http://localhost:9000/store/products", {
  headers: {
    "x-publishable-api-key":
      "pk_509af7b91928fbd1c56284869f0785d39c3287df5c9aa755b2543ed55cc8c0ea",
  },
})
  .then((res) => res.json())
  .then((data) => {
    const products = data.products;

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const image = product.thumbnail || product.images?.[0]?.url;

      card.innerHTML = `
            <img src="${image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description.substring(0, 80)}...</p>

            <div class="options">
                <strong>Sizes:</strong><br>
                ${product.options[0].values
                  .map(
                    (v) => `
                    <button class="option-btn">${v.value}</button>
                `
                  )
                  .join("")}
            </div>
        `;

      container.appendChild(card);
    });
  })
  .catch((err) => {
    container.innerHTML = "Failed to load products: " + err;
  });
