<p align="center">
  <img src="logo.png" width="180" />
</p>

<h1 align="center">OpenMusic</h1>

<p align="center">
  <strong>Next-Generation Algorithmic Music Studio</strong>
</p>

<p align="center">
  Bridging AI artistic intention and deterministic musical execution.
</p>

---

### Core Philosophy

The system separates the **Creative Mind** (LLM) from the **Musical Hand** (Python). The LLM determines the mood and style, while Python algorithms generate every single note using mathematical composition rules.

<table>
  <tr>
    <td width="50%">
      <h4>Cinematic Engine</h4>
      <ul>
        <li>Hans Zimmer Ostinato Layers</li>
        <li>Dynamic Pedal Tones</li>
        <li>Modal Chord Progressions</li>
      </ul>
    </td>
    <td width="50%">
      <h4>Studio Technicals</h4>
      <ul>
        <li>44.1kHz High-Fidelity WAV Export</li>
        <li>Real-time Pro Audio Engine</li>
        <li>Deterministic Note Generation</li>
      </ul>
    </td>
  </tr>
</table>

---

### Studio Interface

<p align="center">
  <img src="app.png" width="100%" />
</p>

---

### Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn music_mcp.api_server:app --port 8001

# Frontend
cd frontend
npm install
npm run dev
```

<p align="center">
  Developed for professional algorithmic scoring.
</p>
