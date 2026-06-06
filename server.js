const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./louvores.db");

db.serialize(() => {
  // Criamos apenas a tabela de músicas, já que a playlist agora é gerada dinâmica na hora!
  db.run(`
    CREATE TABLE IF NOT EXISTS musicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tom_original TEXT NOT NULL,
      cifra TEXT NOT NULL
    )
  `);
});

// Rota para cadastrar músicas novas
app.post("/musicas", (req, res) => {
  const { nome, tom_original, cifra } = req.body;
  db.run(`INSERT INTO musicas (nome, tom_original, cifra) VALUES (?, ?, ?)`,
    [nome, tom_original, cifra],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID, nome, tom_original });
    }
  );
});

// NOVA ROTA: Busca várias músicas pelos nomes enviados por vírgula
app.post("/musicas/buscar-lista", (req, res) => {
  const { nomes } = req.body; // Recebe uma string: "Música 1, Música 2"
  
  if (!nomes) return res.json([]);

  // Transforma "Música 1, Música 2" em ['Música 1', 'Música 2'] limpos
  const listaNomes = nomes.split(",").map(n => n.trim().toLowerCase());

  if (listaNomes.length === 0) return res.json([]);

  // Cria os placeholders (?, ?, ?) dinamicamente para o SQL
  const placeholders = listaNomes.map(() => "?").join(",");
  const query = `SELECT * FROM musicas WHERE LOWER(nome) IN (${placeholders})`;

  db.all(query, listaNomes, (err, rows) => {
    if (err) return res.status(500).json(err);
    
    // Organiza o retorno na exata ordem que você digitou
    const resultadoOrdenado = listaNomes.map(nomeDigitado => {
      const encontrada = rows.find(r => r.nome.toLowerCase() === nomeDigitado);
      if (encontrada) {
        return {
          ...encontrada,
          tom_atual: encontrada.tom_original // Inicializa o tom da playlist com o original
        };
      }
      return { id: Math.random(), nome: `${nomeDigitado} (Não encontrada)`, tom_original: "N/A", tom_atual: "N/A", cifra: "Cadastre esta cifra na API primeiro!" };
    });

    res.json(resultadoOrdenado);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));