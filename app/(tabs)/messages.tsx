import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LoadingDog from '@/components/LoadingDog';

interface Chat {
  id: string;
  matchId: string;
  otherPetId: string;
  otherPetName: string;
  otherPetPhoto: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener la mascota del usuario actual
      const { data: userPet } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!userPet) {
        setLoading(false);
        return;
      }

      // Obtener todos los matches del usuario
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`pet_1_id.eq.${userPet.id},pet_2_id.eq.${userPet.id}`);

      if (!matches || matches.length === 0) {
        setLoading(false);
        return;
      }

      // Para cada match, obtener información de la otra mascota y último mensaje
      const chatsData = await Promise.all(
        matches.map(async (match) => {
          // Determinar cuál es la otra mascota
          const otherPetId = match.pet_1_id === userPet.id ? match.pet_2_id : match.pet_1_id;

          // Obtener información de la otra mascota
          const { data: otherPet } = await supabase
            .from('pets')
            .select('name')
            .eq('id', otherPetId)
            .single();

          // Obtener foto de la otra mascota
          const { data: otherPetPhoto } = await supabase
            .from('pet_photos')
            .select('photo_url')
            .eq('pet_id', otherPetId)
            .eq('is_primary', true)
            .single();

          // Obtener el último mensaje
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Contar mensajes no leídos (enviados por la otra mascota y no leídos)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .eq('from_pet_id', otherPetId)
            .eq('is_read', false);

          return {
            id: match.id,
            matchId: match.id,
            otherPetId,
            otherPetName: otherPet?.name || 'Desconocido',
            otherPetPhoto: otherPetPhoto?.photo_url || null,
            lastMessage: lastMessage?.content || null,
            lastMessageTime: lastMessage?.created_at || match.created_at,
            unreadCount: unreadCount || 0,
          };
        })
      );

      // Ordenar por último mensaje más reciente
      chatsData.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime();
        const timeB = new Date(b.lastMessageTime || 0).getTime();
        return timeB - timeA;
      });

      setChats(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Ahora';
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        router.push(`/chat/${item.matchId}`);
      }}
    >
      {item.otherPetPhoto ? (
        <Image source={{ uri: item.otherPetPhoto }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>🐾</Text>
        </View>
      )}

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.otherPetName}</Text>
          <Text style={styles.chatTime}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage || '¡Es un match! Di hola 👋'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingDog message="Cargando conversaciones..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>💬 Mensajes</Text>
      </View>

      {/* Chats List */}
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>💬</Text>
          <Text style={styles.emptyTitle}>No tienes conversaciones aún</Text>
          <Text style={styles.emptySubtitle}>
            Cuando hagas match con alguien, podrás empezar a chatear aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id}
          style={styles.chatsList}
          contentContainerStyle={styles.chatsListContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  chatsList: {
    flex: 1,
  },
  chatsListContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  chatTime: {
    fontSize: 13,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: '#999',
  },
  lastMessageUnread: {
    color: '#333',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
