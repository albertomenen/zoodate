import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LoadingDog from '@/components/LoadingDog';

interface Message {
  id: string;
  content: string;
  from_pet_id: string;
  created_at: string;
  is_read: boolean;
}

interface ChatInfo {
  otherPetName: string;
  otherPetPhoto: string | null;
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userPetId, setUserPetId] = useState<string | null>(null);
  const [chatInfo, setChatInfo] = useState<ChatInfo>({
    otherPetName: '',
    otherPetPhoto: null,
  });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatData();

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          // Marcar como leído si el mensaje es del otro usuario
          if (newMsg.from_pet_id !== userPetId) {
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const loadChatData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener la mascota del usuario
      const { data: userPet } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!userPet) return;
      setUserPetId(userPet.id);

      // Obtener información del match
      const { data: match } = await supabase
        .from('matches')
        .select('pet_1_id, pet_2_id')
        .eq('id', matchId)
        .single();

      if (!match) return;

      // Determinar cuál es la otra mascota
      const otherPetId = match.pet_1_id === userPet.id ? match.pet_2_id : match.pet_1_id;

      // Obtener información de la otra mascota
      const { data: otherPet } = await supabase
        .from('pets')
        .select('name')
        .eq('id', otherPetId)
        .single();

      const { data: otherPetPhoto } = await supabase
        .from('pet_photos')
        .select('photo_url')
        .eq('pet_id', otherPetId)
        .eq('is_primary', true)
        .single();

      setChatInfo({
        otherPetName: otherPet?.name || 'Desconocido',
        otherPetPhoto: otherPetPhoto?.photo_url || null,
      });

      // Cargar mensajes existentes
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);

        // Marcar mensajes como leídos
        const unreadMessages = messagesData.filter(
          (msg) => msg.from_pet_id !== userPet.id && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map((msg) => msg.id));
        }
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userPetId) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        from_pet_id: userPetId,
        content: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage('');

      // Scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Ahora' : `${minutes}m`;
    }
    if (hours < 24) {
      return `${hours}h`;
    }

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.from_pet_id === userPetId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingDog message="Cargando chat..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {chatInfo.otherPetPhoto ? (
            <Image source={{ uri: chatInfo.otherPetPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Text style={styles.headerAvatarText}>🐾</Text>
            </View>
          )}
          <Text style={styles.headerName}>{chatInfo.otherPetName}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FF6B6B',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 20,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 44,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: '#FF6B6B',
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});
