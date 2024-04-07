const login = document.getElementById("login"),
    sign = document.getElementById("sign"),
    sobre = document.getElementById("sobre"),
    blog = document.getElementById("blog"),
    add = document.getElementById("add"),

    btn_registro = document.getElementById("tab-registro"),
    btn_login = document.getElementById("tab-login"),
    user_register = document.getElementById("user-register"),
    btn_blog = document.getElementById("tab-blog"),
    btn_add = document.getElementById("tab-add"),
    login_form = document.getElementById("login-form"),
    blog_form = document.getElementById("blog-form"),
    register_form = document.getElementById("register-form"),
    tbody = document.getElementById("table-body"),
    aside = document.getElementById("aside"),
    blogtable = document.getElementById("blogtable"),
    btndescargar = document.getElementById("btndescargar"),
    warning = document.getElementById("warning"),
    btn_sobre = document.getElementById("tab-sobre")

let global_usuario
// Function to hide the tabs that is in "list".
function Clear() {
    const list = [sign, login, sobre, blog, add]

    for (let element of list) {
        element.style = "display: none"
    }
}

// Home
function Home() {
    Clear()
    login.style = "display: flex"
    btn_blog.style = "display: none"
    btn_add.style = "display: none"
    aside.innerText= `
    Ingrese el usuario y contraseña registrados en el sistema. Si no tiene una cuenta, cree una en la sección "registrarse".
    `
    warning.style = "display: none"
    
}

// Sign In
function Registro() {
    Clear()
    sign.style = "display: flex"
    aside.innerText= `
    Esta operación registrará su datos en el sistema.
    No puedes tener un nombre de usuario o correo electrónico ya registrado.
    Su contraseña y nombre de usuario deben tener entre 4 y 16 caracteres
    `
}

// About
function Sobre() {
    Clear()
    sobre.style = "display: flex"
    aside.innerText= `
    En esta práctica se profundiza en la programación de servicios en el
    ámbito del a World Wide Web, concretamente en la creación de
    aplicaciones en el cliente con la tecnología JavaScript, aparte de seguir
    afianzando el diseño de las vistas de cliente con las tecnologías HTML
    y CSS.
    `
}

// Show blog entries
function Blog() {
    Clear()
    blog.style = "display: flex"
    aside.innerText= `
    Este servicio permite obtener todas las entradas del blog del usuario logado.
    `
    blogtable.style="display: none"
}

// Show the list
btndescargar.addEventListener("click", () =>{
    blogtable.style="display: table"
})

// Add new blog entries
function Add() {
    Clear()
    add.style = "display: flex"
    aside.innerText= `
    El título debe tener entre 4 y 16 caracteres.
    Rellena correctamente la fecha y explica de qué trata la entrada en la sección de comentarios
    `
}

// It does the request to log-in
login_form.addEventListener("submit", (e) => {
    e.preventDefault()

    let datos = new FormData(e.target)
    datos = {
        user: datos.get("user"),
        password: datos.get("password"),
    };
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then(data => {
            if(data.status == 401 || data.status == 400){
                Warning("Usuario o contraseña incorreta.")
            }
            if (data.status == 200) {
                btn_login.style = "display: none"
                btn_registro.style = "display: none"
                btn_blog.style = "display: block"
                btn_add.style = "display: block"
                Blog()
                List(datos.user)
            }
        });
})

// It does the request for a new entry
blog_form.addEventListener("submit", (e) => {
    e.preventDefault()

    let datos = new FormData(e.target)
    datos = {
        user: global_usuario,
        title: datos.get("title"),
        date: datos.get("date"),
        comment: datos.get("comment"),
    };
    fetch("/blog", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then(() => {
                List(datos.user)
                Blog()
        });
})

// It does the request to sign in
register_form.addEventListener("submit", (e) => {
    e.preventDefault()
    
    let datos = new FormData(e.target)
    datos = {
        user: datos.get("user"),
        password: datos.get("password"),
        name: datos.get("name"),
        surname: datos.get("surname"),
        email: datos.get("email"),
    }
    fetch("/user", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then((data) => {
            if(data.status == 403){
                Warning("Usuario ya registrado.")
            }
            if(data.status == 201){
                Warning("Usuario registrado con exito.")
                register_form.reset();
                Home()
            }
            
        });
})

// function to list the blog entries
function List(usuario) {
    global_usuario = usuario;
    fetch("/blog/" + usuario, {
        method: "GET"
    })
    .then(data => {
        if (!data.ok) {
            return data.status
        }
        return data.json();
    })
    .then(data => {
        tbody.innerText = ""
            for ( value of data) {
                tbody.innerHTML += `
                <tr>
                    <td> ${value.title} </td>
                    <td> ${value.date} </td>
                    <td> ${value.comment} </td>
                </tr>
                `
            }
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}

btn_registro.addEventListener("click", () => {
    Registro()
})
btn_login.addEventListener("click", () => {
    Home()
})
btn_sobre.addEventListener("click", () => {
    Sobre()
})
btn_blog.addEventListener("click", () => {
    Blog()
})
btn_add.addEventListener("click", () => {
    Add()
})

// Function to show a pop-up with a text
function Warning(text) {
    warning.innerText = text
    warning.style = "display:flex"
    setTimeout(()=>{
        warning.style = "display:none"
    }, 3000)
}
Home()