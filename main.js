const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get("/echo", (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);

// In this example, returned resources will be wrapped in a body property
router.render = (req, res) => {
  const headers = res.getHeaders();
  const totalCountHeader = headers["x-total-count"];
  if (req.method === "GET" && totalCountHeader) {
    const result = {
      data: res.locals.data,
      pagination: {
        _totalPages: Math.ceil(totalCountHeader / 10),
        _totalItems: totalCountHeader,
      },
    };
    return res.jsonp(result);
  }
  res.jsonp(res.locals.data);
};
/// login
server.post("/api/login", (req, res) => {
  const { userName, password } = req.body;
  const user = router.db.get("users").find({ userName, password }).value();

  if (user) {
    const { userName, id, token, type } = user;
    res.status(200).json({ userName, id, token, type });
  } else {
    res.status(401).json({ message: "Invalid userName or password" });
  }
});
server.post("/api/register", (req, res) => {
  const { userName, password, type } = req.body;
  const id = generateUniqueID();
  const token = generateUniqueToken();
  const createdAt = Date.now();
  const updatedAt = Date.now();

  const existingUser = router.db.get("users").find({ userName }).value();
  if (existingUser) {
    return res.status(400).json({ message: "userName already exists" });
  }

  const newUser = {
    id,
    token,
    userName,
    password,
    type,
    createdAt,
    updatedAt,
  };

  router.db.get("users").push(newUser).write();

  res.status(201).json(newUser);
});

server.post("/api/posts", (req, res) => {
  const { title, content, image } = req.body;
  const id = generateUniqueIDPosts();
  const createdAt = Date.now();
  const updatedAt = Date.now();
  const newPost = {
    id,
    title,
    content,
    image,
    createdAt,
    updatedAt,
  };

  router.db.get("posts").push(newPost).write();

  res.status(201).json(newPost);
});

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}
function generateUniqueID() {
  let id = generateRandomString(16);
  const existingUser = router.db.get("users").find({ id }).value();
  while (existingUser) {
    id = generateRandomString(16);
    existingUser = router.db.get("users").find({ id }).value();
  }
  return id;
}

function generateUniqueIDPosts() {
  let id = generateRandomString(16);
  const existingPost = router.db.get("posts").find({ id }).value();
  while (existingPost) {
    id = generateRandomString(16);
    existingPost = router.db.get("posts").find({ id }).value();
  }
  return id;
}

function generateUniqueToken() {
  let token = generateRandomString(32);
  const existingUser = router.db.get("users").find({ token }).value();
  while (existingUser) {
    token = generateRandomString(32);
    existingUser = router.db.get("users").find({ token }).value();
  }
  return token;
}
server.use((req, res, next) => {
  if (req.method === "PUT" || req.method === "PATCH") {
    req.body.updatedAt = Date.now();
  } else if (req.method === "POST") {
    req.body.updatedAt = Date.now();
    req.body.createdAt = Date.now();
  }

  // Continue to JSON Server router
  next();
});
// Use default router
server.use("/api", router);
server.listen(5050, () => {
  console.log("JSON Server is running: ", `http://localhost:${5050}`);
});
