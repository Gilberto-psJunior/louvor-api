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

// 1. Rota para cadastrar músicas novas
app.post("/musicas", (req, res) => {
  const { nome, tom_original, cifra } = req.body;
  
  if (!nome || !tom_original || !cifra) {
    return res.status(400).json({ erro: "Preencha todos os campos!" });
  }

  const nomeLimpo = nome.trim();
  const tomLimpo = tom_original.trim();

  db.run(`INSERT INTO musicas (nome, tom_original, cifra) VALUES (?, ?, ?)`,
    [nomeLimpo, tomLimpo, cifra],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID, nome: nomeLimpo, tom_original: tomLimpo });
    }
  );
});

// 2. Rota de listagem geral para conferência
app.get("/musicas", (req, res) => {
  db.all("SELECT * FROM musicas", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 3. Rota de Busca de várias músicas pelos nomes enviados por vírgula
app.post("/musicas/buscar-lista", (req, res) => {
  const { nomes } = req.body;
  
  if (!nomes) return res.json([]);

  const listaNomes = nomes.split(",").map(n => n.trim().toLowerCase()).filter(n => n.length > 0);

  if (listaNomes.length === 0) return res.json([]);

  db.all("SELECT * FROM musicas", [], (err, rows) => {
    if (err) return res.status(500).json(err);

    const resultado = listaNomes.map(nomeDigitado => {
      const encontrada = rows.find(r => {
        const nomeBanco = r.nome.trim().toLowerCase();
        return nomeBanco.includes(nomeDigitado) || nomeDigitado.includes(nomeBanco);
      });

      if (encontrada) {
        return {
          ...encontrada,
          tom_atual: encontrada.tom_original.trim()
        };
      }

      return { 
        id: Math.random(), 
        nome: `${nomeDigitado} (Não encontrada)`, 
        tom_original: "N/A", 
        tom_atual: "N/A", 
        cifra: "Certifique-se de que a música está cadastrada corretamente!" 
      };
    });

    res.json(resultado);
  });
});

// 4. Rota para deletar uma música pelo ID (Movida para o final das rotas)
app.delete("/musicas/:id", (req, res) => {
  const { id } = req.params;
  console.log(`Tentando deletar a música com o ID recebido: ${id}`);

  const query = `DELETE FROM musicas WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      console.error("Erro no banco de dados:", err.message);
      return res.status(500).json({ erro: err.message });
    }

    console.log(`Linhas alteradas no banco: ${this.changes}`);

    if (this.changes === 0) {
      return res.status(404).json({ 
        mensagem: `Nenhuma música encontrada com o ID ${id}. Verifique se ela já não foi apagada.` 
      });
    }

    res.json({ mensagem: `Música com ID ${id} deletada com sucesso!` });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));