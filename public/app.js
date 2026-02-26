const instancesList = document.getElementById("instances-list");
const instanceStatus = document.getElementById("instance-status");
const selectedInstanceLabel = document.getElementById("selected-instance");
const productsList = document.getElementById("products-list");
const productStatus = document.getElementById("product-status");

let selectedInstance = null;

function instanceBaseUrl(instance) {
  return `http://${window.location.hostname}:${instance.appPort}`;
}

function parsePrice(value) {
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function getInstances() {
  const response = await fetch("/api/instances");
  if (!response.ok) {
    throw new Error("No se pudo cargar instancias.");
  }
  return response.json();
}

function renderInstances(instances) {
  instancesList.innerHTML = "";
  if (!instances.length) {
    instancesList.innerHTML = "<li>No hay instancias creadas.</li>";
    return;
  }

  instances.forEach((instance) => {
    const li = document.createElement("li");
    const info = document.createElement("span");
    info.textContent = `${instance.name} | puerto ${instance.appPort}`;

    const actions = document.createElement("div");
    actions.className = "actions";

    const selectButton = document.createElement("button");
    selectButton.textContent = "Usar";
    selectButton.type = "button";
    selectButton.onclick = () => {
      selectedInstance = instance;
      selectedInstanceLabel.textContent = `Instancia activa: ${instance.name} (${instanceBaseUrl(
        instance
      )})`;
      loadProducts();
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.type = "button";
    deleteButton.onclick = async () => {
      await fetch(`/api/instances/${instance.id}`, { method: "DELETE" });
      if (selectedInstance?.id === instance.id) {
        selectedInstance = null;
        selectedInstanceLabel.textContent = "No hay instancia seleccionada.";
        productsList.innerHTML = "";
      }
      await loadInstances();
    };

    actions.appendChild(selectButton);
    actions.appendChild(deleteButton);
    li.appendChild(info);
    li.appendChild(actions);
    instancesList.appendChild(li);
  });
}

async function loadInstances() {
  try {
    const instances = await getInstances();
    renderInstances(instances);
  } catch (error) {
    instanceStatus.textContent = error.message;
  }
}

async function loadProducts() {
  if (!selectedInstance) {
    productStatus.textContent = "Selecciona una instancia para ver productos.";
    return;
  }

  try {
    productStatus.textContent = "Cargando productos...";
    const response = await fetch(`${instanceBaseUrl(selectedInstance)}/api/products`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo cargar productos.");
    }

    productsList.innerHTML = "";
    if (!data.length) {
      productsList.innerHTML = "<li>No hay productos en esta instancia.</li>";
      productStatus.textContent = "Carga completada.";
      return;
    }

    data.forEach((product) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>#${product.id} - ${product.name} - Q${product.price}</span>
        <div class="actions">
          <button type="button" data-edit="${product.id}">Editar</button>
          <button type="button" data-delete="${product.id}">Eliminar</button>
        </div>
      `;
      const deleteButton = li.querySelector("[data-delete]");
      deleteButton.onclick = async () => {
        try {
          const response = await fetch(`${instanceBaseUrl(selectedInstance)}/api/products/${product.id}`, {
            method: "DELETE"
          });
          if (!response.ok) {
            const dataError = await response.json();
            throw new Error(dataError.message || "No se pudo eliminar producto.");
          }
          productStatus.textContent = "Producto eliminado correctamente.";
          await loadProducts();
        } catch (error) {
          productStatus.textContent = error.message || "Error al eliminar producto.";
        }
      };

      const editButton = li.querySelector("[data-edit]");
      editButton.onclick = async () => {
        const existingEditor = li.querySelector(".inline-editor");
        if (existingEditor) {
          return;
        }

        const editor = document.createElement("div");
        editor.className = "inline-editor actions";
        editor.innerHTML = `
          <input type="text" data-inline-name value="${String(product.name)}" />
          <input type="number" step="0.01" data-inline-price value="${String(product.price)}" />
          <button type="button" data-inline-save>Guardar</button>
          <button type="button" data-inline-cancel>Cancelar</button>
        `;
        li.appendChild(editor);

        const saveButton = editor.querySelector("[data-inline-save]");
        const cancelButton = editor.querySelector("[data-inline-cancel]");
        const nameInput = editor.querySelector("[data-inline-name]");
        const priceInput = editor.querySelector("[data-inline-price]");

        cancelButton.onclick = () => {
          editor.remove();
          productStatus.textContent = "Edición cancelada.";
        };

        saveButton.onclick = async () => {
          try {
            const name = String(nameInput.value || "").trim();
            const price = parsePrice(priceInput.value);

            if (!name) {
              productStatus.textContent = "El nombre no puede ir vacío.";
              return;
            }

            if (!Number.isFinite(price)) {
              productStatus.textContent = "El precio debe ser un número válido. Ej: 10.5";
              return;
            }

            const response = await fetch(`${instanceBaseUrl(selectedInstance)}/api/products/${product.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, price })
            });
            if (!response.ok) {
              const dataError = await response.json();
              throw new Error(dataError.message || "No se pudo actualizar producto.");
            }

            productStatus.textContent = "Producto actualizado correctamente.";
            await loadProducts();
          } catch (error) {
            productStatus.textContent = error.message || "Error al actualizar producto.";
          }
        };
      };
      productsList.appendChild(li);
    });

    productStatus.textContent = "Carga completada.";
  } catch (error) {
    productStatus.textContent = error.message || "Error al conectar con la instancia.";
  }
}

document.getElementById("create-instance-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  instanceStatus.textContent = "Creando instancia...";
  const formData = new FormData(event.target);
  const payload = { name: formData.get("name") };

  try {
    const response = await fetch("/api/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      instanceStatus.textContent = data.message || "No se pudo crear instancia.";
      return;
    }

    instanceStatus.textContent = `Instancia creada en puerto ${data.instance.appPort}.`;
    event.target.reset();
    await loadInstances();
  } catch (error) {
    instanceStatus.textContent = error.message || "Error al crear instancia.";
  }
});

document.getElementById("product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedInstance) {
    alert("Selecciona una instancia primero.");
    return;
  }

  const name = document.getElementById("product-name").value.trim();
  const price = parsePrice(document.getElementById("product-price").value);

  if (!name) {
    productStatus.textContent = "El nombre del producto es obligatorio.";
    return;
  }

  if (!Number.isFinite(price)) {
    productStatus.textContent = "El precio debe ser un número válido. Ej: 10.5";
    return;
  }

  try {
    const response = await fetch(`${instanceBaseUrl(selectedInstance)}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "No se pudo crear producto.");
    }

    productStatus.textContent = "Producto creado correctamente.";
    event.target.reset();
    await loadProducts();
  } catch (error) {
    productStatus.textContent = error.message || "Error al crear producto.";
  }
});

document.getElementById("refresh-instances").addEventListener("click", loadInstances);
document.getElementById("refresh-products").addEventListener("click", loadProducts);

loadInstances();
