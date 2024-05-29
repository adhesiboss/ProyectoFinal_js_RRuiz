let usuarios = [];

async function obtenerUsuarioAleatorio() {
    try {
        const response = await fetch('https://randomuser.me/api/');
        const data = await response.json();
        const usuarioAleatorio = data.results[0];

        return {
            nombre: usuarioAleatorio.name.first,
            apellido: usuarioAleatorio.name.last,
            email: usuarioAleatorio.email,
            // Puedes agregar más campos según tus necesidades
        };
    } catch (error) {
        console.error('Error al obtener el usuario aleatorio:', error);
        return null;
    }
}

// Ejemplo de cómo agregar un usuario aleatorio
async function agregarUsuarioAleatorio() {
    const usuario = await obtenerUsuarioAleatorio();
    if (usuario) {
        // Agregar el usuario a tu lista de usuarios
        console.log('Usuario agregado:', usuario);
    } else {
        console.log('No se pudo obtener un usuario aleatorio.');
    }
}

// Llamar a la función para agregar un usuario aleatorio
agregarUsuarioAleatorio();

function mostrarOrdenarUsuariosDropdown() {
    const ordenarUsuariosContainer = document.getElementById('ordenarUsuariosContainer');
    if (usuarios.length >= 2) {
        ordenarUsuariosContainer.classList.remove('d-none');
    } else {
        ordenarUsuariosContainer.classList.add('d-none');
    }
}


async function agregarUsuario(monto, cuotas, primerMes, divisa) {
    try {
        const usuarioAleatorio = await obtenerUsuarioAleatorio();
        const tasaInteres = calcularTasaInteres(monto, cuotas);

        const tipoCambio = await obtenerTipoCambio(divisa);

        const usuario = {
            nombre: usuarioAleatorio.nombre,
            apellido: usuarioAleatorio.apellido,
            montoUSD: monto, // El monto siempre en USD
            cuotas,
            primerMes,
            tasaInteres,
            divisa,
            tipoCambio
        };

        usuarios.push(usuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        mostrarUsuarios();
        mostrarOrdenarUsuariosDropdown(); // Mostrar el dropdown después de agregar un usuario
    } catch (error) {
        console.error('Error al agregar el usuario:', error);
    }
}


async function obtenerTipoCambio(divisa) {
    const apiKey = 'a6ef2bfe225f36945b5d084e';
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.conversion_rates[divisa];
    } catch (error) {
        console.error('Error al obtener el tipo de cambio:', error);
        return 1; // Si hay un error, devolver 1 para no afectar los cálculos.
    }
}

function calcularTasaInteres() {
    const tasaAnual = 0.2; // Tasa de interés anual del 20%
    const tasaMensual = tasaAnual / 12; // Tasa de interés mensual
    return tasaMensual;
}

function mostrarUsuarios() {
    let outputs = document.getElementById('outputs');
    outputs.innerHTML = '';

    // Obtener el valor seleccionado en el dropdown si existe
    let ordenarUsuariosDropdown = document.getElementById('ordenarUsuarios');
    let orden = ordenarUsuariosDropdown ? ordenarUsuariosDropdown.value : 'ascendente'; // Valor por defecto si el dropdown no se encuentra

    // Ordenar la lista de usuarios según el valor seleccionado en el dropdown
    let usuariosOrdenados = [...usuarios]; // Crear una copia para no modificar la lista original
    switch (orden) {
        case 'montoAscendente':
            usuariosOrdenados.sort((a, b) => a.montoUSD - b.montoUSD);
            break;
        case 'montoDescendente':
            usuariosOrdenados.sort((a, b) => b.montoUSD - a.montoUSD);
            break;
        case 'cuotasAscendente':
            usuariosOrdenados.sort((a, b) => a.cuotas - b.cuotas);
            break;
        case 'cuotasDescendente':
            usuariosOrdenados.sort((a, b) => b.cuotas - a.cuotas);
            break;
        // Agrega más casos según los criterios que necesites
        default:
            break;
    }

    // Mostrar los usuarios ordenados
    usuariosOrdenados.forEach((usuario) => {
        let planPagos = mostrarPlanPagosUsuario(usuario);
        let usuarioOutput = document.createElement('div');
        usuarioOutput.innerHTML = `<h3 class="mt-5">Usuario: ${usuario.nombre} ${usuario.apellido}</h3>${planPagos}`;
        outputs.appendChild(usuarioOutput);
    });

    // Agregar el div para ordenar usuarios dentro del div outputs si no existe
    let ordenarUsuariosContainer = document.getElementById('ordenarUsuariosContainer');
    if (!ordenarUsuariosContainer) {
        ordenarUsuariosContainer = document.createElement('div');
        ordenarUsuariosContainer.id = 'ordenarUsuariosContainer';
        ordenarUsuariosContainer.classList.add('d-none', 'mb-2');
        ordenarUsuariosContainer.innerHTML = `
            <label for="ordenarUsuarios">Ordenar usuarios por:</label>
            <select id="ordenarUsuarios">
                <option value="montoAscendente">Monto (de menor a mayor)</option>
                <option value="montoDescendente">Monto (de mayor a menor)</option>
                <option value="cuotasAscendente">Cuotas (de menor a mayor)</option>
                <option value="cuotasDescendente">Cuotas (de mayor a menor)</option>
                <!-- Agrega más opciones según los criterios que necesites -->
            </select>
        `;
        outputs.appendChild(ordenarUsuariosContainer);
    }

    // Agregar event listener al dropdown para ordenar usuarios si existe
    if (ordenarUsuariosDropdown) {
        ordenarUsuariosDropdown.addEventListener('change', () => {
            mostrarUsuarios();
            // Actualizar el localStorage con la lista ordenada
            localStorage.setItem('usuarios', JSON.stringify(usuariosOrdenados));
        });
    }
}









function calcularPagoCuotasUsuario(usuario) {
    let { montoUSD: monto, cuotas } = usuario;
    if (cuotas <= 0 || cuotas % 1 !== 0) {
        return "El número de cuotas debe ser un entero positivo.";
    }

    let pagoMensual = Math.ceil(monto / cuotas);
    if (pagoMensual * cuotas < monto) {
        let intereses = monto - (pagoMensual * cuotas);
        pagoMensual += intereses / cuotas;
    }

    return pagoMensual;
}

function mostrarPlanPagosUsuario(usuario) {
    let { nombre, apellido, montoUSD, cuotas, primerMes, tasaInteres, divisa, tipoCambio } = usuario;
    let pagoMensual = calcularPagoCuotasUsuario(usuario);
    let intereses = montoUSD - (pagoMensual * cuotas);
    let meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    let tabla = `<table class="table table-striped">
                  <thead>
                    <tr>
                      <th colspan="5">Usuario: ${nombre} ${apellido} - Interés: ${tasaInteres.toFixed(2)} - Divisa: ${divisa}</th>
                    </tr>
                    <tr>
                      <th>Mes</th>
                      <th>Cuota (${divisa})</th>
                      <th>Interés (${divisa})</th>
                      <th>Total a pagar (${divisa})</th>
                    </tr>
                  </thead>
                  <tbody>`;

    let mesActual = meses.indexOf(primerMes.toLowerCase());
    let totalAcumulado = 0;
    for (let i = 1; i <= cuotas; i++) {
        let cuota = pagoMensual * tipoCambio;
        let interes = 0;
        if (i === cuotas) {
            cuota += intereses * tipoCambio;
        } else {
            interes = montoUSD * tasaInteres * tipoCambio;
            montoUSD -= pagoMensual;
        }
        let totalAPagar = cuota + interes;
        tabla += `<tr>
                  <td>${meses[mesActual % 12]}</td>
                  <td>$${cuota.toFixed(2)}</td>
                  <td>$${interes.toFixed(2)}</td>
                  <td>$${totalAPagar.toFixed(2)}</td>`;
        mesActual++;
        totalAcumulado += totalAPagar;
    }

    tabla += `<tr>
                <td>Total acumulado hasta el momento:</td>
                <td></td>
                <td></td>
                <td>$${totalAcumulado.toFixed(2)}</td>
              </tr>`;

    tabla += `</tbody>
              </table>`;

    return tabla;
}



document.getElementById('agregarUsuario').addEventListener('click', () => {
    let monto = parseFloat(document.getElementById('monto').value);
    let cuotas = parseInt(document.getElementById('cuotas').value);
    let primerMes = document.getElementById('primerMes').value.trim();
    let divisa = document.getElementById('divisa').value.trim().toUpperCase();

    if (isNaN(monto) || monto <= 0 || isNaN(cuotas) || cuotas <= 0 || cuotas > 36 || primerMes === '') {
        toastr.error('Por favor, complete todos los campos correctamente.');
        return;
    }

    agregarUsuario(monto, cuotas, primerMes, divisa);

    toastr.success('Usuario agregado correctamente.');

    document.getElementById('monto').value = '';
    document.getElementById('cuotas').value = '';
    document.getElementById('primerMes').value = '';
});


mostrarUsuarios();

document.getElementById('verUsuarios').addEventListener('click', () => {
    const usuariosEnStorage = JSON.parse(localStorage.getItem('usuarios'));
    console.log(usuariosEnStorage);
});
