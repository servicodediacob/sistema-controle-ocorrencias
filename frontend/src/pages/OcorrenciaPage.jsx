// frontend/src/pages/OcorrenciaPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth.js';
import { getObms, getNaturezas, criarOcorrencia as apiCriarOcorrencia } from '../services/api.js';

function OcorrenciaPage() {
  const { usuario, logout } = useAuth();

  const [obms, setObms] = useState([]);
  const [naturezas, setNaturezas] = useState([]);
  const [obmId, setObmId] = useState('');
  const [naturezaId, setNaturezaId] = useState('');
  const [dataOcorrencia, setDataOcorrencia] = useState(new Date().toISOString().slice(0, 10));
  const [obitos, setObitos] = useState([]);
  const [nomeVitima, setNomeVitima] = useState('');
  const [idadeVitima, setIdadeVitima] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function carregarDadosApoio() {
      try {
        const obmsData = await getObms();
        const naturezasData = await getNaturezas();
        setObms(obmsData);
        setNaturezas(naturezasData);
      } catch (err) {
        // CORREÇÃO: Usamos a variável 'err' para registrar o erro no console.
        // Isso remove o aviso "defined but never used".
        console.error("Falha ao carregar dados de apoio:", err);
        setError('Falha ao carregar dados de apoio. Verifique o console para mais detalhes.');
      }
    }
    carregarDadosApoio();
  }, []);

  const adicionarObito = () => {
    if (!nomeVitima || !idadeVitima) {
      alert('Preencha o nome e a idade da vítima.');
      return;
    }
    setObitos([...obitos, { nome_vitima: nomeVitima, idade_vitima: idadeVitima, genero: 'N/I' }]);
    setNomeVitima('');
    setIdadeVitima('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!obmId || !naturezaId || !dataOcorrencia) {
      setError('Todos os campos da ocorrência são obrigatórios.');
      return;
    }

    const payload = {
      ocorrencia: {
        obm_id: obmId,
        natureza_id: naturezaId,
        data_ocorrencia: dataOcorrencia,
      },
      obitos: obitos,
    };

    try {
      await apiCriarOcorrencia(payload);
      setSuccess('Ocorrência registrada com sucesso!');
      setObmId('');
      setNaturezaId('');
      setObitos([]);
    } catch (err) {
      console.error("Falha ao registrar ocorrência:", err);
      setError(err.message || 'Falha ao registrar ocorrência.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Lançamento de Ocorrências</h1>
        <div>
          <span>Olá, {usuario?.nome}</span>
          <button onClick={logout} style={{ marginLeft: '1rem' }}>
            Logout
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <h3>Dados da Ocorrência</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select value={obmId} onChange={(e) => setObmId(e.target.value)} required>
            <option value="">Selecione a OBM</option>
            {obms.map((obm) => (
              <option key={obm.id} value={obm.id}>{obm.nome}</option>
            ))}
          </select>
          <select value={naturezaId} onChange={(e) => setNaturezaId(e.target.value)} required>
            <option value="">Selecione a Natureza</option>
            {naturezas.map((nat) => (
              <option key={nat.id} value={nat.id}>{nat.descricao}</option>
            ))}
          </select>
          <input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} required />
        </div>

        <hr />

        <h3>Registro de Óbitos (Opcional)</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <input type="text" placeholder="Nome da Vítima" value={nomeVitima} onChange={(e) => setNomeVitima(e.target.value)} />
          <input type="number" placeholder="Idade" value={idadeVitima} onChange={(e) => setIdadeVitima(e.target.value)} />
          <button type="button" onClick={adicionarObito}>Adicionar Óbito</button>
        </div>
        <ul>
          {obitos.map((obito, index) => (
            <li key={index}>{obito.nome_vitima}, {obito.idade_vitima} anos</li>
          ))}
        </ul>

        <hr />

        <button type="submit" style={{ padding: '0.75rem', marginTop: '1rem' }}>
          Salvar Ocorrência
        </button>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
      </form>
    </div>
  );
}

export default OcorrenciaPage;
