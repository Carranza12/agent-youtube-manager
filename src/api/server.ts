import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
}

app.post("/sendMessage", async (req: Request, res: Response): Promise<any> => {
  try {
    const { message, userId, conversationId } = req.body;

    if (!message || !userId) {
      return await res.status(400).json({
        response: "message y userId son requeridos",
        conversationId: "",
        messageId: "",
      });
    }

    return await res.json({
      response: "",
      conversationId: "",
      messageId: "",
    });
  } catch (error) {
    console.error("Error en /sendMessage:", error);
    return await res.status(500).json({
      response: "Error interno del servidor",
      conversationId: "",
      messageId: "",
    });
  }
});

app.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
  } catch (error) {
    console.error("Error en /conversations:", error);
    res.status(500).json({
      error: "Error al obtener conversaciones",
    });
  }
});

app.get("/messages/:userId/:conversationId", async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    const { limit = 50 } = req.query;

    res.json({
      messages: [],
      conversationId,
      total: [].length,
    });
  } catch (error) {
    console.error("Error en /messages:", error);
    res.status(500).json({
      error: "Error al obtener mensajes",
    });
  }
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error no manejado:", err);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 API del agente ejecutándose en puerto ${PORT}`);
});

export default app;
