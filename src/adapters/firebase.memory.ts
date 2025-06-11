import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";
import {
  Memory,
  MemoryMessage,
  Conversation,
  CreateConversationInput,
  MessageFilterOptions,
  BaseMessage,
  NewTimelineEvent,
} from "@voltagent/core";
interface FirebaseMessageData {
  role: string;
  type: string;
  content: string;
  createdAt: number;
  updateAt: number;
  userId: string;
  conversationId: string;
  metatdata: FirebaseMetadataMessage;
}

export interface FirebaseMetadataMessage {
  sender: string;
  type: string;
}

interface DocumentSnapshot {
  id: string;
  data(): FirebaseMessageData;
}
export class FirebaseMemory implements Memory {
  async addMessage(
    message: BaseMessage,
    userId: string,
    conversationId: string
  ): Promise<void> {
    const messageData = {
      role: message.role,
      content: message.content,
      userId,
      conversationId,
      metadata: {
        type: "text",
        sender: message.role === "user" ? "user" : "agent",
      },
      createdAt: new Date().getTime(),
      updateAt: new Date().getTime(),
    };
    const docRef = await db.collection("messages").add(messageData);

    await docRef.update({
      id: docRef.id,
    });
    await db.collection("conversations").doc(conversationId).update({
      lastMessage: messageData.content,
      lastMessageId: docRef.id,
      updatedAt: Timestamp.now(),
    });
  }

  async getMessages(options: MessageFilterOptions): Promise<MemoryMessage[]> {
    try {
      const { userId, conversationId, limit } = options;
      let query: any = db.collection("messages");
      if (userId) {
        query = query.where("userId", "==", userId);
      }
      if (conversationId) {
        query = query.where("conversationId", "==", conversationId);
      }
      query = query.orderBy("createdAt", "desc").limit(limit);
      const snapshot = await query.get();
      const messages = snapshot.docs
        .reverse()
        .map((doc: DocumentSnapshot): MemoryMessage => {
          const data: FirebaseMessageData = doc.data() as FirebaseMessageData;
          return {
            id: doc.id,
            role: data.role,
            type: data.type ?? "text",
            content: data.content,
            createdAt: data.createdAt
              ? new Date(data.createdAt).toISOString()
              : new Date().toISOString(),
          } as MemoryMessage;
        });
      console.log("messages:", messages);
      return messages;
    } catch (error) {
      console.log("error__", error);
      return [];
    }
  }

  async clearMessages(options: {
    userId: string;
    conversationId?: string;
  }): Promise<void> {
    console.log("clearMessages");
    let ref: any = db
      .collection("messages")
      .where("userId", "==", options.userId);

    if (options.conversationId) {
      ref = ref.where("conversationId", "==", options.conversationId);
    }

    const snapshot = await ref.get();

    const batch = db.batch();
    interface DocumentSnapshot {
      ref: FirebaseFirestore.DocumentReference;
    }

    snapshot.docs.forEach((doc: DocumentSnapshot) => batch.delete(doc.ref));
    await batch.commit();
  }

  async createConversation(
    conversation: CreateConversationInput
  ): Promise<Conversation> {
    console.log("createConversation");
    const now = Timestamp.now();
    const docRef = await db
      .collection("conversations")
      .doc(conversation.id)
      .set({
        title: conversation.title,
        resourceId: conversation.resourceId,
        metadata: conversation.metadata ?? {},
        createdAt: now,
        updatedAt: now,
        lastMessage: null,
        lastMessageId: null,
      });

    const doc = await db.collection("conversations").doc(conversation.id).get();
    const data = doc.data();

    return {
      id: doc.id,
      title: data?.title,
      resourceId: data?.resourceId,
      metadata: data?.metadata,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    console.log("getConversation");
    const doc = await db.collection("conversations").doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      id: doc.id,
      resourceId: data?.resourceId,
      title: data?.title,
      metadata: data?.metadata ?? {},
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Conversation;
  }

  async getConversations(resourceId: string): Promise<Conversation[]> {
    console.log("getConversations");
    const snapshot = await db
      .collection("conversations")
      .where("resourceId", "==", resourceId)
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        resourceId: data?.resourceId,
        title: data?.title,
        metadata: data?.metadata ?? {},
        createdAt: data?.createdAt.toDate(),
        updatedAt: data?.updatedAt.toDate(),
      } as Conversation;
    });
  }

  async updateConversation(
    id: string,
    updates: Partial<Omit<Conversation, "id" | "createdAt" | "updatedAt">>
  ): Promise<Conversation> {
    console.log("updateConversation");
    const now = Timestamp.now();
    await db
      .collection("conversations")
      .doc(id)
      .update({
        ...updates,
        updatedAt: now,
      });

    const updated = await db.collection("conversations").doc(id).get();
    const data = updated.data();

    if (!data) {
      throw new Error(`thread with ID ${id} not found after update.`);
    }

    return {
      id,
      resourceId: data.resourceId,
      title: data.title,
      metadata: data.metadata ?? {},
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    } as Conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    console.log("deleteConversation");
    await db.collection("conversations").doc(id).delete();

    const snapshot = await db
      .collection("messages")
      .where("conversationId", "==", id)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async addHistoryEntry(
    key: string,
    value: any,
    agentId: string
  ): Promise<void> {}

  async updateHistoryEntry(
    key: string,
    value: any,
    agentId: string
  ): Promise<void> {}

  async addHistoryStep(
    key: string,
    value: any,
    historyId: string,
    agentId: string
  ): Promise<void> {
    console.log("addHistoryStep");
    const now = Timestamp.now();
    await db
      .collection("historySteps")
      .doc(key)
      .set({
        ...value,
        id: key,
        historyId,
        agentId,
        createdAt: now,
        updatedAt: now,
      });
  }

  async updateHistoryStep(
    key: string,
    value: any,
    historyId: string,
    agentId: string
  ): Promise<void> {}

  async addTimelineEvent(
    key: string,
    value: NewTimelineEvent,
    historyId: string,
    agentId: string
  ): Promise<void> {}

  async getHistoryEntry(key: string): Promise<any | undefined> {}

  async getHistoryStep(key: string): Promise<any | undefined> {}

  async getAllHistoryEntriesByAgent(agentId: string): Promise<any[]> {
    return [];
  }
}
