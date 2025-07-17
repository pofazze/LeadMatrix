// src/pages/WhatsappChatPage.jsx

import React, { useState, useEffect } from 'react';

// Importando a UI de Chat e os estilos necessários
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer, Sidebar, Search, ConversationList, Conversation,
  ChatContainer, MessageList, Message, MessageInput, Avatar,
  ConversationHeader, TypingIndicator
} from '@chatscope/chat-ui-kit-react';

// --- DADOS TEMPORÁRIOS (MOCK DATA) ---
// Mais tarde, isso virá do seu n8n
const mockConversations = [
  {
    whatsappNumber: "5511987654321",
    chatName: "Ana Silva",
    profilePic: "https://ui-avatars.com/api/?name=Ana+Silva",
    info: "Ok, obrigada!"
  },
  {
    whatsappNumber: "5521912345678",
    chatName: "Carlos Souza",
    profilePic: "https://ui-avatars.com/api/?name=Carlos+Souza",
    info: "Recebeu o arquivo?"
  }
];

const mockMessages = {
  "5511987654321": [
    { message: "Olá! Gostaria de saber mais sobre o produto.", direction: 'incoming', sender: 'Ana Silva', position: 'single' },
    { message: "Claro, Ana! Do que você precisa?", direction: 'outgoing', sender: 'Você', position: 'single' }
  ],
  "5521912345678": [
    { message: "Boa tarde, enviei o documento por email.", direction: 'incoming', sender: 'Carlos Souza', position: 'single' }
  ]
};
// --- FIM DOS DADOS TEMPORÁRIOS ---


function WhatsappChatPage() {
  // Estados para controlar a UI
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Conterá o objeto da conversa ativa
  const [messages, setMessages] = useState([]);
  const [messageInputValue, setMessageInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Efeito para carregar os dados iniciais (usando nossos mocks por enquanto)
  useEffect(() => {
    // TODO: No futuro, substituir isso por uma chamada à API do n8n
    setConversations(mockConversations);
  }, []);

  // Função para quando o usuário clica em uma conversa na lista
  const handleConversationClick = (convo) => {
    setActiveChat(convo);
    // Carrega as mensagens do mock correspondente
    // TODO: No futuro, substituir por chamada à API do n8n
    setMessages(mockMessages[convo.whatsappNumber] || []);
  };
  
  // Função para "enviar" uma nova mensagem (por enquanto, só adiciona na tela)
  const handleSend = (text) => {
    if (!activeChat) return;

    const newMessage = {
      message: text,
      direction: 'outgoing',
      sender: 'Você',
      position: 'single'
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setMessageInputValue(""); // Limpa o campo de input

    // TODO: No futuro, chamar o webhook do n8n para enviar a mensagem de verdade
  };

  return (
    // Ajuste a altura conforme necessário (ex: 100vh se ocupar a tela toda)
    <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}> 
      <MainContainer responsive>
        <Sidebar position="left" scrollable>
          <Search placeholder="Procurar..." />
          <ConversationList>
            {conversations.map(convo => (
              <Conversation
                key={convo.whatsappNumber}
                name={convo.chatName}
                info={convo.info}
                active={activeChat?.whatsappNumber === convo.whatsappNumber}
                onClick={() => handleConversationClick(convo)}
              >
                <Avatar src={convo.profilePic} name={convo.chatName} />
              </Conversation>
            ))}
          </ConversationList>
        </Sidebar>

        <ChatContainer>
          {activeChat ? (
            <>
              <ConversationHeader>
                <Avatar src={activeChat.profilePic} name={activeChat.chatName} />
                <ConversationHeader.Content userName={activeChat.chatName} info="online" />
              </ConversationHeader>
              <MessageList typingIndicator={isTyping ? <TypingIndicator content="Digitando..." /> : null}>
                {messages.map((msg, index) => (
                  <Message key={index} model={msg} />
                ))}
              </MessageList>
              <MessageInput
                placeholder="Digite sua mensagem aqui..."
                value={messageInputValue}
                onChange={setMessageInputValue}
                onSend={handleSend}
                attachButton={false}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#aaa', fontSize: '1.2em' }}>
              Selecione uma conversa para começar
            </div>
          )}
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default WhatsappChatPage;