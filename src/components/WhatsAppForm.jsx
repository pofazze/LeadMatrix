// src/pages/WhatsappChatPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer, Sidebar, Search, ConversationList, Conversation,
  ChatContainer, MessageList, Message, MessageInput, Avatar,
  ConversationHeader, AttachmentButton
} from '@chatscope/chat-ui-kit-react';

// --- CONFIGURAÇÃO ---
// O frontend SEMPRE usará as variáveis de ambiente públicas.
// O Vite substitui essas variáveis durante o processo de 'build'.
// Em desenvolvimento, o proxy do vite.config.js é usado.
const API_BASE_URL = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '';
const WEBSOCKET_URL = import.meta.env.PROD ? import.meta.env.VITE_WEBSOCKET_URL : '/';

// Cria uma instância do axios para usar a URL base correta
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

const SEU_NOME = "patrickSuyti";

function WhatsappChatPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInputValue, setMessageInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const fileInputRef = useRef(null);
  const activeChatRef = useRef(null);
  activeChatRef.current = activeChat;

  // Efeito 1: Conectar ao WebSocket
  useEffect(() => {
    const newSocket = io(WEBSOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Efeito 2: Buscar a lista inicial de conversas
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/webhook/get-conversations');
        const formattedConversations = response.data.map(convo => ({
            ...convo,
            info: convo.messages?.[0]?.content || (convo.messages?.[0]?.type ? `[Mídia]` : "")
        }));
        setConversations(formattedConversations);
      } catch (error) { console.error("Erro ao buscar conversas:", error); }
      finally { setLoading(false); }
    };
    fetchConversations();
  }, []);

  // Efeito 3: Escutar eventos em tempo real
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (payload) => {
      const currentActiveChat = activeChatRef.current;
      if (currentActiveChat && `conversa-${currentActiveChat.whatsappNumber}` === payload.channel) {
        const { data } = payload;
        const novaMensagem = {
          message: data.content,
          sentTime: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: data.author,
          direction: data.author === SEU_NOME ? 'outgoing' : 'incoming',
          position: 'single',
          type: data.type || 'text',
          payload: (data.type === 'image' || data.type === 'video') ? { src: data.url } : null
        };
        setMessages(prev => [...prev, novaMensagem]);
      }
    };
    socket.on('nova-mensagem', handleNewMessage);
    return () => socket.off('nova-mensagem', handleNewMessage);
  }, [socket]);

  // --- FUNÇÕES DE INTERAÇÃO ---

  const handleConversationClick = async (convo) => {
    setActiveChat(convo);
    if (socket) socket.emit('join-channel', `conversa-${convo.whatsappNumber}`);
    try {
      const response = await apiClient.get(`/webhook/get-chat-history?phone=${convo.whatsappNumber}`);
      const formattedMessages = response.data.map(msg => ({
        message: msg.content,
        sentTime: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: msg.author,
        direction: msg.author === SEU_NOME ? 'outgoing' : 'incoming',
        position: 'single',
        type: msg.type || 'text',
        payload: (msg.type === 'image' || msg.type === 'video') ? { src: msg.url } : null
      }));
      setMessages(formattedMessages);
      if (response.data.some(msg => msg.author !== SEU_NOME && msg.read === false)) {
        apiClient.post('/webhook/mark-as-read', { phone: convo.whatsappNumber });
      }
    } catch (error) { console.error("Erro ao buscar histórico do chat:", error); }
  };
  
  const handleSendText = async (text) => {
    if (!activeChat || !text.trim()) return;
    const payload = { phone: activeChat.whatsappNumber, message: text };
    setMessageInputValue("");
    try {
      await apiClient.post('/webhook/send-text-message', payload);
    } catch (error) { console.error("Erro ao chamar webhook de envio:", error); }
  };

  const handleAttachmentClick = () => {
    if (!activeChat) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !activeChat) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('phone', activeChat.whatsappNumber);
    try {
      await apiClient.post('/webhook/send-media-message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) { console.error("Erro ao enviar mídia:", error); }
    event.target.value = null;
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,video/*" />
      <MainContainer responsive>
        <Sidebar position="left" scrollable>
          <Search placeholder="Procurar..." />
          {loading ? ( <div style={{textAlign: 'center', color: '#aaa', padding: '20px'}}>Carregando...</div> ) : (
            <ConversationList>
              {conversations.map(convo => (
                <Conversation key={convo.whatsappNumber} name={convo.chatName} info={convo.info} active={activeChat?.whatsappNumber === convo.whatsappNumber} onClick={() => handleConversationClick(convo)}>
                  <Avatar src={convo.profilePic || `https://ui-avatars.com/api/?name=${convo.chatName.replace(/\s+/g, "+")}`} name={convo.chatName} />
                </Conversation>
              ))}
            </ConversationList>
          )}
        </Sidebar>

        <ChatContainer>
          {activeChat && (
            <ConversationHeader>
              <Avatar src={activeChat.profilePic || `https://ui-avatars.com/api/?name=${activeChat.chatName.replace(/\s+/g, "+")}`} name={activeChat.chatName} />
              <ConversationHeader.Content userName={activeChat.chatName} />
            </ConversationHeader>
          )}
          <MessageList>
            {!activeChat ? (
              <MessageList.Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '1.2em' }}>
                  Selecione uma conversa para começar
                </div>
              </MessageList.Content>
            ) : (
              messages.map((msg, index) => (
                <Message key={index} model={{ direction: msg.direction, position: 'single' }}>
                  {msg.type === 'text' ? (
                      <Message.TextContent text={msg.message} />
                  ) : msg.type === 'image' && msg.payload ? (
                      <Message.ImageContent src={msg.payload.src} width={250} />
                  ) : msg.type === 'video' && msg.payload ? (
                      <Message.CustomContent>
                          <video width="300" controls> <source src={msg.payload.src} type="video/mp4" /> </video>
                      </Message.CustomContent>
                  ) : (
                    <Message.TextContent text={msg.message || '[Mídia não suportada]'} />
                  )}
                </Message>
              ))
            )}
          </MessageList>
          {activeChat && (
            <MessageInput
              placeholder="Digite sua mensagem aqui..."
              value={messageInputValue}
              onChange={setMessageInputValue}
              onSend={handleSendText}
              onAttachClick={handleAttachmentClick}
              attachButton
            />
          )}
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default WhatsappChatPage;