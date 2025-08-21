import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import apiClient from '../api/apiClient';
import Popup from './Popup';
import { AlertTriangle } from 'lucide-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, Sidebar, Search, ConversationList, Conversation, ChatContainer, MessageList, Message, MessageInput, Avatar, ConversationHeader } from '@chatscope/chat-ui-kit-react';

const WEBSOCKET_URL = import.meta.env.PROD ? (import.meta as any).env.VITE_WEBSOCKET_URL : '/';
const SEU_NOME = 'patrickSuyti';

const createMessageObject = (msgData: any) => ({
	id: msgData.messageId || `${Date.now()}-${Math.random()}`,
	message: msgData.content,
	sentTime: new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
	sender: msgData.author,
	direction: msgData.author === SEU_NOME ? 'outgoing' : 'incoming',
	position: 'single',
	type: msgData.type || 'text',
	payload: (msgData.type === 'image' || msgData.type === 'video') ? { src: msgData.url } : null,
	status: msgData.status,
});

type Props = { embed?: boolean };
export default function WhatsappChat({ embed = false }: Props) {
	const [loading, setLoading] = useState(true);
	const [conversations, setConversations] = useState<any[]>([]);
	const [activeChat, setActiveChat] = useState<any | null>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [messageInputValue, setMessageInputValue] = useState('');
	const [socket, setSocket] = useState<Socket | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [open, setOpen] = useState(true);

	useEffect(() => {
		const socketInstance = io(WEBSOCKET_URL as any);
		setSocket(socketInstance);
		socketInstance.on('connect', () => { console.log(`[Socket] Conectado. ID: ${socketInstance.id}`); });
		return () => { socketInstance.close(); };
	}, []);

	useEffect(() => {
		const fetchConversations = async () => {
			try {
				setLoading(true);
				const response = await apiClient.get('/webhook/get-conversations');
				const dataToMap = Array.isArray(response.data) ? response.data : [];
				const formattedConversations = dataToMap.map((convo: any) => ({ ...convo, info: convo.messages?.[0]?.content || (convo.messages?.[0]?.type ? `[Mídia]` : '') }));
				setConversations(formattedConversations);
			} catch (error) { console.error('Erro ao buscar conversas:', error); }
			finally { setLoading(false); }
		};
		fetchConversations();
	}, []);

	const addNewMessageToState = (payload: any) => {
		setActiveChat((currentActiveChat: any) => {
			if (currentActiveChat && `conversa-${currentActiveChat.whatsappNumber}` === payload.channel) {
				const novaMensagem = createMessageObject(payload.data);
				setMessages((prevMessages) => [...prevMessages, novaMensagem]);
			}
			return currentActiveChat;
		});
	};

	useEffect(() => {
		if (!socket) return;
		const handleNewMessage = (payload: any) => { addNewMessageToState(payload); };
		socket.on('nova-mensagem', handleNewMessage);
		return () => { socket.off('nova-mensagem', handleNewMessage); };
	}, [socket]);

	const handleConversationClick = async (convo: any) => {
		setActiveChat(convo);
		if (socket) socket.emit('join-channel', `conversa-${convo.whatsappNumber}`);
		try {
			const response = await apiClient.get(`/webhook/get-chat-history?phone=${convo.whatsappNumber}`);
			const dataToMap = Array.isArray(response.data) ? response.data : [];
			const formattedMessages = dataToMap.map(createMessageObject);
			setMessages(formattedMessages);
			if (dataToMap.some((msg: any) => msg.author !== SEU_NOME && msg.read === false)) {
				apiClient.post('/webhook/mark-as-read', { phone: convo.whatsappNumber });
			}
		} catch (error) { console.error('Erro ao buscar histórico:', error); }
	};

	const handleSendText = async (text: string) => {
		if (!activeChat || !text.trim()) return;
		const payload = { phone: activeChat.whatsappNumber, message: text };
		setMessageInputValue('');
		try { await apiClient.post('/webhook/send-text-message', payload); }
		catch (error) { console.error('Erro ao enviar:', error); }
	};

	const handleAttachmentClick = () => { if (!activeChat) return; fileInputRef.current?.click(); };
	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]; if (!file || !activeChat) return;
		const formData = new FormData(); formData.append('file', file); formData.append('phone', activeChat.whatsappNumber);
		try { await apiClient.post('/webhook/send-media-message', formData); }
		catch (error) { console.error('Erro ao enviar mídia:', error); }
		event.currentTarget.value = '';
	};

	return (
	<>
			<div style={{ height: embed ? 'auto' : '100vh', position: 'relative' }}>
				<input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,video/*" />
				<MainContainer responsive>
					<Sidebar position="left" scrollable>
						<Search placeholder="Procurar..." />
						{loading ? (
							<div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Carregando...</div>
						) : (
							<ConversationList>
								{conversations.map((convo) => (
									<Conversation key={convo.whatsappNumber} name={convo.chatName} info={convo.info} active={activeChat?.whatsappNumber === convo.whatsappNumber} onClick={() => handleConversationClick(convo)}>
										<Avatar src={convo.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.chatName)}`} name={convo.chatName} />
									</Conversation>
								))}
							</ConversationList>
						)}
					</Sidebar>
					<ChatContainer>
						{activeChat && (
							<ConversationHeader>
								<Avatar src={activeChat.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.chatName)}`} name={activeChat.chatName} />
								<ConversationHeader.Content userName={activeChat.chatName} />
							</ConversationHeader>
						)}
						<MessageList>
							{!activeChat ? (
								// @ts-ignore
								<MessageList.Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
									<div style={{ textAlign: 'center', color: '#aaa', fontSize: '1.2em' }}>Selecione uma conversa para começar</div>
								</MessageList.Content>
							) : (
								messages.map((msg) => (
									<Message key={msg.id} model={{ direction: msg.direction as any, position: 'single' }}>
										{msg.type === 'text' ? (
											<Message.TextContent text={msg.message} />
										) : msg.type === 'image' && msg.payload ? (
											<Message.ImageContent src={msg.payload.src} width={250} />
										) : msg.type === 'video' && msg.payload ? (
											<Message.CustomContent>
												<video width="300" controls>
													<source src={msg.payload.src} type="video/mp4" />
												</video>
											</Message.CustomContent>
										) : (
											<Message.TextContent text={msg.message || '[Mídia não suportada]'} />
										)}
									</Message>
								))
							)}
						</MessageList>
						{activeChat && (
							<MessageInput placeholder="Digite sua mensagem aqui..." value={messageInputValue} onChange={setMessageInputValue} onSend={handleSendText} onAttachClick={handleAttachmentClick} attachButton />
						)}
					</ChatContainer>
				</MainContainer>
				<Popup open={open} onClose={() => setOpen(false)} title="Atenção" message="A função de chat está em modo beta, por isso alguns bugs irão aparecer." buttonText="Entendi, prosseguir" icon={<AlertTriangle className="w-8 h-8 text-red-500" />} />
			</div>
		</>
	);
}
