const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const Dbpath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const InitializeDbToServer = async () => {
  try {
    db = await open({
      filename: Dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("This app is running smoothly");
    });
  } catch (e) {
    console.log(`DB error is ${e}`);
  }
};

InitializeDbToServer();

const PriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const StatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const BothStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
//API 1 Getting a list of all todos whose status is 'TO DO'

app.get("/todos/", async (request, response) => {
  let GetQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case BothStatusAndPriorityProperty(request.query):
      GetQuery = `SELECT * FROM todo
        Where todo like '%${search_q}%' AND priority LIKE '%${priority}%' AND status like '%${status}%'`;
      break;

    case StatusProperty(request.query):
      GetQuery = `SELECT * FROM todo
        Where status like '%${status}%'`;
      break;

    case PriorityProperty(request.query):
      GetQuery = `SELECT * FROM todo WHERE priority like '%${priority}%'`;
      break;
    default:
      GetQuery = `SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      break;
  }
  const data = await db.all(GetQuery);
  //   console.log(data);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `SELECT * FROM todo WHERE id='${todoId}'`;
  const data = await db.all(query);
  response.send(data);
});

// post method

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const query = `INSERT INTO todo (id,todo,priority,status)
  VALUES('${id}','${todo}','${priority}','${status}')`;
  const data = await db.run(query);
  response.send("Todo Successfully Added");
});

// put method

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let GetName = "";
  switch (true) {
    case requestBody.status !== undefined:
      GetName = "Status";
      break;
    case requestBody.priority !== undefined:
      GetName = "Priority";
      break;
    case requestBody.todo !== undefined:
      GetName = "Todo";
      break;
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const UpdateTodoQuery = `UPDATE todo
  SET
    todo='${todo}',
    priority='${priority}',
    status='${status}'`;
  const GetData = await db.run(UpdateTodoQuery);
  response.send(`${GetName} Updated`);
});

//DELETE Method

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `DELETE FROM todo WHERE id='${todoId}'`;
  const Data = await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
