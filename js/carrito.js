//inicializo la variable carrito con una funcion para que detecte si existen valores previos en el storage
let carrito = cargarCarrito();
//inicializo la variable productosJSON para poder trabajar con la funcion obtenerJSON
let productosJSON = [];
//cargo la variable cantidad para que no se pierdan los datos almacenados al refrescar la ventana
let cantidadTotalCompra = carrito.length;

//dentro del document ready agrego todo el codigo generado por dom
$(document).ready(function () {
	$("#cantidad-compra").text(cantidadTotalCompra);
	//evento al boton finalizar compra para que el usuario confirme su compra
	$("#btn-finalizar").on("click", function () {
		//uso sweet alert para que el usuario confirme su compra, cuando toca si se vacia el carrito
		Swal.fire({
			title: "¿Seguro que queres finalizar tu compra?",
			text: `Total a abonar: $${calcularTotalCarrito()}`,
			showCancelButton: true,
			confirmButtonColor: "#008f39",
			cancelButtonColor: "#d33",
			confirmButtonText: "Si",
			cancelButtonText: "No",
		}).then((result) => {
			if (result.isConfirmed) {
				Swal.fire("Compra confirmada", "¡Que lo disfrutes!", "success");
				vaciarCarrito();
			}
		});
	});

	//configuracion del selector para ordenar productos
	$("#seleccion option[value='pordefecto']").attr("selected", true);
	$("#seleccion").on("change", ordenarProductos);

	//llamo a las funciones que necesitan renderizarse
	$("#gastoTotal").html(`Total: $ ${calcularTotalCarrito()}`);
	obtenerJSON();
	renderizarProductos();
	mostrarEnTabla();
});

//funcion para el renderizado de los productos en cards (se crean los contenedores de las cards de los productos)
function renderizarProductos() {
	for (const producto of productosJSON) {
		$("#section-productos").append(`<div class="card-product"> 
                                    <div class="img-container">
                                    <img src="${producto.foto}" alt="${producto.nombre}" class="img-product"/>
                                    </div>
                                    <div class="info-producto">
                                    <p class="font">${producto.nombre}</p>
                                    <strong class="font">$${producto.precio}</strong>
                                    <button class="botones" id="btn${producto.id}"> Agregar al carrito </button>
                                    </div>
                                    </div>`);

		$(`#btn${producto.id}`).on("click", function () {
			agregarAlCarrito(producto);
			$(`#btn${producto.id}`).fadeOut(200).fadeIn(200);
		});
	}
}

//funcion utilizando AJAX para obtener la informacion de los productos creados en el archivo json (Copiado de un ejemplo que vi en internet, no lo termine de entender bien pero funciona.)
function obtenerJSON() {
	$.getJSON("./json/productos.json", function (respuesta, estado) {
		if (estado == "success") {
			productosJSON = respuesta;
			renderizarProductos();
		}
	});
}

//funcion para ordenar los productos segun precio y orden alfabetico
function ordenarProductos() {
	let seleccion = $("#seleccion").val();
	if (seleccion == "menor") {
		productosJSON.sort(function (a, b) {
			return a.precio - b.precio;
		});
	} else if (seleccion == "mayor") {
		productosJSON.sort(function (a, b) {
			return b.precio - a.precio;
		});
	} else if (seleccion == "alfabetico") {
		productosJSON.sort(function (a, b) {
			return a.nombre.localeCompare(b.nombre);
		});
	}
	//luego del reordenamiento tenemos que volver a renderizar
	$(".card-product").remove();
	renderizarProductos();
}

//creo una clase para cargar productos en el carrito y modificar sus cantidades
class ProductoCarrito {
	constructor(prod) {
		this.id = prod.id;
		this.foto = prod.foto;
		this.nombre = prod.nombre;
		this.precio = prod.precio;
		this.cantidad = 1;
	}
}

//funcion para agregar productos al carrito, modificando el detalle del carrito
function agregarAlCarrito(productoAgregado) {
	let encontrado = carrito.find((p) => p.id == productoAgregado.id);
	if (encontrado == undefined) {
		let productoEnCarrito = new ProductoCarrito(productoAgregado);
		carrito.push(productoEnCarrito);
		Swal.fire(
			"Nuevo producto agregado al carrito",
			productoAgregado.nombre,
			"success"
		);

		//agregamos una nueva fila a la tabla de carrito en caso de que el producto no se encontrara
		$("#tablabody")
			.append(`<tr id='fila${productoEnCarrito.id}' class='tabla-carrito'>
                            <td> ${productoEnCarrito.nombre}</td>
                            <td id='${productoEnCarrito.id}'> ${productoEnCarrito.cantidad}</td>
                            <td> ${productoEnCarrito.precio}</td>
                            <td><button class='btn btn-light' id="btn-eliminar-${productoEnCarrito.id}">🗑️</button></td>
                            </tr>`);
	} else {
		//pido al carro la posicion del producto y despues incremento su cantidad
		let posicion = carrito.findIndex((p) => p.id == productoAgregado.id);
		carrito[posicion].cantidad += 1;
		$(`#${productoAgregado.id}`).html(carrito[posicion].cantidad);
	}

	$("#gastoTotal").html(`Total: $ ${calcularTotalCarrito()}`);
	localStorage.setItem("carrito", JSON.stringify(carrito));
	mostrarEnTabla();
}

//funcion para rehacer la tabla cada vez que se refresca la pagina y eliminar productos del carrito
function mostrarEnTabla() {
	$("#tablabody").empty();
	for (const prod of carrito) {
		$("#tablabody").append(`<tr id='fila${prod.id}' class='tabla-carrito'>
                            <td> ${prod.nombre}</td>
                            <td id='${prod.id}'> ${prod.cantidad}</td>
                            <td> ${prod.precio}</td>
                            <td><button class='btn btn-light' id="eliminar${prod.id}">🗑️</button></td>
                            </tr>`);

		$(`#eliminar${prod.id}`).click(function () {
			let eliminado = carrito.findIndex((p) => p.id == prod.id);
			carrito.splice(eliminado, 1);
			console.log(eliminado);
			$(`#fila${prod.id}`).remove();
			$("#gastoTotal").html(`Total: $ ${calcularTotalCarrito()}`);
			localStorage.setItem("carrito", JSON.stringify(carrito));
		});
	}
}

//funcion para calcular el monto total del carrito y la cantidad, empieza con un total de cero y busca que por cada producto del carrito se sume el precio del producto y se multiplique por la cantidad de objetos, luego muestra el monto total de la compra en formato de texto y la cantidad de objetos/productos que haya en el.
function calcularTotalCarrito() {
	let total = 0;
	for (const producto of carrito) {
		total += producto.precio * producto.cantidad;
	}
	$("#montoTotalCompra").text(total);
	$("#cantidad-compra").text(carrito.length);
	return total;
}

//funcion que resetea todos los valores una vez finalizada la compra, basicamente la funcion borra todo lo que este dentro del carrito
function vaciarCarrito() {
	$("#gastoTotal").text("Total: $0");
	$("#cantidad-compra").text("0");
	$(".tabla-carrito").remove();
	localStorage.clear(); //local storage se borra para quedar vacio
	carrito = [];
}

//funcion para traer el carrito cargado cada vez que se refresca la pagina. basicamente lo que hace es buscar si en localStorage hay un item llamado carrito y en caso de que carrito sea nulo devuelve una array vacio, en caso de que carrito sea true osea que si exista devuele el carrito en si
function cargarCarrito() {
	let carrito = JSON.parse(localStorage.getItem("carrito"));
	if (carrito == null) {
		return [];
	} else {
		return carrito;
	}
}
