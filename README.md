<p align="center">
  <img src="logo.png" width="160" />
</p>

<h1 align="center">OpenMusic</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Pydantic-E92063?style=flat-square&logo=pydantic&logoColor=white" />
  <img src="https://img.shields.io/badge/Tone.js-F162A5?style=flat-square&logo=music&logoColor=white" />
</p>

<p align="center">
  <strong>High-Fidelity Algorithmic Music Studio</strong>
</p>

---

### Intentional Sound Design

OpenMusic separates high-level creative direction from technical note placement. The LLM handles the artistic intention, while deterministic Python algorithms generate every note using mathematical composition rules.

<div align="center">
  <table>
    <tr>
      <td><b>Cinematic Scoring</b></td>
      <td><b>Technical Engine</b></td>
      <td><b>User Interface</b></td>
    </tr>
    <tr>
      <td>Hans Zimmer style Ostinato</td>
      <td>Deterministic note generation</td>
      <td>Modern DAW Studio aesthetic</td>
    </tr>
    <tr>
      <td>Dynamic Pedal Tones</td>
      <td>44.1kHz WAV high-fidelity export</td>
      <td>Interactive piano-roll editor</td>
    </tr>
    <tr>
      <td>Modal modal interchange</td>
      <td>Probability-based rhythmic variance</td>
      <td>Real-time transport controls</td>
    </tr>
  </table>
</div>

---

### Studio Interface

<p align="center">
  <img src="app.png" width="100%" />
</p>

---

### Setup

<details>
<summary><b>1. Technical Backend</b></summary>

```bash
cd backend
pip install -r requirements.txt
uvicorn music_mcp.api_server:app --port 8001
```
</details>

<details>
<summary><b>2. Studio Frontend</b></summary>

```bash
cd frontend
npm install
npm run dev
```
</details>

---

<p align="center">
  <code>OPENMUSIC_CORE_V2</code>
</p>
