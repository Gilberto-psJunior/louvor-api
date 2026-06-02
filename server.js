const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./louvores.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS musicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tom_original TEXT NOT NULL,
      cifra TEXT NOT NULL
    )
  `);
});

app.get("/", (req, res) => {
  res.json({
    mensagem: "API Louvor funcionando!"
  });
});

app.get("/musicas", (req, res) => {
  db.all("SELECT * FROM musicas", [], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

app.post("/musicas", (req, res) => {
  const { nome, tom_original, cifra } = req.body;

  db.run(
    `
      INSERT INTO musicas
      (nome, tom_original, cifra)
      VALUES (?, ?, ?)
    `,
    [nome, tom_original, cifra],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        sucesso: true,
        id: this.lastID,
      });
    }
  );
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor rodando na porta 3000");
});