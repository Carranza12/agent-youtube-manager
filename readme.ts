🤖 YouTube Channel Manager Agent
Agente inteligente desarrollado en TypeScript para la gestión automatizada de un canal de YouTube. Este sistema permite la programación, publicación, análisis y moderación de contenido mediante la integración con la API de YouTube y otras herramientas.

🚀 Características principales
📅 Programación automática de videos

📝 Gestión de títulos, descripciones y etiquetas optimizadas para SEO

💬 Moderación automática de comentarios con reglas personalizables

📊 Análisis de rendimiento de videos (views, likes, retención, etc.)

📢 Notificaciones y alertas configurables por eventos

🔄 Integración con herramientas externas (Google Drive, Notion, Discord, etc.)

🛠️ Tecnologías utilizadas
TypeScript – Lenguaje principal

Node.js – Entorno de ejecución

YouTube Data API v3 – Acceso al canal y datos

Express.js – API local para orquestación

MongoDB / PostgreSQL (opcional) – Para almacenamiento persistente

OAuth2.0 – Autenticación segura con cuentas de Google

📦 Instalación
bash
Copiar
Editar
git clone https://github.com/tuusuario/youtube-agent.git
cd youtube-agent
npm install
⚙️ Configuración
Crea un archivo .env en la raíz con las siguientes variables:

env
Copiar
Editar
YOUTUBE_API_KEY=tu_api_key
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
REDIRECT_URI=http://localhost:3000/oauth2callback
DB_URL=tu_url_de_base_de_datos
Configura tus credenciales de OAuth2 desde la consola de Google Cloud.

Ejecuta el proyecto:

bash
Copiar
Editar
npm run start
🧠 Uso
Puedes controlar el agente mediante endpoints REST o una interfaz de consola (CLI). Algunos comandos disponibles:

bash
Copiar
Editar
# Subir un video programado
npm run upload -- --file="video.mp4" --title="Mi nuevo video" --publishAt="2025-06-08T10:00:00Z"

# Obtener estadísticas del canal
npm run stats

# Revisar y moderar comentarios
npm run moderate
🧪 Tests
bash
Copiar
Editar
npm run test
📂 Estructura del proyecto
arduino
Copiar
Editar
src/
├── agents/
│   └── youtubeAgent.ts
├── api/
│   └── routes.ts
├── services/
│   ├── videoManager.ts
│   ├── analytics.ts
│   └── commentModerator.ts
├── utils/
├── config/
└── index.ts
🔐 Seguridad
Este proyecto utiliza OAuth 2.0 para autenticación y no almacena directamente contraseñas ni tokens sensibles. Asegúrate de manejar correctamente tus credenciales y tokens.

📄 Licencia
MIT License. Puedes usar y modificar este proyecto libremente con atribución.

🤝 Contribuciones
¡Las contribuciones son bienvenidas! Si deseas mejorar el agente o agregar nuevas funciones, abre un issue o un pull request.