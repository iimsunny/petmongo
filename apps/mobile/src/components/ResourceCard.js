import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { API_BASE_URL } from '../api/client';

export const ResourceCard = ({ item }) => {
  const coverTint = item.coverTint || '#dcd2ff';
  const distance = item.distance || '附近';
  const tags = item.tags || [];
  const media = item.media || [];
  const cover = media.find((entry) => entry.type === 'image');
  const coverUrl = cover?.url
    ? cover.url.startsWith('/')
      ? `${API_BASE_URL}${encodeURI(cover.url)}`
      : encodeURI(cover.url)
    : null;
  return (
    <View style={styles.card}>
      <View style={[styles.cover, { backgroundColor: coverTint }]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>暂无图片</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.verified ? '已验证' : '待验证'}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {item.category} · {distance}
        </Text>
        <View style={styles.tagRow}>
          {tags.map((tag, index) => (
            <View style={styles.tag} key={`${tag}-${index}`}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.safetyRow}>
          <Text style={styles.safetyLabel}>安全提示</Text>
          <Text style={styles.safetyText}>{item.safety}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2, // 游戏风黑边
    borderColor: '#333',
    elevation: 0,
  },
  cover: {
    height: 160,
    borderTopLeftRadius: 18, // 稍微减小一点，适配外边框
    borderTopRightRadius: 18,
    borderBottomWidth: 2, // 图片下方加一条黑线
    borderBottomColor: '#333',
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900', // 更粗
    color: '#333',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#42A5F5', // 水系蓝
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  tagText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  safetyRow: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  safetyLabel: {
    fontSize: 12,
    color: '#F57C00', // 深橙色
    fontWeight: '800',
  },
  safetyText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
});


