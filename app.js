/* ********************************************************************************************
 * Práctica 3. Aplicación web en el servidor/Practice 3. Server side web application
 * Descripción: servidor Node.JS que implementa algunos servicios empleados en la Práctica 2
 * Description: Node.JS server that implements some services that are consumed by Practice 2
 * ASIGNATURA: Servicios y Aplicaciones Telemáticas
 * TITULACIÓN: Grado en Ingeniería de tecnologías de telecomunicación (14312020)
 * TITULACIÓN: Doble Grado Ing. de tecnologías de la telecomunicación e Ing. telemática (15212007)
 * TITULACIÓN: Grado en Ingeniería telemática (14512016)
 * CENTRO: ESCUELA POLITÉCNICA SUPERIOR (LINARES)
 * CURSO ACADÉMICO: 2022-2023
 * AUTOR/ES: <poner nombre/s>
 *********************************************************************************************/

const express = require("express"); //Módulo de express / Express module
const path = require("path"); //Módulo para manejar rutas de archivos / Module to handle file paths
const MongoClient = require("mongodb").MongoClient; // Módulo de gestión MongoDB / Module to manage MongoDB
const Mustache = require("mustache"); //Módulo para el motor de plantilla Mustache / Module for the template engine Mustache
const mustacheExpress = require("mustache-express"); //Módulo para el motor de plantilla Mustache / Module for the template engine Mustache
const dns = require("dns"); //Módulo para emplear el servicio DNS / Module for DNS service
const os = require("os"); //Módulo de información relativa al sistema operativo y el host / Module to get OS information
const { ObjectId } = require("mongodb");

const app = express(); //Instancia de Express / Express instance

const urlMongoDB = "mongodb://localhost:27017"; //URL de la base de datos MongoDB / MongoDB data base URL

const DEFAULT_PORT = 8083; //Puerto del servidor por defecto / Default server port
const PORT = DEFAULT_PORT; //Para poder actualizarla por los argumentos del programa. / To get the program arguments

//Ruta a los recursos estáticos, normalmente CSS o html sin personalizar / Static files path (usually CSS/HTML)
app.use(express.static(__dirname + "/public"));

app.use(express.json()); //Preparar req.body para contenido JSON / To parse as JSON data in req.body
app.use(express.urlencoded({ extended: true })); // Preparar req.body para contenido application/x-www-form-urlencoded - to parse req.body as application/x-www-form-urlencoded

/************************ 
/* Rutas a los servicios / Service paths
*************************/

//Constantes para emplearlas en la prácitica
const DB_NAME = "blog";// Nombre de la base de datos / database name
const DB_COLLECTION_USERS = "users";// Nombre de la colección con los usuarios registrados/ Name of the colection with the registered users
const DB_COLLECTION_ENTRIES = "entries";// Nombre de la colección con la entradas del blog / Name of the colection with blog entries


/* [Aportado por el profesor] Simplemente muestra la petición de entrada como registro y pasa el manejo al siguiente  
 * [Contributed by teacher] Simply display the input request as a record and pass the handling to the next 
 *
 *  */


app.use((req, res, next) => {
  console.log("[SERVIDOR] Petición entrante:" + req.method + " " + req.path);
  next(); //Cede el control a la siguiente parte de código que se ajuste con la petición./ Give control to the next piece of code that matches the request.
});

/* [Aportado por el profesor] Servicio de login 
   [Contributed by teacher] Login service 
   */
app.post("/login", (req, res) => {
  console.log("[SERVIDOR][/login] Recibido: " + JSON.stringify(req.body));

  
  const client = new MongoClient(urlMongoDB); //Conexión con MongoDB / MongoDB Connection

  const db = client.db(DB_NAME); //Se selecciona la base de datos / database selection
  const collection = db.collection(DB_COLLECTION_USERS); //Se optiene la colección de documentos deseada / Collection selection
  collection
    .findOne({ user: req.body.user }) //Se busca una sola coincidencia y se devuelve una promesa / Searches for a single match and returns a promise
    .then((result) => {
      if (result !== null) {
        console.log("[SERVIDOR][/login] Encontrado:" + JSON.stringify(result));
        if (req.body.password === result.password) {
          //Clave correcta / correct password
          res.status(200).end();
        } else {
          //Clave incorrecta / incorrect password
          console.log("[SERVIDOR][/login] Error de autenticación.");
          res.status(401).end();
        }
        client.close();
      } else {
        //Usuario desconocido / unknown used
        console.log("Usuario desconocido");
        res.status(401).end();
        client.close();
      }
      
    })
    .catch(() => {
      res.status(500).end();
    });
});

/* [Aportado por el profesor] Servicio para crear usuario 
   [Contributed by teacher]  User creation service
*/
app.put("/user", function (req, res) {
  console.log("[SERVIDOR] PUT /user Recibido:" + JSON.stringify(req.body));

  if (req.body === undefined) {
    res.status(400).end("data not found"); //Petición sin datos /emty request
    return;
  }
  const client = new MongoClient(urlMongoDB); //Se conecta con MongoDB / MongoDB connection
 
  async function run() {
    try {
      const db = client.db(DB_NAME);
      const users = db.collection(DB_COLLECTION_USERS);

      const userCount = await users.countDocuments({ user: req.body.user });//Se buscan las apariciones del usuario en la colección / search for already existing users in the database
      if (userCount !== 0) {
        //Usuario que ya existe / User alerady exists
        console.log(
          `El usuario ${req.body.user} ya existe en la base de datos`
        );
        res.status(400).end();//Se responde con el código 400 / The response is 400
      } else {
        //El usuario a introducir no existe / the user doesn't exists
        const result = await users.insertOne(req.body); //Se inserta en la colección / Inserting in the collection
        console.log(`Documento insertado con _id: ${result.insertedId}`);
        res.setHeader("Content-Type", "application/json");
        res.status(201).end(JSON.stringify({ _id: result.insertedId }));
      }
    } finally {
      await client.close();
    }
  }

  run().catch(() => {
    res.status(500).end();
  });
  
});



/* [Aportado por el profesor] Servicio GET /blog para obtener todas las entradas del blog de un usuario
   [Contributed by teacher] GET /blog service to get all the blog entries of a user
 */
app.get("/blog", async function (req, res) {
  //Se declara la función como asíncrona para poder usar await / The function is declared as asynchronous to be able to use await
  console.log("[SERVIDOR][/blog]");

  try {
    const client = new MongoClient(urlMongoDB); //Conexión con MongoDB / MongoDB connection
    const db = client.db(DB_NAME);// Nombre de la base de datos / database name
   //Se elije la base de datos / Database is selected
    const collection = db.collection(DB_COLLECTION_ENTRIES); //Se selecciona la colección para listar todas las entradas / Select the collection to list all entries
    const options = {
      sort: { date: 1 },
    }; //Se prepara la ordenación por orden asecendente de fechas./ sorting by ascending order of dates

    //Se optiene un cursor con los resultados de la búsqueda / A cursor to iterate search results
    const cursor = collection.find({}, options);

    if (cursor !== null) {
      let result = [];
      await cursor.forEach((entry) => {
        result.push(entry);
      }); //Se recorre el cursor y se guardan los resultados en result /the cursor is iterated to store the items in result
      console.log("[SERVIDOR][/blog] Encontrado/found:" + JSON.stringify(result));

      res.setHeader("Content-Type", "application/json");
      res.status(200).end(JSON.stringify(result));

      client.close();
    } else {
      res.status(500).end();
    }
  } catch (ex) {
    console.log("Excepción: " + ex);
    res.status(500).end();
  }
});

/******* INICIO PRÁCTICA 3 / PRACTICE 3 BEGINS **********/

//Estos son los servicios que se deben crear en la práctica 3 / these are the services to develop in practice 3

//Tarea 3: servicio PUT /blog
app.put("/blog", (req, res) => {
  console.log("[SERVIDOR] PUT /user Recibido:" + JSON.stringify(req.body));
  if (req.body === undefined) {
    res.status(400).end("data not found"); 
    return;
  }

  const client = new MongoClient(urlMongoDB)
  
  async function run(){
    try{
      const db = client.db(DB_NAME)
      const users = db.collection(DB_COLLECTION_USERS)
      const userCount = await users.countDocuments({user: req.body.user})
      const entries = db.collection(DB_COLLECTION_ENTRIES);

      if(userCount !== 0){
        const result = await entries.insertOne(req.body)
        console.log(`Documento insertado con _id: ${result.insertedId}`);
        res.setHeader("Content-Type", "application/json");
        res.status(201).end();
      } else {
        console.log(
          `El usuario ${req.body.user} no existe en la base de datos`
        );
        res.status(400).end();
      }
    } finally {
      await client.close();
    }
  }
  
  run().catch(() => {
    res.status(500).end();
  });
});

//Tarea 4: servicio DELETE /blog/id
app.delete("/blog/:id", (req, res) => {
  console.log("[SERVIDOR] DELETE /id Recibido:" + JSON.stringify(req.params.id));
  if (req.params.id === undefined) {
    res.status(400).end("data not found"); 
    return;
  }

  const client = new MongoClient(urlMongoDB)
  
  async function run(){
    try{
      const db = client.db(DB_NAME)
      const entries = db.collection(DB_COLLECTION_ENTRIES);
      const id = new ObjectId(req.params.id)
      const entriesCount = await entries.countDocuments({_id: id})
      if(entriesCount != 0){
        const result = await entries.deleteOne({_id: id})
        console.log(`Documento deletado`);
        res.setHeader("Content-Type", "application/json");
        res.status(201).end();
      } else{
        console.log(
          `El entri con id ${req.params.id} no existe en la base de datos`
        );
        res.status(400).end();
      }
    } finally {
      await client.close();
    }
  }
  
  run().catch(() => {
    res.status(500).end();
  });
});

//Tarea 5: servicio GET /blog/entries/user
app.get("/blog/entries/:user", (req, res) => {
  res.status(200).end();
});

/******* FIN PRÁCTICA 3 **********/

//Se busca la ip del host para mostrarla en el mensaje de inicio
dns.lookup(os.hostname(), 4, function (err, address, family) {
  //4 para IPv4
  if (err) {
    console.log("Error al obtener la IP del servidor");
  } else {
    console.log("IP del servidor: " + address.toString());
    //Se inicia el servidor una vez se ha buscado la ip
    app.listen(PORT, address.toString(), () => {
      console.log(`Servidor ejecutándose en http://${address}:${PORT}`);
    });
  }
});
