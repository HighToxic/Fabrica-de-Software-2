# 🌍 ThreatMap Live

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Licença](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Backend-Python_|_FastAPI-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_|_D3.js-61DAFB?logo=react&logoColor=black)

## 📖 Descrição do Projeto

O **ThreatMap Live** é um dashboard interativo em tempo real para visualização de ataques cibernéticos em escala global. O sistema mescla dados reais (coletados de APIs públicas de inteligência de ameaças) com tráfego sintético simulado. 

O objetivo principal é demonstrar o processamento de dados de rede, enriquecimento geográfico de IPs e a transmissão de baixa latência via WebSockets para uma interface visual de alto impacto focada na experiência do usuário.

---

## 🎯 Casos de Uso

* **UC01 - Monitoramento Global Constante:** O usuário (analista ou espectador) abre a aplicação e visualiza o fluxo contínuo de ataques globais no mapa-múndi sem precisar recarregar a página.
* **UC02 - Filtragem Específica de Ameaças:** O usuário deseja focar apenas em ataques de força bruta (Brute Force). Ele interage com os filtros no cabeçalho, e o sistema oculta imediatamente as demais ameaças do mapa e do feed.
* **UC03 - Inspeção Detalhada de Incidente:** Ao notar um volume anormal de ataques direcionados a um país específico, o usuário clica em um evento no Feed Lateral. O sistema abre um modal exibindo detalhes técnicos cruzados, como IP mascarado, tipo de vulnerabilidade (CVE, se disponível) e organização de origem.
* **UC04 - Análise de Cenário Atual:** O usuário consulta os gráficos no painel inferior para identificar rapidamente quais são os 5 países que mais estão originando ataques e quais são os maiores alvos nas últimas horas.

---

## 📋 Requisitos do Sistema

### Requisitos Funcionais (RF)
O que o sistema faz.

* **RF01:** O sistema deve renderizar um mapa-múndi interativo em 2D ou 3D.
* **RF02:** O sistema deve animar arcos visuais conectando a geolocalização de origem à de destino de um ataque em tempo real.
* **RF03:** O sistema deve exibir um "Feed de Eventos Ao Vivo" em um painel lateral, atualizado dinamicamente.
* **RF04:** O sistema deve apresentar estatísticas consolidadas dinâmicas (Ex: Top 5 Origens, Top 5 Destinos, Distribuição por Tipo).
* **RF05:** O sistema deve permitir a filtragem visual dos eventos por categoria de ameaça (DDoS, Malware, Phishing, Brute Force).
* **RF06:** O sistema deve exibir um painel detalhado de informações quando um evento específico for selecionado pelo usuário.
* **RF07:** O sistema deve gerar eventos simulados internamente para garantir atividade ininterrupta na interface.

### Requisitos Não Funcionais (RNF)
Como o sistema opera e suas restrições tecnológicas.

* **RNF01 (Comunicação):** A transmissão de dados do servidor para o cliente deve ser feita estritamente via WebSockets para garantir baixa latência.
* **RNF02 (Desempenho Front-end):** A interface deve ser capaz de renderizar no mínimo 30 animações simultâneas mantendo a taxa de quadros (FPS) estável no navegador.
* **RNF03 (Desempenho Back-end):** O enriquecimento de dados geográficos (IP para Lat/Long) deve ocorrer localmente no servidor via banco de dados (GeoLite2) e não via API de terceiros, visando alta velocidade.
* **RNF04 (Resiliência):** O backend deve tratar falhas de rede ou limites de requisição (Rate Limit) das APIs reais de forma silenciosa, compensando a ausência de dados reais com um aumento na geração de dados simulados (Fallback).
* **RNF05 (Gerenciamento de Memória):** O frontend deve descartar da memória (DOM/Canvas) projéteis cujas animações já foram concluídas, e limitar o feed lateral aos últimos 50 eventos para evitar *memory leaks*.

---

## ⚖️ Regras de Negócio (RN)

As regras que ditam o comportamento do fluxo de dados da aplicação:

* **RN01 - Privacidade e Mascaramento de IP:** Por motivos de conformidade e ética, todo IP real oriundo de APIs públicas deve ter seus dois últimos octetos mascarados na interface do usuário (ex: de `189.45.122.10` para `189.45.*.*`). IPs gerados pelo simulador também devem seguir a mesma regra para consistência visual.
* **RN02 - Padronização Visual de Ameaças:** Cada tipo de ataque obrigatoriamente deve seguir a seguinte paleta de cores no mapa e no feed:
  * DDoS: Vermelho
  * Malware: Amarelo
  * Phishing: Azul
  * Brute Force: Laranja
* **RN03 - Taxa de Mistura (Real vs. Simulado):** O sistema não deve ultrapassar a cota diária gratuita das APIs externas. Portanto, a cadência de chamadas externas deve ser controlada, e o simulador interno deve suprir o restante do volume (ex: manter uma proporção de ~20% real / 80% simulado).
* **RN04 - Transparência Acadêmica:** Eventos oriundos de APIs reais devem conter um metadado (ex: `is_real: true`) para que o frontend possa, se desejado, exibir um pequeno selo de autenticidade no evento detalhado.

---

## 🛠️ Tecnologias e Linguagens

A stack tecnológica foi selecionada com foco em performance assíncrona para o backend e renderização otimizada para o frontend.

### Frontend
* **[React (Vite)](https://react.dev/):** Biblioteca principal para construção das interfaces e controle de estado (filtros, feeds, modais).
* **[D3.js](https://d3js.org/) / [Three.js](https://threejs.org/):** Motor de renderização do mapa e cálculo das curvas (Arcos de Bézier) baseadas nas coordenadas geográficas.
* **[Tailwind CSS](https://tailwindcss.com/):** Estilização ágil e criação do tema escuro (Dark Mode).

### Backend
* **[Python 3.10+](https://www.python.org/):** Linguagem base do servidor.
* **[FastAPI](https://fastapi.tiangolo.com/):** Framework web de alta performance para criação de APIs e gerenciamento nativo de WebSockets.
* **[geoip2](https://pypi.org/project/geoip2/):** Biblioteca Python para leitura rápida do banco de dados geográfico.

### Bancos de Dados e Fontes Externas
* **[GeoLite2 by MaxMind](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data):** Banco de dados local (arquivo `.mmdb`) utilizado para tradução ultra-rápida de IPs para coordenadas de Latitude e Longitude.
* **APIs de Threat Intelligence:** Utilizadas para coleta passiva de dados reais.
  * *[AbuseIPDB API](https://www.abuseipdb.com/)* (IPs reportados globalmente)
  * *[Shodan API](https://www.shodan.io/)* (Dispositivos expostos/vulneráveis)

---
*Projeto desenvolvido para fins acadêmicos.*
