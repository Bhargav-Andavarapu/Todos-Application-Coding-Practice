const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API-1 Get all Todos
app.get("/todos/", async (request, response) => {
  const { priority = "", status = "", search_q = "" } = request.query;
  const getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE "%${search_q}%" AND
            priority LIKE "%${priority}%" AND
            status LIKE "%${status}%";
    `;
  const todoArray = await db.all(getTodosQuery);
  response.send(todoArray);
});

//API-2 Get a todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getATodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            id=${todoId};
    `;
  const getATodo = await db.get(getATodoQuery);
  response.send(getATodo);
});

//API-3 Add a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addATodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status)
        VALUES (
            ${id},
            "${todo}",
            "${priority}",
            "${status}"
        );
    `;
  await db.run(addATodoQuery);
  response.send("Todo Successfully Added");
});

//API-4 Update a todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  let updateColumn = "";

  switch (true) {
    case todoDetails.status !== undefined:
      updateColumn = "Status";
      break;
    case todoDetails.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoDetails.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const getPreviousTodoDetails = `
        SELECT
            *
        FROM
            todo
        WHERE
            id=${todoId};
    `;
  const previousTodo = await db.get(getPreviousTodoDetails);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
        UPDATE
            todo
        SET 
            todo="${todo}",
            priority="${priority}",
            status="${status}"
        WHERE
            id=${todoId};
    `;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API-5 Delete a todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteATodoQuery = `
        DELETE
        FROM
            todo
        WHERE
            id = ${todoId};
    `;
  await db.run(deleteATodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
