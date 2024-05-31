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
        };
    } catch (error) {
        console.error('Error al obtener el usuario aleatorio:', error);
        return null;
    }
}

async function agregarUsuarioAleatorio() {
    const usuario = await obtenerUsuarioAleatorio();
    if (usuario) {
        console.log('Usuario agregado:', usuario);
    } else {
        console.log('No se pudo obtener un usuario aleatorio.');
    }
}

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
            montoUSD: monto,
            cuotas,
            primerMes,
            tasaInteres,
            divisa,
            tipoCambio
        };

        usuarios.push(usuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        mostrarUsuarios();
        mostrarOrdenarUsuariosDropdown();
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
        return 1;
    }
}

function calcularTasaInteres() {
    const tasaAnual = 0.2;
    const tasaMensual = tasaAnual / 12;
    return tasaMensual;
}

function mostrarUsuarios() {
    let outputs = document.getElementById('outputs');
    outputs.innerHTML = '';

    let ordenarUsuariosDropdown = document.getElementById('ordenarUsuarios');
    let orden = ordenarUsuariosDropdown ? ordenarUsuariosDropdown.value : 'ascendente';

    let usuariosOrdenados = [...usuarios];
    switch (orden) {
        case 'nombreAscendente':
            usuariosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'nombreDescendente':
            usuariosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
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
        default:
            break;
    }

    usuariosOrdenados.forEach((usuario) => {
        let planPagos = mostrarPlanPagosUsuario(usuario);
        let usuarioOutput = document.createElement('div');
        usuarioOutput.innerHTML = `<h3 class="mt-5">${usuario.nombre} ${usuario.apellido}</h3>${planPagos}`;
        outputs.appendChild(usuarioOutput);
    });

    let ordenarUsuariosContainer = document.getElementById('ordenarUsuariosContainer');
    if (!ordenarUsuariosContainer) {
        ordenarUsuariosContainer = document.createElement('div');
        ordenarUsuariosContainer.id = 'ordenarUsuariosContainer';
        ordenarUsuariosContainer.classList.add('d-none', 'mb-2');
        ordenarUsuariosContainer.innerHTML = `
            <label for="ordenarUsuarios">Ordenar usuarios por:</label>
            <select id="ordenarUsuarios">
                <option value="nombreAscendente">Nombre (A-Z)</option>
                <option value="nombreDescendente">Nombre (Z-A)</option>
                <option value="montoAscendente">Monto (de menor a mayor)</option>
                <option value="montoDescendente">Monto (de mayor a menor)</option>
                <option value="cuotasAscendente">Cuotas (de menor a mayor)</option>
                <option value="cuotasDescendente">Cuotas (de mayor a menor)</option>
            </select>
        `;
        outputs.appendChild(ordenarUsuariosContainer);
    }

    if (ordenarUsuariosDropdown) {
        ordenarUsuariosDropdown.addEventListener('change', () => {
            mostrarUsuarios();
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
    let {  montoUSD, cuotas, primerMes, tasaInteres, divisa, tipoCambio } = usuario;
    let pagoMensual = calcularPagoCuotasUsuario(usuario);
    let intereses = montoUSD - (pagoMensual * cuotas);
    let meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    let tabla = `<table class="table table-striped table table-bordered table-striped mt-3 rounded">
                  <thead class="table-dark">
                    <tr>
                      <th colspan="4">Monto Solicitado: $${montoUSD}</th>
                     
                    </tr>
                    <tr>
                      <th colspan="4">N° de Cuotas: ${cuotas}</th>
                     
                    </tr>
                    <tr>
                      <th colspan="4">Tasa de Interés: ${tasaInteres.toFixed(2)}</th>
                    </tr>
                    <tr>
                       <th colspan="4">Divisa: ${divisa}</th>
                    </tr>
                    <tr>
                      <th>Cuota N°</th>
                      <th>Mes</th>
                      <th>Intereses</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>`;

    let mesActual = meses.indexOf(primerMes.toLowerCase());
    let totalAcumulado = 0;
    for (let i = 0; i <= cuotas; i++) {
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
                  <td>${i + 1}</td>
                  <td>${meses[mesActual % 12]}</td>
                  <td>$${interes.toFixed(2)}</td>
                  <td>$${totalAPagar.toFixed(2)}</td>`;
        mesActual++;
        totalAcumulado += totalAPagar;
    }

   
              tabla += `<tr>
                <td colspan="3" class="text-end fw-bold">Total a Pagar</td>
                <td colspan="4">$${totalAcumulado.toFixed(2)} ${divisa}</td>
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