import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { ResourceCard } from './src/components/ResourceCard';
import { fetchResources, createResource } from './src/api/resourceApi';
import { API_BASE_URL } from './src/api/client';
import { colors } from './src/theme/colors';
import { fetchDiscoverPosts, createDiscoverPost } from './src/api/discoverApi';
import { oneClickLogin } from './src/api/authApi';
import { fetchUser, updateUser } from './src/api/usersApi';
import {
  fetchPendingPostReviews,
  fetchPendingResourceReviews,
  reviewPost,
  reviewResource,
} from './src/api/adminApi';

const AppContent = () => {
  const resolveMediaUrl = (value) => {
    if (!value) {
      return null;
    }
    return value.startsWith('/') ? `${API_BASE_URL}${encodeURI(value)}` : value;
  };

  const [resources, setResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [selectedResource, setSelectedResource] = useState(null);
  const resourceMediaScrollRef = useRef(null);
  const [resourceMediaIndex, setResourceMediaIndex] = useState(0);
  const [resourceMediaWidth, setResourceMediaWidth] = useState(0);
  const [detailResource, setDetailResource] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDiscoverPost, setSelectedDiscoverPost] = useState(null);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverTab, setDiscoverTab] = useState('推荐');
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({
    phone: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authAgreed, setAuthAgreed] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    city: '',
    bio: '',
    petName: '',
    petBreed: '',
    petGender: '',
    petBirthday: '',
    avatarUrl: '',
    coverUrl: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastPawClickTime, setLastPawClickTime] = useState(0);
  const [walkingDistance, setWalkingDistance] = useState(0.0);
  const [walkingTime, setWalkingTime] = useState(0); // seconds
  const [isWalking, setIsWalking] = useState(false);
  const [showPublishPost, setShowPublishPost] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: '',
    body: '',
    category: '推荐',
    tags: '',
    city: '上海',
    postType: 'image', // 'image' or 'video'
  });
  const [publishImages, setPublishImages] = useState([]);
  const [publishVideo, setPublishVideo] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showSubmitGrassland, setShowSubmitGrassland] = useState(false);
  const [grasslandForm, setGrasslandForm] = useState({
    name: '',
    locationHint: '',
    safetyNote: '',
    bestTime: '',
    city: '上海',
  });
  const [grasslandImages, setGrasslandImages] = useState([]);
  const [grasslandVideos, setGrasslandVideos] = useState([]);
  const [grasslandLoading, setGrasslandLoading] = useState(false);
  const adminUserIds = (process.env.EXPO_PUBLIC_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const isAdminUser = Boolean(
    currentUser?.isAdmin || (currentUser?.id && adminUserIds.includes(currentUser.id)),
  );
  const [showAdminReview, setShowAdminReview] = useState(false);
  const [adminReviewTab, setAdminReviewTab] = useState('resource');
  const [pendingResourceReviews, setPendingResourceReviews] = useState([]);
  const [pendingPostReviews, setPendingPostReviews] = useState([]);
  const [adminReviewLoading, setAdminReviewLoading] = useState(false);
  const [adminReviewError, setAdminReviewError] = useState('');
  const [adminActionLoadingId, setAdminActionLoadingId] = useState('');

  const updateProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchResources({
        city: '上海',
        category: activeCategory === '全部' ? undefined : activeCategory,
      });
      setResources(data);
    };
    load();
  }, [activeCategory]);

  useEffect(() => {
    if (activeTab !== 'discover') {
      return;
    }
    const loadDiscover = async () => {
      setDiscoverLoading(true);
      try {
        const data = await fetchDiscoverPosts({
          city: '上海',
          category: discoverTab,
          q: discoverQuery.trim() || undefined,
        });
        setDiscoverPosts(data);
      } finally {
        setDiscoverLoading(false);
      }
    };
    loadDiscover();
  }, [activeTab, discoverTab, discoverQuery]);

  useEffect(() => {
    setResourceMediaIndex(0);
    if (resourceMediaScrollRef.current?.scrollTo) {
      resourceMediaScrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [selectedResource?.id]);

          useEffect(() => {
    if (!currentUser?.id) {
      return;
    }
    let isActive = true;
    fetchUser(currentUser.id)
      .then((data) => {
        if (!isActive) {
          return;
        }
        setCurrentUser((prev) => ({ ...prev, ...data }));
        setProfileForm({
          // 只有当昵称不是手机号时才预填，否则留空让用户自己填
          nickname: (data.nickname && data.nickname !== data.phone) ? data.nickname : '',
          city: data.city || '',
          bio: data.bio || '',
          petName: data.petName || '',
          petBreed: data.petBreed || '',
          petGender: data.petGender || '',
          petBirthday: data.petBirthday ? data.petBirthday.split('T')[0] : '',
          avatarUrl: data.avatarUrl || '',
          coverUrl: data.coverUrl || '',
        });
      })
      .catch(() => {
        // ignore profile fetch errors for now
      });
    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (showAdminReview && isAdminUser) {
      loadAdminReviews();
    }
  }, [showAdminReview, isAdminUser]);

  const handleOneClickLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await oneClickLogin({
        phone: authForm.phone,
      });
      setCurrentUser(data);
      // 如果没有宠物名，说明是新用户或未完善信息，跳转到完善信息页
      if (!data.petName) {
        setActiveTab('onboarding');
      } else {
        setActiveTab('home');
      }
      setAuthForm({ phone: '' });
    } catch (error) {
      setAuthError(error?.message || '登录失败，请稍后再试');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      return;
    }
    setProfileSaving(true);
    try {
      const data = await updateUser(currentUser.id, profileForm);
      setCurrentUser((prev) => ({ ...prev, ...data }));
      // 如果是在完善信息页，保存后跳转首页
      if (activeTab === 'onboarding') {
        setActiveTab('home');
      }
    } catch (error) {
      alert(error?.message || '保存失败，请稍后再试');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadAdminReviews = async () => {
    if (!currentUser?.id) {
      return;
    }
    setAdminReviewLoading(true);
    setAdminReviewError('');
    try {
      const [resourceRows, postRows] = await Promise.all([
        fetchPendingResourceReviews({ reviewerId: currentUser?.id, limit: 100 }),
        fetchPendingPostReviews({ reviewerId: currentUser?.id, limit: 100 }),
      ]);
      setPendingResourceReviews(resourceRows || []);
      setPendingPostReviews(postRows || []);
    } catch (error) {
      setAdminReviewError(error?.message || 'Failed to load pending reviews');
    } finally {
      setAdminReviewLoading(false);
    }
  };

  const handleReviewResource = async (resourceId, action) => {
    if (!currentUser?.id) {
      return;
    }
    setAdminActionLoadingId(`resource:${resourceId}:${action}`);
    try {
      await reviewResource({
        resourceId,
        action,
        reviewerId: currentUser.id,
      });
      setPendingResourceReviews((prev) => prev.filter((item) => item.id !== resourceId));

      const latestResources = await fetchResources({
        city: '上海',
        category: activeCategory === '全部' ? undefined : activeCategory,
      });
      setResources(latestResources);
    } catch (error) {
      alert(error?.message || 'Resource review failed');
    } finally {
      setAdminActionLoadingId('');
    }
  };

  const handleReviewPost = async (postId, action) => {
    if (!currentUser?.id) {
      return;
    }
    setAdminActionLoadingId(`post:${postId}:${action}`);
    try {
      await reviewPost({
        postId,
        action,
        reviewerId: currentUser.id,
      });
      setPendingPostReviews((prev) => prev.filter((item) => item.id !== postId));

      if (activeTab === 'discover') {
        const latestPosts = await fetchDiscoverPosts({
          city: '上海',
          category: discoverTab,
          q: discoverQuery.trim() || undefined,
        });
        setDiscoverPosts(latestPosts);
      }
    } catch (error) {
      alert(error?.message || 'Post review failed');
    } finally {
      setAdminActionLoadingId('');
    }
  };

  const discoverTabs = ['推荐', '户外', '宠物健康', '宠物训练', '宠物用品', '旅行'];
  const discoverHeights = [210, 160, 190, 220, 170, 200];
  const leftPosts = discoverPosts.filter((_, index) => index % 2 === 0);
  const rightPosts = discoverPosts.filter((_, index) => index % 2 === 1);
  const selectedResourceMedia = selectedResource?.media?.length
    ? selectedResource.media
    : selectedResource?.coverUrl
    ? [
        {
          id: `${selectedResource.id}-cover`,
          type: 'image',
          url: selectedResource.coverUrl,
        },
      ]
    : [];

  const handleResourceMediaScroll = (event) => {
    if (!selectedResourceMedia.length) {
      return;
    }
    const pageWidth = event?.nativeEvent?.layoutMeasurement?.width || resourceMediaWidth || 1;
    const offsetX = event?.nativeEvent?.contentOffset?.x || 0;
    const nextIndex = Math.max(
      0,
      Math.min(
        Math.round(offsetX / pageWidth),
        selectedResourceMedia.length - 1,
      ),
    );
    if (nextIndex !== resourceMediaIndex) {
      setResourceMediaIndex(nextIndex);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {!currentUser ? (
        <View style={styles.authScreen}>
          <Pressable style={styles.authHelpButton}>
            <Text style={styles.authHelpText}>帮助</Text>
          </Pressable>
          <View style={styles.authHero}>
            <Text style={styles.authLogo}>Pétmongo</Text>
            <Text style={styles.authSubtitle}>开启毛孩子的自由社交</Text>
            <View style={styles.authCard}>
              <View style={styles.authPhoneRow}>
                <TextInput
                  style={styles.authPhoneInput}
                  placeholder="请输入手机号"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={authForm.phone}
                  onChangeText={(text) =>
                    setAuthForm((prev) => ({ ...prev, phone: text }))
                  }
                />
                <Pressable style={styles.authPhoneChange}>
                  <Text style={styles.authPhoneChangeText}>更换</Text>
                </Pressable>
    </View>

              {authError ? <Text style={styles.authError}>{authError}</Text> : null}

              <Pressable
                style={[
                  styles.authPrimaryButton,
                  (!authAgreed || !authForm.phone) && styles.authPrimaryButtonDisabled,
                ]}
                onPress={handleOneClickLogin}
                disabled={authLoading || !authAgreed || !authForm.phone}
              >
                <Text style={styles.authPrimaryButtonText}>
                  {authLoading ? '登录中...' : '一键登录'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.authAgreementRow}
                onPress={() => setAuthAgreed((prev) => !prev)}
              >
                <View style={styles.authCheckbox}>
                  {authAgreed ? <View style={styles.authCheckboxDot} /> : null}
                </View>
                <Text style={styles.authAgreementText}>
                  我已阅读并同意《用户协议》《隐私政策》
                </Text>
              </Pressable>

            <Text style={styles.authOtherText}>其他登录方式</Text>
            <View style={styles.authSocialRow}>
              <Pressable style={styles.authSocialButton}>
                <Text style={styles.authSocialIcon}>微信</Text>
              </Pressable>
              <Pressable style={styles.authSocialButton}>
                <Text style={styles.authSocialIcon}>QQ</Text>
              </Pressable>
            </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          {activeTab === 'home' && (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Pétmongo</Text>
              <Text style={styles.subtitle}>本周最活跃 · 上海</Text>
    </View>
            <View style={styles.cityBadge}>
              <Text style={styles.cityText}>上海</Text>
            </View>
          </View>

          <View style={styles.categoryRow}>
            {['全部', '住宿', '草坪', '餐厅', '景点'].map((item) => {
              const isActive = activeCategory === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setActiveCategory(item)}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>真实到访推荐</Text>
              <Pressable
                style={styles.submitGrasslandButtonSmall}
                onPress={() => setShowSubmitGrassland(true)}
              >
                <Text style={styles.submitGrasslandButtonSmallText}>+ 提交草坪</Text>
              </Pressable>
            </View>
            {resources.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedResource(item)}
              >
                <ResourceCard item={item} />
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

          {activeTab === 'discover' && !selectedDiscoverPost && (
        <>
          <View style={styles.discoverHeader}>
            <View>
              <Text style={styles.discoverTitle}>Discover发现</Text>
              <Text style={styles.discoverSubtitle}>
                去探索，去发现，去尝试，和狗狗一起玩
              </Text>
            </View>
            <Pressable style={styles.discoverSearch}>
              <TextInput
                value={discoverQuery}
                onChangeText={setDiscoverQuery}
                placeholder="搜索 笔记 / 用户"
                placeholderTextColor="#999"
                style={styles.discoverSearchInput}
                returnKeyType="search"
              />
            </Pressable>
          </View>

          <View style={styles.discoverTabRow}>
            {discoverTabs.map((tab) => {
              const isActive = tab === discoverTab;
              return (
                <Pressable
                  key={tab}
                  style={[
                    styles.discoverTab,
                    isActive && styles.discoverTabActive,
                  ]}
                  onPress={() => setDiscoverTab(tab)}
                >
                  <Text
                    style={[
                      styles.discoverTabText,
                      isActive && styles.discoverTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            contentContainerStyle={styles.discoverScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.discoverGrid}>
              <View style={styles.discoverColumn}>
                {leftPosts.map((item, index) => (
                  <Pressable
                    key={item.id}
                    style={styles.discoverCard}
                    onPress={() => setSelectedDiscoverPost(item)}
                  >
                    <View
                      style={[
                        styles.discoverMedia,
                        { height: discoverHeights[index % discoverHeights.length] },
                      ]}
                    >
                      {item.coverUrl ? (
                        <Image
                          source={{ uri: resolveMediaUrl(item.coverUrl) }}
                          style={styles.discoverMediaImage}
                        />
                      ) : (
                        <Text style={styles.discoverMediaText}>宠物灵感</Text>
                      )}
                      {item.postType === 'video' && (
                        <View style={styles.discoverMediaPlay}>
                          <Text style={styles.discoverMediaPlayIcon}>▶</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.discoverCardBody}>
                      <Text style={styles.discoverCardTitle}>{item.title}</Text>
                      <View style={styles.discoverMetaRow}>
                        <View style={styles.discoverAvatar} />
                        <Text style={styles.discoverMetaText}>{item.authorName}</Text>
                        <Text style={styles.discoverMetaLike}>♡ {item.likes}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
              <View style={styles.discoverColumn}>
                {rightPosts.map((item, index) => (
                  <Pressable
                    key={item.id}
                    style={styles.discoverCard}
                    onPress={() => setSelectedDiscoverPost(item)}
                  >
                    <View
                      style={[
                        styles.discoverMedia,
                        { height: discoverHeights[(index + 1) % discoverHeights.length] },
                      ]}
                    >
                      {item.coverUrl ? (
                        <Image
                          source={{ uri: resolveMediaUrl(item.coverUrl) }}
                          style={styles.discoverMediaImage}
                        />
                      ) : (
                        <Text style={styles.discoverMediaText}>萌宠日常</Text>
                      )}
                      {item.postType === 'video' && (
                        <View style={styles.discoverMediaPlay}>
                          <Text style={styles.discoverMediaPlayIcon}>▶</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.discoverCardBody}>
                      <Text style={styles.discoverCardTitle}>{item.title}</Text>
                      <View style={styles.discoverMetaRow}>
                        <View style={styles.discoverAvatar} />
                        <Text style={styles.discoverMetaText}>{item.authorName}</Text>
                        <Text style={styles.discoverMetaLike}>♡ {item.likes}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
            {discoverLoading && (
              <Text style={styles.discoverLoadingText}>加载中...</Text>
            )}
            {!discoverLoading && discoverPosts.length === 0 && (
              <Text style={styles.discoverEmptyText}>暂无发现内容</Text>
            )}
          </ScrollView>

          <Pressable
            style={styles.discoverAddButton}
            onPress={() => {
              console.log('Add button clicked');
              setShowPublishPost(true);
            }}
          >
            <Text style={styles.discoverAddIcon}>+</Text>
          </Pressable>
        </>
      )}

          {activeTab === 'discover' && selectedDiscoverPost && (
        <View style={styles.discoverDetailContainer}>
          {selectedDiscoverPost.postType === 'video' ? (
            <ImageBackground
              source={{
                uri: resolveMediaUrl(selectedDiscoverPost.coverUrl) || undefined,
              }}
              style={styles.discoverVideoBackground}
              imageStyle={styles.discoverVideoImage}
            >
              <View style={styles.discoverVideoTopBar}>
                <Pressable
                  style={styles.discoverVideoBackButton}
                  onPress={() => setSelectedDiscoverPost(null)}
                >
                  <Text style={styles.discoverVideoIcon}>〈</Text>
                </Pressable>
                <View style={styles.discoverVideoTopSpacer} />
                <Pressable style={styles.discoverVideoIconButton}>
                  <Text style={styles.discoverVideoIcon}>🔍</Text>
                </Pressable>
                <Pressable style={styles.discoverVideoIconButton}>
                  <Text style={styles.discoverVideoIcon}>↗</Text>
                </Pressable>
              </View>
              <View style={styles.discoverVideoPlayButton}>
                <Text style={styles.discoverVideoPlayIcon}>▶</Text>
              </View>
              <View style={styles.discoverVideoBottomBar}>
                <View style={styles.discoverVideoAuthorRow}>
                  <View style={styles.discoverVideoAvatar} />
                  <Text style={styles.discoverVideoAuthorName}>
                    {selectedDiscoverPost.authorName}
                  </Text>
                  <Pressable style={styles.discoverVideoFollowButton}>
                    <Text style={styles.discoverVideoFollowText}>已关注</Text>
                  </Pressable>
                </View>
                <Text style={styles.discoverVideoCaption}>
                  {selectedDiscoverPost.title}
                </Text>
                <Text style={styles.discoverVideoCaptionSub}>
                  {(selectedDiscoverPost.tags || []).map((tag) => `#${tag}`).join(' ')}
                </Text>
                <View style={styles.discoverVideoActionRow}>
                  <View style={styles.discoverVideoActionItem}>
                    <Text style={styles.discoverVideoActionIcon}>♡</Text>
                    <Text style={styles.discoverVideoActionText}>
                      {selectedDiscoverPost.likes}
                    </Text>
                  </View>
                  <View style={styles.discoverVideoActionItem}>
                    <Text style={styles.discoverVideoActionIcon}>★</Text>
                    <Text style={styles.discoverVideoActionText}>1542</Text>
                  </View>
                  <View style={styles.discoverVideoActionItem}>
                    <Text style={styles.discoverVideoActionIcon}>💬</Text>
                    <Text style={styles.discoverVideoActionText}>371</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <>
              <View style={styles.discoverDetailHeaderBar}>
                <Pressable
                  style={styles.discoverDetailBackButton}
                  onPress={() => setSelectedDiscoverPost(null)}
                >
                  <Text style={styles.discoverDetailBackText}>〈</Text>
                </Pressable>
                <View style={styles.discoverDetailProfile}>
                  <View style={styles.discoverAvatarLarge} />
                  <View style={styles.discoverDetailProfileInfo}>
                    <Text style={styles.discoverDetailAuthorName}>
                      {selectedDiscoverPost.authorName}
                    </Text>
                    <Text style={styles.discoverDetailProfileMeta}>@petmongo</Text>
                  </View>
                </View>
                <Pressable style={styles.discoverDetailFollowButton}>
                  <Text style={styles.discoverDetailFollowText}>已关注</Text>
                </Pressable>
                <Pressable style={styles.discoverDetailShareButton}>
                  <Text style={styles.discoverDetailShareIcon}>↗</Text>
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.discoverDetailScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.discoverDetailCover}>
                  {selectedDiscoverPost.coverUrl ? (
                    <Image
                      source={{ uri: resolveMediaUrl(selectedDiscoverPost.coverUrl) }}
                      style={styles.discoverDetailCoverImage}
                    />
                  ) : (
                    <Text style={styles.discoverDetailCoverText}>笔记封面</Text>
                  )}
                </View>
                <View style={styles.discoverDetailPagerDots}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <View
                      key={`dot-${index}`}
                      style={[
                        styles.discoverDetailPagerDot,
                        index === 0 && styles.discoverDetailPagerDotActive,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.discoverDetailPostTitle}>{selectedDiscoverPost.title}</Text>
                <View style={styles.discoverDetailAuthorRow}>
                  <View style={styles.discoverDetailAuthorInfo}>
                    <Text style={styles.discoverDetailAuthorMeta}>
                      {selectedDiscoverPost.category} · {selectedDiscoverPost.city || '未知'}
                    </Text>
                  </View>
                  <Text style={styles.discoverDetailLikes}>♡ {selectedDiscoverPost.likes}</Text>
                </View>
                <Text style={styles.discoverDetailBody}>
                  这里展示作者的笔记详情内容。可以包含遛狗攻略、体验记录、出行贴士等。
                </Text>
                <View style={styles.discoverDetailTags}>
                  {(selectedDiscoverPost.tags || []).length > 0 ? (
                    selectedDiscoverPost.tags.map((tag) => (
                      <View key={tag} style={styles.discoverDetailTag}>
                        <Text style={styles.discoverDetailTagText}>#{tag}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.discoverDetailTag}>
                      <Text style={styles.discoverDetailTagText}>#宠物日常</Text>
                    </View>
                  )}
                </View>
                <View style={styles.discoverDetailSearchSuggest}>
                  <Text style={styles.discoverDetailSearchText}>猜你想搜 新西兰 tekapo</Text>
                </View>
                <View style={styles.discoverDetailMetaRow}>
                  <Text style={styles.discoverDetailMetaText}>01-19</Text>
                  <Text style={styles.discoverDetailMetaText}>
                    {selectedDiscoverPost.city || '上海'}
                  </Text>
                  <View style={styles.discoverDetailMetaDivider} />
                  <Text style={styles.discoverDetailMetaText}>不喜欢</Text>
                </View>
                <Text style={styles.discoverDetailSectionTitle}>评论区</Text>
                {[
                  { id: 'c1', name: '小栗子', body: '太实用了，收藏了！' },
                  { id: 'c2', name: '豆豆', body: '请问这个地点需要预约吗？' },
                  { id: 'c3', name: '奶茶', body: '狗狗好开心的样子～' },
                ].map((comment) => (
                  <View key={comment.id} style={styles.discoverDetailComment}>
                    <View style={styles.discoverDetailCommentAvatar} />
                    <View style={styles.discoverDetailCommentBody}>
                      <Text style={styles.discoverDetailCommentName}>{comment.name}</Text>
                      <Text style={styles.discoverDetailCommentText}>{comment.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.discoverDetailActionBar}>
                <View style={styles.discoverDetailInput}>
                  <Text style={styles.discoverDetailInputText}>说点什么...</Text>
                </View>
                <View style={styles.discoverDetailActionItem}>
                  <Text style={styles.discoverDetailActionIcon}>♡</Text>
                  <Text style={styles.discoverDetailActionCount}>
                    {selectedDiscoverPost.likes}
                  </Text>
                </View>
                <View style={styles.discoverDetailActionItem}>
                  <Text style={styles.discoverDetailActionIcon}>★</Text>
                  <Text style={styles.discoverDetailActionCount}>1133</Text>
                </View>
                <View style={styles.discoverDetailActionItem}>
                  <Text style={styles.discoverDetailActionIcon}>💬</Text>
                  <Text style={styles.discoverDetailActionCount}>235</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

          {activeTab === 'messages' && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>消息</Text>
          <Text style={styles.placeholderText}>消息功能待开发</Text>
        </View>
      )}

          {activeTab === 'walking' && (
        <View style={styles.walkingSessionContainer}>
          <View style={styles.walkingSessionHeader}>
            <Text style={styles.walkingSessionTitle}>开始遛狗</Text>
            <Pressable
              style={styles.walkingSessionCloseButton}
              onPress={() => {
                setActiveTab('home');
                setIsWalking(false);
                setWalkingDistance(0.0);
                setWalkingTime(0);
              }}
            >
              <Text style={styles.walkingSessionCloseText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.walkingSessionScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Cards Row */}
            <View style={styles.walkingStatsRow}>
              <View style={styles.walkingStatCard}>
                <Text style={styles.walkingStatValue}>
                  {walkingDistance.toFixed(1)}
                </Text>
                <Text style={styles.walkingStatLabel}>距离 (km)</Text>
              </View>
              <View style={styles.walkingStatCard}>
                <Text style={styles.walkingStatValue}>
                  {Math.floor(walkingTime / 60)}:{(walkingTime % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.walkingStatLabel}>时间</Text>
              </View>
              <View style={styles.walkingStatCard}>
                <Text style={styles.walkingStatValue}>
                  {walkingDistance > 0 && walkingTime > 0
                    ? (walkingDistance / (walkingTime / 3600)).toFixed(1)
                    : '0.0'}
                </Text>
                <Text style={styles.walkingStatLabel}>速度 (km/h)</Text>
              </View>
            </View>

            {/* Main Status Card */}
            <View style={styles.walkingMainCard}>
              <View style={styles.walkingMainCardHeader}>
                <Text style={styles.walkingMainCardTitle}>本次遛狗</Text>
                {isWalking && (
                  <View style={styles.walkingStatusBadge}>
                    <View style={styles.walkingStatusDot} />
                    <Text style={styles.walkingStatusText}>进行中</Text>
                  </View>
                )}
              </View>
              <View style={styles.walkingMainCardContent}>
                <Text style={styles.walkingMainDistance}>{walkingDistance.toFixed(2)}</Text>
                <Text style={styles.walkingMainDistanceUnit}>km</Text>
              </View>
              <View style={styles.walkingMainCardFooter}>
                <View style={styles.walkingMainCardItem}>
                  <Text style={styles.walkingMainCardItemLabel}>开始时间</Text>
                  <Text style={styles.walkingMainCardItemValue}>
                    {isWalking ? new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                </View>
                <View style={styles.walkingMainCardDivider} />
                <View style={styles.walkingMainCardItem}>
                  <Text style={styles.walkingMainCardItemLabel}>持续时间</Text>
                  <Text style={styles.walkingMainCardItemValue}>
                    {Math.floor(walkingTime / 60)}分{walkingTime % 60}秒
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.walkingActionsRow}>
              {!isWalking ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.walkingGoButton,
                    pressed && styles.walkingGoButtonPressed,
                  ]}
                  onPress={() => {
                    console.log('GO button clicked - starting walking session');
                    setIsWalking(true);
                    // TODO: Request location permission and start tracking
                  }}
                >
                  <Text style={styles.walkingGoButtonText}>GO</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.walkingPauseButton,
                      pressed && styles.walkingPauseButtonPressed,
                    ]}
                    onPress={() => {
                      console.log('Pause button clicked');
                      setIsWalking(false);
                    }}
                  >
                    <Text style={styles.walkingPauseButtonText}>暂停</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.walkingStopButton,
                      pressed && styles.walkingStopButtonPressed,
                    ]}
                    onPress={() => {
                      console.log('Stop button clicked');
                      setIsWalking(false);
                      setWalkingDistance(0.0);
                      setWalkingTime(0);
                      setActiveTab('home');
                    }}
                  >
                    <Text style={styles.walkingStopButtonText}>结束</Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Tips Section */}
            <View style={styles.walkingTipsCard}>
              <Text style={styles.walkingTipsTitle}>💡 遛狗小贴士</Text>
              <View style={styles.walkingTipsList}>
                <Text style={styles.walkingTipsItem}>• 记得带好牵引绳和水</Text>
                <Text style={styles.walkingTipsItem}>• 避开高温时段，选择清晨或傍晚</Text>
                <Text style={styles.walkingTipsItem}>• 注意观察毛孩子的状态，适时休息</Text>
                <Text style={styles.walkingTipsItem}>• 清理宠物排泄物，做文明铲屎官</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

          {activeTab === 'onboarding' && currentUser && (
        <ScrollView
          contentContainerStyle={styles.onboardingScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.onboardingHeader}>
            <Text style={styles.onboardingTitle}>欢迎来到 Pétmongo</Text>
            <Text style={styles.onboardingSubtitle}>
              完善你和毛孩子的信息，开启自由社交之旅
            </Text>
          </View>

          <View style={styles.onboardingCard}>
            <Text style={styles.profileSectionTitle}>个人信息</Text>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>昵称</Text>
                {formErrors.nickname && <Text style={styles.inlineError}>铲屎官怎么称呼？</Text>}
              </View>
              <TextInput
                style={[styles.profileInput, formErrors.nickname && styles.inputError]}
                value={profileForm.nickname}
                onChangeText={(text) => updateProfileField('nickname', text)}
                placeholder="填写昵称"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>城市</Text>
                {formErrors.city && <Text style={styles.inlineError}>标记你们的冒险基地</Text>}
              </View>
              <TextInput
                style={[styles.profileInput, formErrors.city && styles.inputError]}
                value={profileForm.city}
                onChangeText={(text) => updateProfileField('city', text)}
                placeholder="填写城市"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.profileSectionTitle}>宠物信息</Text>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>宠物名</Text>
                {formErrors.petName && <Text style={styles.inlineError}>怎么称呼这个小家伙？</Text>}
              </View>
              <TextInput
                style={[styles.profileInput, formErrors.petName && styles.inputError]}
                value={profileForm.petName}
                onChangeText={(text) => updateProfileField('petName', text)}
                placeholder="例如：可乐"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>品种</Text>
                {formErrors.petBreed && <Text style={styles.inlineError}>是哪种神奇动物呀？</Text>}
              </View>
              <TextInput
                style={[styles.profileInput, formErrors.petBreed && styles.inputError]}
                value={profileForm.petBreed}
                onChangeText={(text) => updateProfileField('petBreed', text)}
                placeholder="例如：金毛"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>性别</Text>
                {formErrors.petGender && <Text style={styles.inlineError}>请选择它的性别哟</Text>}
              </View>
              <View style={styles.genderRow}>
                {['男孩', '女孩', '恋爱脑已摘除'].map((gender) => {
                  const isActive = profileForm.petGender === gender;
                  return (
                    <Pressable
                      key={gender}
                      style={[
                        styles.genderOption,
                        isActive && styles.genderOptionActive,
                      ]}
                      onPress={() => updateProfileField('petGender', gender)}
                    >
                      <View style={styles.genderCheckbox}>
                        {isActive && <View style={styles.genderCheckboxDot} />}
                      </View>
                      <Text
                        style={[
                          styles.genderText,
                          isActive && styles.genderTextActive,
                        ]}
                      >
                        {gender}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.profileField}>
              <View style={styles.labelRow}>
                <Text style={styles.profileLabel}>生日</Text>
                {formErrors.petBirthday && <Text style={styles.inlineError}>哪天给它过生日？</Text>}
              </View>
              <TextInput
                style={[styles.profileInput, formErrors.petBirthday && styles.inputError]}
                value={profileForm.petBirthday}
                onChangeText={(text) => updateProfileField('petBirthday', text)}
                placeholder="例如：2022-08-20"
                placeholderTextColor="#999"
              />
            </View>

            <Pressable
              style={[
                styles.onboardingButton,
              ]}
              onPress={() => {
                const requiredFields = ['nickname', 'city', 'petName', 'petBreed', 'petGender', 'petBirthday'];
                const newErrors = {};
                let hasError = false;

                requiredFields.forEach(field => {
                  if (!profileForm[field] || !profileForm[field].trim()) {
                     newErrors[field] = true;
                     hasError = true;
                  }
                });

                setFormErrors(newErrors);

                if (hasError) {
                  return;
                }
                handleSaveProfile();
              }}
              disabled={profileSaving}
            >
              <Text style={styles.onboardingButtonText}>
                {profileSaving ? '保存中...' : '开启冒险'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

          {activeTab === 'profile' && currentUser && (
        <View style={styles.profileContainer}>
          <ScrollView
            contentContainerStyle={styles.profileScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Header Section */}
            <View style={styles.profileTopSection}>
              {/* Cover Background */}
              <View style={styles.profileHeaderBg} />
              
              <View style={styles.profileUserInfoRow}>
                <Pressable style={styles.profileAvatarContainer}>
                  {currentUser.avatarUrl ? (
                    <Image
                      source={{ uri: resolveMediaUrl(currentUser.avatarUrl) }}
                      style={styles.profilePageAvatar}
                    />
                  ) : (
                    <View style={styles.profilePageAvatarPlaceholder} />
                  )}
                  <View style={styles.profileAvatarAdd}>
                    <Text style={styles.profileAvatarAddText}>+</Text>
                  </View>
                </Pressable>

                <View style={styles.profileInfoTextColumn}>
                  <Text style={styles.profilePageName}>{currentUser.nickname || '用户'}</Text>
                  <Text style={styles.profilePageIp}>IP属地：{currentUser.city || '未知'}</Text>
                </View>
              </View>

              <Text style={styles.profilePageBio}>
                {currentUser.bio || '点击这里，填写简介'}
              </Text>

              <View style={styles.profilePageGenderTag}>
                <Text style={styles.profilePageGenderText}>
                  {currentUser.petGender === '男孩' ? '♂' : currentUser.petGender === '女孩' ? '♀' : '⚧'}
                </Text>
              </View>

              <View style={styles.profilePageStatsRow}>
                <View style={styles.profilePageStatItem}>
                  <Text style={styles.profilePageStatValue}>{currentUser.followingCount || 0}</Text>
                  <Text style={styles.profilePageStatLabel}>关注</Text>
                </View>
                <View style={styles.profilePageStatItem}>
                  <Text style={styles.profilePageStatValue}>{currentUser.followersCount || 0}</Text>
                  <Text style={styles.profilePageStatLabel}>粉丝</Text>
                </View>
                <View style={styles.profilePageStatItem}>
                  <Text style={styles.profilePageStatValue}>{currentUser.likesReceivedCount || 0}</Text>
                  <Text style={styles.profilePageStatLabel}>获赞与收藏</Text>
                </View>
                
                <Pressable
                  style={styles.profilePageEditButton}
                  onPress={() => setShowEditProfile(true)}
                >
                  <Text style={styles.profilePageEditButtonText}>编辑资料</Text>
                </Pressable>
                <Pressable
                  style={styles.profilePageSettingsButton}
                  onPress={() => setShowSettings(true)}
                >
                  <Text style={styles.profilePageSettingsIcon}>⚙️</Text>
                </Pressable>
                {isAdminUser && (
                  <Pressable
                    style={styles.profilePageAdminButton}
                    onPress={() => {
                      setAdminReviewTab('resource');
                      setShowAdminReview(true);
                    }}
                  >
                    <Text style={styles.profilePageAdminButtonText}>审核后台</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Bottom Content Section */}
            <View style={styles.profileContentSection}>
              <View style={styles.profileTabs}>
                {['笔记', '评论', '收藏', '赞过'].map((tab, index) => (
                  <Pressable key={tab} style={[styles.profileTabItem, index === 0 && styles.profileTabItemActive]}>
                    <Text style={[styles.profileTabText, index === 0 && styles.profileTabTextActive]}>{tab}</Text>
                    {index === 0 && <View style={styles.profileTabIndicator} />}
                  </Pressable>
                ))}
                <Pressable style={styles.profileTabSearch}>
                  <Text>🔍</Text>
                </Pressable>
              </View>

              <View style={styles.profileContentEmpty}>
                <View style={styles.profileContentEmptyIcon} />
                <Text style={styles.profileContentEmptyText}>谁能解释这种现象</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <Modal
        visible={showAdminReview}
        animationType="slide"
        onRequestClose={() => setShowAdminReview(false)}
      >
        <SafeAreaView style={styles.adminReviewContainer}>
          <View style={styles.adminReviewHeader}>
            <Pressable onPress={() => setShowAdminReview(false)}>
              <Text style={styles.adminReviewCloseText}>关闭</Text>
            </Pressable>
            <Text style={styles.adminReviewTitle}>审核后台</Text>
            <Pressable onPress={loadAdminReviews}>
              <Text style={styles.adminReviewRefreshText}>刷新</Text>
            </Pressable>
          </View>

          <View style={styles.adminReviewTabs}>
            <Pressable
              style={[
                styles.adminReviewTabItem,
                adminReviewTab === 'resource' && styles.adminReviewTabItemActive,
              ]}
              onPress={() => setAdminReviewTab('resource')}
            >
              <Text
                style={[
                  styles.adminReviewTabText,
                  adminReviewTab === 'resource' && styles.adminReviewTabTextActive,
                ]}
              >
                草地审核
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.adminReviewTabItem,
                adminReviewTab === 'post' && styles.adminReviewTabItemActive,
              ]}
              onPress={() => setAdminReviewTab('post')}
            >
              <Text
                style={[
                  styles.adminReviewTabText,
                  adminReviewTab === 'post' && styles.adminReviewTabTextActive,
                ]}
              >
                帖子审核
              </Text>
            </Pressable>
          </View>

          {adminReviewError ? (
            <Text style={styles.adminReviewErrorText}>{adminReviewError}</Text>
          ) : null}

          {adminReviewLoading ? (
            <View style={styles.adminReviewLoadingBox}>
              <Text style={styles.adminReviewLoadingText}>加载中...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.adminReviewList}
              showsVerticalScrollIndicator={false}
            >
              {adminReviewTab === 'resource' ? (
                pendingResourceReviews.length > 0 ? (
                  pendingResourceReviews.map((item) => (
                    <View key={item.id} style={styles.adminReviewCard}>
                      <Text style={styles.adminReviewCardTitle}>{item.title}</Text>
                      <Text style={styles.adminReviewCardMeta}>
                        {item.category} · {item.city}
                      </Text>
                      {item.locationHint ? (
                        <Text style={styles.adminReviewCardBody} numberOfLines={2}>
                          地点：{item.locationHint}
                        </Text>
                      ) : null}
                      {item.safety ? (
                        <Text style={styles.adminReviewCardBody} numberOfLines={2}>
                          提示：{item.safety}
                        </Text>
                      ) : null}
                      <View style={styles.adminReviewActions}>
                        <Pressable
                          style={styles.adminReviewApproveButton}
                          disabled={adminActionLoadingId === `resource:${item.id}:approve`}
                          onPress={() => handleReviewResource(item.id, 'approve')}
                        >
                          <Text style={styles.adminReviewApproveText}>通过</Text>
                        </Pressable>
                        <Pressable
                          style={styles.adminReviewRejectButton}
                          disabled={adminActionLoadingId === `resource:${item.id}:reject`}
                          onPress={() => handleReviewResource(item.id, 'reject')}
                        >
                          <Text style={styles.adminReviewRejectText}>拒绝</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.adminReviewEmptyText}>暂无待审核草地</Text>
                )
              ) : pendingPostReviews.length > 0 ? (
                pendingPostReviews.map((item) => (
                  <View key={item.id} style={styles.adminReviewCard}>
                    <Text style={styles.adminReviewCardTitle}>{item.title}</Text>
                    <Text style={styles.adminReviewCardMeta}>
                      {item.authorName} · {item.category}
                    </Text>
                    {item.coverUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(item.coverUrl) }}
                        style={styles.adminReviewPostCover}
                      />
                    ) : null}
                    <View style={styles.adminReviewActions}>
                      <Pressable
                        style={styles.adminReviewApproveButton}
                        disabled={adminActionLoadingId === `post:${item.id}:approve`}
                        onPress={() => handleReviewPost(item.id, 'approve')}
                      >
                        <Text style={styles.adminReviewApproveText}>通过</Text>
                      </Pressable>
                      <Pressable
                        style={styles.adminReviewRejectButton}
                        disabled={adminActionLoadingId === `post:${item.id}:reject`}
                        onPress={() => handleReviewPost(item.id, 'reject')}
                      >
                        <Text style={styles.adminReviewRejectText}>拒绝</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.adminReviewEmptyText}>暂无待审核帖子</Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={styles.editProfileContainer}>
          <View style={styles.editProfileHeader}>
            <Pressable onPress={() => setShowEditProfile(false)}>
              <Text style={styles.editProfileCancel}>取消</Text>
            </Pressable>
            <Text style={styles.editProfileTitle}>编辑资料</Text>
            <Pressable
              onPress={() => {
                handleSaveProfile();
                setShowEditProfile(false);
              }}
              disabled={profileSaving}
            >
              <Text style={styles.editProfileSave}>
                {profileSaving ? '保存...' : '完成'}
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.editProfileContent}>
            <View style={styles.editProfileAvatarSection}>
              <View style={styles.editProfileAvatarWrapper}>
                {profileForm.avatarUrl ? (
                  <Image
                    source={{ uri: resolveMediaUrl(profileForm.avatarUrl) }}
                    style={styles.editProfileAvatar}
                  />
                ) : (
                  <View style={styles.editProfileAvatarPlaceholder} />
                )}
                <View style={styles.editProfileCameraIcon}>
                  <Text style={{ fontSize: 16 }}>📷</Text>
                </View>
              </View>
              <Text style={styles.editProfileAvatarTip}>点击更换头像</Text>
            </View>

            <View style={styles.editProfileForm}>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>昵称</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.nickname}
                  onChangeText={(text) => updateProfileField('nickname', text)}
                  placeholder="填写昵称"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>简介</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.bio}
                  onChangeText={(text) => updateProfileField('bio', text)}
                  placeholder="介绍一下你和毛孩子"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>宠物名</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.petName}
                  onChangeText={(text) => updateProfileField('petName', text)}
                  placeholder="宠物名字"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>宝宝性别</Text>
                <View style={styles.genderRowSmall}>
                  {['男孩', '女孩', '恋爱脑已摘除'].map((gender) => {
                    const isActive = profileForm.petGender === gender;
                    return (
                      <Pressable
                        key={gender}
                        style={[
                          styles.genderOptionSmall,
                          isActive && styles.genderOptionActiveSmall,
                        ]}
                        onPress={() => updateProfileField('petGender', gender)}
                      >
                        <Text
                          style={[
                            styles.genderTextSmall,
                            isActive && styles.genderTextActiveSmall,
                          ]}
                        >
                          {gender}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>宝宝生日</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.petBirthday}
                  onChangeText={(text) => updateProfileField('petBirthday', text)}
                  placeholder="2022-08-20"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>地区</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.city}
                  onChangeText={(text) => updateProfileField('city', text)}
                  placeholder="所在城市"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.editProfileRow}>
                <Text style={styles.editProfileLabel}>品种</Text>
                <TextInput
                  style={styles.editProfileInput}
                  value={profileForm.petBreed}
                  onChangeText={(text) => updateProfileField('petBreed', text)}
                  placeholder="宠物种类"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <Pressable onPress={() => setShowSettings(false)}>
              <Text style={styles.settingsBack}>〈 返回</Text>
            </Pressable>
            <Text style={styles.settingsTitle}>设置</Text>
            <View style={{ width: 44 }} />
          </View>
          <ScrollView contentContainerStyle={styles.settingsContent}>
            <View style={styles.settingsGroup}>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>账号与安全</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>通用设置</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>通知设置</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>隐私设置</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>存储空间</Text>
                <Text style={styles.settingsItemValue}>2.11 GB</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>内容偏好调节</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>收货地址</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>帮助与客服</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemLabel}>关于 Pétmongo</Text>
                <Text style={styles.settingsItemValue}>v1.0.0</Text>
                <Text style={styles.settingsArrow}>〉</Text>
              </View>
            </View>

            <View style={styles.settingsGroup}>
               <Pressable
                style={styles.settingsLogoutButton}
                onPress={() => {
                  setCurrentUser(null);
                  setShowSettings(false);
                  setActiveTab('home');
                }}
              >
                <Text style={styles.settingsLogoutText}>退出登录</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Publish Post Modal */}
      <Modal
        visible={showPublishPost}
        animationType="slide"
        onRequestClose={() => setShowPublishPost(false)}
      >
        <SafeAreaView style={styles.publishContainer}>
          <View style={styles.publishHeader}>
            <Pressable
              onPress={() => {
                setShowPublishPost(false);
                setPublishForm({
                  title: '',
                  body: '',
                  category: '推荐',
                  tags: '',
                  city: '上海',
                  postType: 'image',
                });
                setPublishImages([]);
                setPublishVideo(null);
              }}
            >
              <Text style={styles.publishCancel}>取消</Text>
            </Pressable>
            <Text style={styles.publishTitle}>发布笔记</Text>
            <Pressable
              onPress={async () => {
                if (!publishForm.title.trim()) {
                  alert('请输入标题');
                  return;
                }
                if (!currentUser) {
                  alert('请先登录');
                  return;
                }

                setPublishLoading(true);
                try {
                  const tagsArray = publishForm.tags
                    .split(/[，,]/)
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0);

                  // TODO: 上传图片/视频到服务器，获取URL
                  const coverUrl = publishForm.postType === 'image' && publishImages.length > 0
                    ? publishImages[0].uri
                    : publishForm.postType === 'video' && publishVideo
                    ? publishVideo.uri
                    : null;

                  const mediaUrl = publishForm.postType === 'video' && publishVideo
                    ? publishVideo.uri
                    : null;

                  await createDiscoverPost({
                    title: publishForm.title,
                    authorName: currentUser.nickname || '用户',
                    authorAvatarUrl: currentUser.avatarUrl || null,
                    category: publishForm.category === '推荐' ? '户外' : publishForm.category,
                    city: publishForm.city || '上海',
                    tags: tagsArray,
                    postType: publishForm.postType,
                    coverUrl: coverUrl,
                    mediaUrl: mediaUrl,
                  });

                  // 刷新发现页
                  const data = await fetchDiscoverPosts({
                    city: '上海',
                    category: discoverTab,
                    q: discoverQuery.trim() || undefined,
                  });
                  setDiscoverPosts(data);

                  setShowPublishPost(false);
                  setPublishForm({
                    title: '',
                    body: '',
                    category: '推荐',
                    tags: '',
                    city: '上海',
                    postType: 'image',
                  });
                  setPublishImages([]);
                  setPublishVideo(null);
                  alert('发布成功！');
                } catch (error) {
                  alert(error?.message || '发布失败，请稍后再试');
                } finally {
                  setPublishLoading(false);
                }
              }}
              disabled={publishLoading}
            >
              <Text style={[styles.publishSubmit, publishLoading && styles.publishSubmitDisabled]}>
                {publishLoading ? '发布中...' : '发布'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.publishContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>发布类型</Text>
              <View style={styles.publishTypeRow}>
                <Pressable
                  style={[
                    styles.publishTypeButton,
                    publishForm.postType === 'image' && styles.publishTypeButtonActive,
                  ]}
                  onPress={() => {
                    setPublishForm((prev) => ({ ...prev, postType: 'image' }));
                    setPublishVideo(null);
                  }}
                >
                  <Text
                    style={[
                      styles.publishTypeText,
                      publishForm.postType === 'image' && styles.publishTypeTextActive,
                    ]}
                  >
                    图文
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.publishTypeButton,
                    publishForm.postType === 'video' && styles.publishTypeButtonActive,
                  ]}
                  onPress={() => {
                    setPublishForm((prev) => ({ ...prev, postType: 'video' }));
                    setPublishImages([]);
                  }}
                >
                  <Text
                    style={[
                      styles.publishTypeText,
                      publishForm.postType === 'video' && styles.publishTypeTextActive,
                    ]}
                  >
                    视频
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>标题 *</Text>
              <TextInput
                style={styles.publishInput}
                value={publishForm.title}
                onChangeText={(text) => setPublishForm((prev) => ({ ...prev, title: text }))}
                placeholder="给你的笔记起个标题"
                placeholderTextColor="#999"
                maxLength={160}
              />
            </View>

            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>内容</Text>
              <TextInput
                style={[styles.publishInput, styles.publishTextArea]}
                value={publishForm.body}
                onChangeText={(text) => setPublishForm((prev) => ({ ...prev, body: text }))}
                placeholder="分享你的遛狗体验、宠物友好地点推荐..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>分类</Text>
              <View style={styles.publishCategoryRow}>
                {['推荐', '户外', '宠物健康', '宠物训练', '宠物用品', '旅行'].map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.publishCategoryChip,
                      publishForm.category === cat && styles.publishCategoryChipActive,
                    ]}
                    onPress={() => setPublishForm((prev) => ({ ...prev, category: cat }))}
                  >
                    <Text
                      style={[
                        styles.publishCategoryText,
                        publishForm.category === cat && styles.publishCategoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>标签</Text>
              <TextInput
                style={styles.publishInput}
                value={publishForm.tags}
                onChangeText={(text) => setPublishForm((prev) => ({ ...prev, tags: text }))}
                placeholder="用逗号分隔，例如：遛狗,公园,宠物友好"
                placeholderTextColor="#999"
              />
              <Text style={styles.publishHint}>多个标签请用逗号或中文逗号分隔</Text>
            </View>

            <View style={styles.publishSection}>
              <Text style={styles.publishLabel}>城市</Text>
              <TextInput
                style={styles.publishInput}
                value={publishForm.city}
                onChangeText={(text) => setPublishForm((prev) => ({ ...prev, city: text }))}
                placeholder="所在城市"
                placeholderTextColor="#999"
              />
            </View>

            {/* 图片上传区域（图文类型） */}
            {publishForm.postType === 'image' && (
              <View style={styles.publishSection}>
                <Text style={styles.publishLabel}>图片</Text>
                <View style={styles.publishImageRow}>
                  {publishImages.map((image, index) => (
                    <View key={index} style={styles.publishImageItem}>
                      <Image source={{ uri: image.uri }} style={styles.publishImage} />
                      <Pressable
                        style={styles.publishImageDelete}
                        onPress={() => {
                          setPublishImages((prev) => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Text style={styles.publishImageDeleteText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                  {publishImages.length < 9 && (
                    <Pressable
                      style={styles.publishImageAdd}
                      onPress={async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                          alert('需要访问相册权限');
                          return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          allowsEditing: true,
                          aspect: [4, 3],
                          quality: 0.8,
                        });

                        if (!result.canceled && result.assets[0]) {
                          setPublishImages((prev) => [...prev, result.assets[0]]);
                        }
                      }}
                    >
                      <Text style={styles.publishImageAddText}>+</Text>
                      <Text style={styles.publishImageAddHint}>添加图片</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* 视频上传区域（视频类型） */}
            {publishForm.postType === 'video' && (
              <View style={styles.publishSection}>
                <Text style={styles.publishLabel}>视频</Text>
                {publishVideo ? (
                  <View style={styles.publishVideoContainer}>
                    <View style={styles.publishVideoPreview}>
                      <Text style={styles.publishVideoPreviewText}>视频已选择</Text>
                      <Text style={styles.publishVideoPreviewName} numberOfLines={1}>
                        {publishVideo.fileName || 'video.mp4'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.publishVideoDelete}
                      onPress={() => setPublishVideo(null)}
                    >
                      <Text style={styles.publishVideoDeleteText}>删除</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.publishVideoAdd}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        alert('需要访问相册权限');
                        return;
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                        allowsEditing: false,
                        quality: 1,
                      });

                      if (!result.canceled && result.assets[0]) {
                        setPublishVideo(result.assets[0]);
                      }
                    }}
                  >
                    <Text style={styles.publishVideoAddText}>+ 选择视频</Text>
                    <Text style={styles.publishVideoAddHint}>从相册中选择视频文件</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Submit Grassland Modal */}
      <Modal
        visible={showSubmitGrassland}
        animationType="slide"
        onRequestClose={() => setShowSubmitGrassland(false)}
      >
        <SafeAreaView style={styles.submitGrasslandContainer}>
          <View style={styles.submitGrasslandHeader}>
            <Pressable
              onPress={() => {
                setShowSubmitGrassland(false);
                setGrasslandForm({
                  name: '',
                  locationHint: '',
                  safetyNote: '',
                  bestTime: '',
                  city: '上海',
                  });
                  setGrasslandImages([]);
                  setGrasslandVideos([]);
              }}
            >
              <Text style={styles.submitGrasslandCancel}>取消</Text>
            </Pressable>
            <Text style={styles.submitGrasslandTitle}>提交草坪</Text>
            <Pressable
              onPress={async () => {
                if (!grasslandForm.name.trim()) {
                  alert('请输入草坪名称');
                  return;
                }
                if (!currentUser) {
                  alert('请先登录');
                  return;
                }

                setGrasslandLoading(true);
                try {
                  // TODO: 上传图片/视频到服务器，获取URL
                  const coverUrl = grasslandImages.length > 0
                    ? grasslandImages[0].uri
                    : grasslandVideos.length > 0
                    ? grasslandVideos[0].uri
                    : null;

                  await createResource({
                    name: grasslandForm.name,
                    category: '草坪',
                    city: grasslandForm.city || '上海',
                    locationHint: grasslandForm.locationHint || null,
                    safetyNote: grasslandForm.safetyNote || null,
                    bestTime: grasslandForm.bestTime || null,
                    coverUrl: coverUrl,
                    submitterId: currentUser.id,
                  });

                  // 刷新首页列表
                  const data = await fetchResources({
                    city: '上海',
                    category: activeCategory === '全部' ? undefined : activeCategory,
                  });
                  setResources(data);

                  setShowSubmitGrassland(false);
                  setGrasslandForm({
                    name: '',
                    locationHint: '',
                    safetyNote: '',
                    bestTime: '',
                    city: '上海',
                  });
                  setGrasslandImages([]);
                  setGrasslandVideos([]);
                  alert('提交成功！等待审核通过后将会显示。');
                } catch (error) {
                  alert(error?.message || '提交失败，请稍后再试');
                } finally {
                  setGrasslandLoading(false);
                }
              }}
              disabled={grasslandLoading}
            >
              <Text style={[styles.submitGrasslandSubmit, grasslandLoading && styles.submitGrasslandSubmitDisabled]}>
                {grasslandLoading ? '提交中...' : '提交'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.submitGrasslandContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>草坪名称 *</Text>
              <TextInput
                style={styles.submitGrasslandInput}
                value={grasslandForm.name}
                onChangeText={(text) => setGrasslandForm((prev) => ({ ...prev, name: text }))}
                placeholder="例如：五龙湖公园"
                placeholderTextColor="#999"
                maxLength={120}
              />
            </View>

            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>位置提示</Text>
              <TextInput
                style={styles.submitGrasslandInput}
                value={grasslandForm.locationHint}
                onChangeText={(text) => setGrasslandForm((prev) => ({ ...prev, locationHint: text }))}
                placeholder="例如：上海市松江区广富林路"
                placeholderTextColor="#999"
                maxLength={160}
              />
            </View>

            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>安全提示</Text>
              <TextInput
                style={[styles.submitGrasslandInput, styles.submitGrasslandTextArea]}
                value={grasslandForm.safetyNote}
                onChangeText={(text) => setGrasslandForm((prev) => ({ ...prev, safetyNote: text }))}
                placeholder="例如：有交通管制，没有机动车危险"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={240}
              />
            </View>

            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>推荐时段</Text>
              <TextInput
                style={styles.submitGrasslandInput}
                value={grasslandForm.bestTime}
                onChangeText={(text) => setGrasslandForm((prev) => ({ ...prev, bestTime: text }))}
                placeholder="例如：清晨、傍晚"
                placeholderTextColor="#999"
                maxLength={64}
              />
            </View>

            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>城市</Text>
              <TextInput
                style={styles.submitGrasslandInput}
                value={grasslandForm.city}
                onChangeText={(text) => setGrasslandForm((prev) => ({ ...prev, city: text }))}
                placeholder="所在城市"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.submitGrasslandSection}>
              <Text style={styles.submitGrasslandLabel}>图片和视频</Text>
              
              {/* 图片区域 */}
              <View style={styles.submitGrasslandImageRow}>
                {grasslandImages.map((image, index) => (
                  <View key={`img-${index}`} style={styles.submitGrasslandImageItem}>
                    <Image source={{ uri: image.uri }} style={styles.submitGrasslandImage} />
                    <Pressable
                      style={styles.submitGrasslandImageDelete}
                      onPress={() => {
                        setGrasslandImages((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Text style={styles.submitGrasslandImageDeleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {grasslandImages.length < 5 && (
                  <Pressable
                    style={styles.submitGrasslandImageAdd}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        alert('需要访问相册权限');
                        return;
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                      });

                      if (!result.canceled && result.assets[0]) {
                        setGrasslandImages((prev) => [...prev, result.assets[0]]);
                      }
                    }}
                  >
                    <Text style={styles.submitGrasslandImageAddText}>+</Text>
                    <Text style={styles.submitGrasslandImageAddHint}>添加图片</Text>
                  </Pressable>
                )}
              </View>

              {/* 视频区域 */}
              <View style={styles.submitGrasslandVideoRow}>
                {grasslandVideos.map((video, index) => (
                  <View key={`vid-${index}`} style={styles.submitGrasslandVideoItem}>
                    <View style={styles.submitGrasslandVideoPreview}>
                      <Text style={styles.submitGrasslandVideoPreviewIcon}>▶</Text>
                      <Text style={styles.submitGrasslandVideoPreviewName} numberOfLines={1}>
                        {video.fileName || 'video.mp4'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.submitGrasslandVideoDelete}
                      onPress={() => {
                        setGrasslandVideos((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Text style={styles.submitGrasslandVideoDeleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {grasslandVideos.length < 3 && (
                  <Pressable
                    style={styles.submitGrasslandVideoAdd}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        alert('需要访问相册权限');
                        return;
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                        allowsEditing: false,
                        quality: 1,
                      });

                      if (!result.canceled && result.assets[0]) {
                        setGrasslandVideos((prev) => [...prev, result.assets[0]]);
                      }
                    }}
                  >
                    <Text style={styles.submitGrasslandVideoAddText}>+</Text>
                    <Text style={styles.submitGrasslandVideoAddHint}>添加视频</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

          {!selectedResource && !detailResource && !selectedDiscoverPost && activeTab !== 'onboarding' && activeTab !== 'walking' && (
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNavBackground}>
            <View style={styles.bottomNavSide}>
              <Pressable
                style={[
                  styles.bottomNavItem,
                  activeTab === 'home' && styles.bottomNavItemActive,
                ]}
                onPress={() => {
                  setActiveTab('home');
                  setSelectedResource(null);
                  setDetailResource(null);
                  setSelectedDiscoverPost(null);
                }}
              >
                <Text
                  style={[
                    styles.bottomNavText,
                    activeTab === 'home' && styles.bottomNavTextActive,
                  ]}
                >
                  首页
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.bottomNavItem,
                  activeTab === 'discover' && styles.bottomNavItemActive,
                ]}
                onPress={() => {
                  setActiveTab('discover');
                  setSelectedResource(null);
                  setDetailResource(null);
                  setSelectedDiscoverPost(null);
                }}
              >
                <Text
                  style={[
                    styles.bottomNavText,
                    activeTab === 'discover' && styles.bottomNavTextActive,
                  ]}
                >
                  发现
                </Text>
              </Pressable>
            </View>
            
            <View style={styles.bottomNavCenterPlaceholder} />

            <View style={styles.bottomNavSide}>
              <Pressable
                style={[
                  styles.bottomNavItem,
                  activeTab === 'messages' && styles.bottomNavItemActive,
                ]}
                onPress={() => {
                  setActiveTab('messages');
                  setSelectedResource(null);
                  setDetailResource(null);
                  setSelectedDiscoverPost(null);
                }}
              >
                <Text
                  style={[
                    styles.bottomNavText,
                    activeTab === 'messages' && styles.bottomNavTextActive,
                  ]}
                >
                  消息
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.bottomNavItem,
                  activeTab === 'profile' && styles.bottomNavItemActive,
                ]}
                onPress={() => {
                  setActiveTab('profile');
                  setSelectedResource(null);
                  setDetailResource(null);
                  setSelectedDiscoverPost(null);
                }}
              >
                <Text
                  style={[
                    styles.bottomNavText,
                    activeTab === 'profile' && styles.bottomNavTextActive,
                  ]}
                >
                  我的
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.goButtonWrap,
              pressed && styles.goButtonPressed,
            ]}
            onPress={() => {
              const now = Date.now();
              // Debounce: only allow one click per second
              if (now - lastPawClickTime < 1000) {
                console.log('paw_clicked: debounced');
                return;
              }
              setLastPawClickTime(now);
              console.log('paw_clicked: navigating to walking session');
              // Immediately navigate to Walking Session page via tab switch
              setActiveTab('walking');
              setSelectedResource(null);
              setDetailResource(null);
              setSelectedDiscoverPost(null);
            }}
          >
            <Image
              source={require('./src/assets/ui/paw_filled.png')}
              style={styles.goButtonImage}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      )}

          <Modal
        visible={Boolean(selectedResource)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedResource(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedResource && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedResource.title}
                  </Text>
                  <Pressable onPress={() => setSelectedResource(null)}>
                    <Text style={styles.modalClose}>关闭</Text>
                  </Pressable>
                </View>
                <Text style={styles.modalMeta}>
                  {selectedResource.category} · {selectedResource.city}
                </Text>
                <Text style={styles.modalSection}>图片</Text>
                <View
                  style={styles.mediaCarousel}
                  onLayout={(event) => {
                    const width = event?.nativeEvent?.layout?.width || 0;
                    if (width > 0 && width !== resourceMediaWidth) {
                      setResourceMediaWidth(width);
                    }
                  }}
                >
                  <ScrollView
                    ref={resourceMediaScrollRef}
                    horizontal
                    pagingEnabled
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onScroll={handleResourceMediaScroll}
                    onScrollEndDrag={handleResourceMediaScroll}
                    onMomentumScrollEnd={handleResourceMediaScroll}
                    contentContainerStyle={styles.mediaRow}
                  >
                    {selectedResourceMedia.length > 0 ? (
                      selectedResourceMedia.map((media, index) => {
                        const url = media.url?.startsWith('/')
                          ? `${API_BASE_URL}${encodeURI(media.url)}`
                          : encodeURI(media.url || '');
                        return (
                          <View
                            key={`${media.id}-${index}`}
                            style={[styles.mediaItem, { width: resourceMediaWidth || 220 }]}
                          >
                            {media.type === 'image' && url ? (
                              <Image source={{ uri: url }} style={styles.mediaImage} />
                            ) : (
                              <View style={styles.mediaPlaceholder}>
                                <Text style={styles.mediaPlaceholderText}>暂无图片</Text>
                              </View>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View style={[styles.mediaItem, { width: resourceMediaWidth || 220 }]}>
                        <View style={styles.mediaPlaceholder}>
                          <Text style={styles.mediaPlaceholderText}>暂无图片</Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                  {selectedResourceMedia.length > 0 ? (
                    <View style={styles.mediaPageBadge}>
                      <Text style={styles.mediaPageBadgeText}>
                        {resourceMediaIndex + 1}/{selectedResourceMedia.length}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {selectedResourceMedia.length > 1 ? (
                  <View style={styles.mediaDots}>
                    {selectedResourceMedia.map((media, index) => (
                      <View
                        key={`dot-${media.id}-${index}`}
                        style={[
                          styles.mediaDot,
                          index === resourceMediaIndex && styles.mediaDotActive,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
                <Text style={styles.modalSection}>地点</Text>
                <Pressable
                  style={styles.locationCard}
                  onPress={() => {
                    const keyword =
                      selectedResource.mapQuery ||
                      selectedResource.locationHint ||
                      selectedResource.title;
                    const url = `https://uri.amap.com/search?keyword=${encodeURIComponent(
                      keyword,
                    )}&city=${encodeURIComponent(selectedResource.city)}`;
                    Linking.openURL(url);
                  }}
                >
                  <Text style={styles.locationText}>
                    {selectedResource.locationHint || '查看高德地图'}
                  </Text>
                  <Text style={styles.locationLink}>打开高德地图</Text>
                </Pressable>
                <Pressable
                  style={styles.detailButton}
                  onPress={() => {
                    setDetailResource(selectedResource);
                    setSelectedResource(null);
                  }}
                >
                  <Text style={styles.detailButtonText}>进入草坪地图</Text>
                </Pressable>
                <Text style={styles.modalSection}>安全提示</Text>
                <Text style={styles.modalBody}>
                  {selectedResource.safety || '暂无'}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

          <Modal
        visible={Boolean(detailResource)}
        animationType="slide"
        onRequestClose={() => setDetailResource(null)}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setDetailResource(null)}>
              <Text style={styles.detailBack}>返回</Text>
            </Pressable>
            <Text style={styles.detailTitle}>草坪地图</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapSky} />
            <View style={styles.mapHill} />
            <View style={styles.mapArea}>
              {resources
                .filter((item) => item.category === '草坪')
                .map((item, index) => {
                  const positions = [
                    { top: '18%', left: '12%' },
                    { top: '40%', left: '28%' },
                    { top: '25%', left: '60%' },
                    { top: '55%', left: '70%' },
                    { top: '62%', left: '38%' },
                  ];
                  const pos = positions[index % positions.length];
                  return (
                    <View
                      key={item.id}
                      style={[styles.mapPoint, pos]}
                    >
                      <Text style={styles.mapPointLabel} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>

          {detailResource && (
            <View style={styles.detailInfo}>
              <Text style={styles.detailInfoTitle}>{detailResource.title}</Text>
              <Text style={styles.detailInfoMeta}>
                {detailResource.category} · {detailResource.city}
              </Text>
              <Text style={styles.detailInfoText}>
                {detailResource.locationHint || '暂无地点描述'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

        </>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
    marginTop: 4,
  },
  cityBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  cityText: {
    fontWeight: '800',
    color: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    elevation: 0,
  },
  categoryChipActive: {
    backgroundColor: '#FF7043',
    borderColor: '#333',
    transform: [{ translateY: 0 }],
  },
  categoryText: {
    fontWeight: '700',
    color: '#666',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 4,
    paddingRight: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  discoverHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  discoverTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
  },
  discoverSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '700',
  },
  discoverSearch: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 170,
  },
  discoverSearchInput: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  discoverTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  discoverTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  discoverTabActive: {
    borderColor: '#333',
  },
  discoverTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  discoverTabTextActive: {
    color: '#333',
    fontWeight: '900',
  },
  discoverScrollContent: {
    paddingBottom: 150,
    paddingHorizontal: 20,
  },
  discoverGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  discoverColumn: {
    flex: 1,
    gap: 12,
  },
  discoverCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 16,
    overflow: 'hidden',
  },
  discoverMedia: {
    backgroundColor: '#E6E6FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  discoverMediaImage: {
    width: '100%',
    height: '100%',
  },
  discoverMediaPlay: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverMediaPlayIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  discoverMediaText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '800',
  },
  discoverCardBody: {
    padding: 10,
    gap: 6,
  },
  discoverCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  discoverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discoverAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8BC34A',
    borderWidth: 2,
    borderColor: '#333',
  },
  discoverMetaText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
  },
  discoverMetaLike: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#333',
    fontWeight: '800',
  },
  discoverLoadingText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  discoverEmptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  discoverAddButton: {
    position: 'absolute',
    right: 24,
    bottom: 126,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  discoverAddIcon: {
    fontSize: 30,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: -2,
    color: '#333',
    fontWeight: '900',
  },
  discoverDetailContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  discoverDetailHeaderBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discoverDetailBackButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  discoverDetailBackText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '700',
  },
  discoverDetailScroll: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  discoverDetailProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  discoverDetailProfileInfo: {
    gap: 2,
  },
  discoverDetailProfileMeta: {
    fontSize: 11,
    color: '#888',
  },
  discoverDetailFollowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  discoverDetailFollowText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  discoverDetailShareButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  discoverDetailShareIcon: {
    fontSize: 16,
    color: '#333',
  },
  discoverDetailCover: {
    height: 320,
    borderRadius: 12,
    backgroundColor: '#E6E9F6',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  discoverDetailCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discoverDetailCoverText: {
    color: '#333',
    fontWeight: '700',
  },
  discoverDetailPlayCenter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverDetailPlayCenterIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  discoverDetailPagerDots: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  discoverDetailPagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d0d0d0',
  },
  discoverDetailPagerDotActive: {
    backgroundColor: '#ff4d4f',
  },
  discoverDetailPostTitle: {
    marginTop: 16,
    fontSize: 20,
    color: '#111',
    fontWeight: '900',
  },
  discoverDetailAuthorRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoverAvatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d9d9d9',
  },
  discoverDetailAuthorName: {
    fontSize: 14,
    color: '#222',
    fontWeight: '700',
  },
  discoverDetailAuthorMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  discoverDetailLikes: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  discoverDetailTags: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  discoverDetailTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  discoverDetailTagText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  discoverDetailSectionTitle: {
    marginTop: 16,
    fontSize: 14,
    color: '#111',
    fontWeight: '800',
  },
  discoverDetailBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  discoverDetailSearchSuggest: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  discoverDetailSearchText: {
    fontSize: 12,
    color: '#666',
  },
  discoverDetailMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discoverDetailMetaText: {
    fontSize: 12,
    color: '#888',
  },
  discoverDetailMetaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#d7d7d7',
  },
  discoverDetailComment: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  discoverDetailCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D9D9D9',
  },
  discoverDetailCommentBody: {
    marginLeft: 10,
    flex: 1,
  },
  discoverDetailCommentName: {
    fontSize: 12,
    color: '#222',
    fontWeight: '700',
  },
  discoverDetailCommentText: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },
  discoverDetailActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discoverDetailInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  discoverDetailInputText: {
    fontSize: 12,
    color: '#888',
  },
  discoverDetailActionItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverDetailActionIcon: {
    fontSize: 16,
    color: '#222',
  },
  discoverDetailActionCount: {
    fontSize: 10,
    color: '#444',
    marginTop: 2,
  },
  discoverVideoBackground: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  discoverVideoImage: {
    resizeMode: 'cover',
  },
  discoverVideoTopBar: {
    paddingTop: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverVideoBackButton: {
    padding: 6,
  },
  discoverVideoTopSpacer: {
    flex: 1,
  },
  discoverVideoIconButton: {
    padding: 6,
    marginLeft: 6,
  },
  discoverVideoIcon: {
    color: '#fff',
    fontSize: 16,
  },
  discoverVideoPlayButton: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverVideoPlayIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  discoverVideoBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  discoverVideoAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discoverVideoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d9d9d9',
  },
  discoverVideoAuthorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  discoverVideoFollowButton: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  discoverVideoFollowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  discoverVideoCaption: {
    marginTop: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  discoverVideoCaptionSub: {
    marginTop: 4,
    color: '#e6e6e6',
    fontSize: 12,
  },
  discoverVideoActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  discoverVideoActionItem: {
    alignItems: 'center',
  },
  discoverVideoActionIcon: {
    color: '#fff',
    fontSize: 16,
  },
  discoverVideoActionText: {
    marginTop: 2,
    color: '#fff',
    fontSize: 10,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
  },
  onboardingScroll: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#f6f1ff',
    flexGrow: 1,
  },
  onboardingHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  onboardingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
    gap: 12,
    shadowColor: '#333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  onboardingButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  onboardingButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '900',
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 8,
  },
  genderOptionActive: {
    borderColor: '#333',
    backgroundColor: '#f0f9ff',
  },
  genderCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  genderCheckboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  genderText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  genderTextActive: {
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineError: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: '700',
  },
  inputError: {
    borderColor: '#e53935',
    backgroundColor: '#ffebee',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  profileScrollContent: {
    paddingBottom: 120,
    backgroundColor: '#F2F4F8',
  },
  profileTopSection: {
    backgroundColor: '#F2F4F8',
    paddingBottom: 24,
  },
  profileHeaderBg: {
    height: 180,
    backgroundColor: '#8BC34A',
    marginBottom: -60,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  profileUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  profileAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profilePageAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#fff',
  },
  profilePageAvatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#eee',
  },
  profileAvatarAdd: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF7043',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  profileAvatarAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  profileInfoTextColumn: {
    flex: 1,
    marginBottom: 4,
  },
  profilePageName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  profilePageId: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    marginBottom: 2,
  },
  profilePageIp: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
  },
  profilePageBio: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  profilePageGenderTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  profilePageGenderText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '900',
  },
  profilePageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profilePageStatItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  profilePageStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  profilePageStatLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    marginTop: 2,
  },
  profilePageEditButton: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#fff',
    marginRight: 8,
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  profilePageEditButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '800',
  },
  profilePageSettingsButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#fff',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  profilePageSettingsIcon: {
    fontSize: 14,
    color: '#333',
  },
  profilePageAdminButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#8BC34A',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  profilePageAdminButtonText: {
    fontSize: 12,
    color: '#222',
    fontWeight: '900',
  },
  adminReviewContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  adminReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3ED',
    backgroundColor: '#fff',
  },
  adminReviewTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#222',
  },
  adminReviewCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  adminReviewRefreshText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  adminReviewTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 4,
  },
  adminReviewTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
  },
  adminReviewTabItemActive: {
    backgroundColor: '#EAF3DD',
  },
  adminReviewTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  adminReviewTabTextActive: {
    color: '#2A6B1F',
    fontWeight: '900',
  },
  adminReviewErrorText: {
    marginHorizontal: 16,
    marginTop: 8,
    color: '#B00020',
    fontSize: 12,
    fontWeight: '700',
  },
  adminReviewLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminReviewLoadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  adminReviewList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  adminReviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE5EF',
  },
  adminReviewCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  adminReviewCardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#667085',
    fontWeight: '600',
  },
  adminReviewCardBody: {
    marginTop: 4,
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  adminReviewPostCover: {
    marginTop: 8,
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#ECEFF3',
  },
  adminReviewActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  adminReviewApproveButton: {
    flex: 1,
    backgroundColor: '#3FAE2A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  adminReviewApproveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  adminReviewRejectButton: {
    flex: 1,
    backgroundColor: '#EAEEF4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  adminReviewRejectText: {
    color: '#3B4756',
    fontSize: 13,
    fontWeight: '800',
  },
  adminReviewEmptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },
  profilePageExtraCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  profilePageExtraCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  profilePageExtraCardIcon: {
    fontSize: 18,
  },
  profilePageExtraCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  profilePageExtraCardSubtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  profileContentSection: {
    backgroundColor: '#F2F4F8',
    flex: 1,
    minHeight: 400,
    marginTop: 10,
  },
  profileTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    height: 48,
    backgroundColor: '#F2F4F8',
  },
  profileTabItem: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  profileTabItemActive: {
  },
  profileTabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
  },
  profileTabTextActive: {
    color: '#333',
    fontWeight: '900',
    fontSize: 16,
  },
  profileTabIndicator: {
    position: 'absolute',
    bottom: -2,
    left: 14,
    right: 14,
    height: 4,
    backgroundColor: '#8BC34A',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  profileTabSearch: {
    marginLeft: 'auto',
    padding: 10,
  },
  profileContentEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  profileContentEmptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  profileContentEmptyText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  profilePublishButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  profilePublishButtonText: {
    color: '#333',
    fontWeight: '900',
    fontSize: 14,
  },
  editProfileContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editProfileCancel: {
    fontSize: 16,
    color: '#666',
  },
  editProfileTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  editProfileSave: {
    fontSize: 16,
    color: '#8BC34A',
    fontWeight: '700',
  },
  editProfileContent: {
    paddingBottom: 40,
  },
  editProfileAvatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  editProfileAvatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    position: 'relative',
  },
  editProfileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  editProfileCameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileAvatarTip: {
    fontSize: 12,
    color: '#999',
  },
  editProfileForm: {
    paddingHorizontal: 16,
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  editProfileLabel: {
    width: 80,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  editProfileInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  editProfileValueDisabled: {
    flex: 1,
    fontSize: 15,
    color: '#999',
    textAlign: 'right',
  },
  genderRowSmall: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  genderOptionSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
  },
  genderOptionActiveSmall: {
    backgroundColor: '#8BC34A',
  },
  genderTextSmall: {
    fontSize: 12,
    color: '#666',
  },
  genderTextActiveSmall: {
    color: '#fff',
    fontWeight: '700',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsBack: {
    fontSize: 16,
    color: '#333',
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  settingsContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  settingsGroupTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    marginBottom: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  settingsItemLabel: {
    fontSize: 15,
    color: '#333',
  },
  settingsItemValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  settingsArrow: {
    fontSize: 14,
    color: '#ccc',
  },
  settingsLogoutButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 16,
    alignItems: 'center',
  },
  settingsLogoutText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '600',
  },
  authScreen: {
    flex: 1,
    backgroundColor: '#f6f1ff',
    justifyContent: 'center',
  },
  authHelpButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 20,
  },
  authHelpText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  authHero: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  authLogo: {
    fontSize: 40,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  authSubtitle: {
    marginBottom: 30,
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  authCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    padding: 24,
    gap: 16,
    shadowColor: '#333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  authPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authPhoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
    backgroundColor: '#fff',
  },
  authPhoneChange: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#fff',
  },
  authPhoneChangeText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '800',
  },
  authPrimaryButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  authPrimaryButtonDisabled: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
    shadowColor: 'transparent',
  },
  authPrimaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '900',
  },
  authAgreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  authCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  authCheckboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  authAgreementText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  authOtherText: {
    marginTop: 10,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontWeight: '700',
  },
  authSocialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 8,
  },
  authSocialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  authSocialIcon: {
    fontSize: 12,
    color: '#333',
    fontWeight: '800',
  },
  authError: {
    fontSize: 12,
    color: '#e53935',
  },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    gap: 12,
  },
  profileCover: {
    height: 140,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileCoverText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d9d9d9',
  },
  profileBasicInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  profileField: {
    gap: 6,
  },
  profileLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  profileInput: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fff',
  },
  profileInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  profileSectionTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  profileSaveButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  profileSaveButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  bottomNavContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 64,
    pointerEvents: 'box-none',
  },
  bottomNavBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#333',
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  bottomNavSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomNavCenterPlaceholder: {
    width: 70,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
  },
  bottomNavItemActive: {
    backgroundColor: '#8BC34A', // 草系绿
    borderWidth: 2,
    borderColor: '#333',
  },
  bottomNavText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomNavTextActive: {
    color: '#333',
    fontWeight: '800',
    fontSize: 13,
  },
  goButtonWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -35,
    bottom: 15,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    zIndex: 1000,
    overflow: 'visible',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  goButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  goButtonImage: {
    width: 70, // 新图测试尺寸
    height: 70,
    resizeMode: 'contain',
    marginTop: 4, // 下移一点点
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 16, 32, 0.35)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 26,
    gap: 10,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  modalClose: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  modalSection: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  detailButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  locationCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  locationText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  locationLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#dff2c9',
    paddingHorizontal: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailBack: {
    color: colors.primary,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#9fd28f',
    height: 320,
    marginBottom: 16,
  },
  mapSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#bfe7ff',
  },
  mapHill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#7ecf88',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapPoint: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8ccf8f',
    maxWidth: 120,
  },
  mapPointLabel: {
    fontSize: 10,
    color: colors.textPrimary,
  },
  detailInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  detailInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailInfoMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailInfoText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  mediaCarousel: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  mediaRow: {
    paddingVertical: 4,
    gap: 0,
  },
  mediaItem: {
    height: 220,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  mediaImage: {
    width: '100%',
    height: 220,
  },
  mediaPageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mediaPageBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  mediaDots: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  mediaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CFD6E0',
  },
  mediaDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  walkingSessionContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  walkingSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F2F4F8',
  },
  walkingSessionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  walkingSessionCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkingSessionCloseText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
  },
  walkingSessionScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  walkingStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  walkingStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  walkingStatLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
  },
  walkingMainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 20,
    shadowColor: '#333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingMainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walkingMainCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  walkingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8BC34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  walkingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  walkingStatusText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
  },
  walkingMainCardContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  walkingMainDistance: {
    fontSize: 56,
    fontWeight: '900',
    color: '#333',
  },
  walkingMainDistanceUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#666',
    marginLeft: 8,
  },
  walkingMainCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  walkingMainCardItem: {
    flex: 1,
    alignItems: 'center',
  },
  walkingMainCardDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  walkingMainCardItemLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    marginBottom: 4,
  },
  walkingMainCardItemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '800',
  },
  walkingActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  walkingGoButton: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingGoButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  walkingGoButtonText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  walkingPauseButton: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FF7043',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingPauseButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  walkingPauseButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  walkingStopButton: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingStopButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  walkingStopButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  walkingTipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 20,
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  walkingTipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  walkingTipsList: {
    gap: 8,
  },
  walkingTipsItem: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    lineHeight: 20,
  },
  publishContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  publishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  publishCancel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  publishTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  publishSubmit: {
    fontSize: 16,
    color: '#8BC34A',
    fontWeight: '700',
  },
  publishSubmitDisabled: {
    color: '#ccc',
  },
  publishContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  publishSection: {
    marginBottom: 24,
  },
  publishLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  publishInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  publishTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  publishHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontWeight: '600',
  },
  publishCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  publishCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  publishCategoryChipActive: {
    backgroundColor: '#8BC34A',
    borderColor: '#333',
  },
  publishCategoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  publishCategoryTextActive: {
    color: '#333',
    fontWeight: '800',
  },
  publishTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  publishTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishTypeButtonActive: {
    backgroundColor: '#8BC34A',
    borderColor: '#333',
  },
  publishTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  publishTypeTextActive: {
    color: '#333',
    fontWeight: '800',
  },
  publishImageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  publishImageItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  publishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  publishImageDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishImageDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  publishImageAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  publishImageAddText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '700',
  },
  publishImageAddHint: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  publishVideoContainer: {
    gap: 12,
  },
  publishVideoPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  publishVideoPreviewText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },
  publishVideoPreviewName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  publishVideoDelete: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  publishVideoDeleteText: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '700',
  },
  publishVideoAdd: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishVideoAddText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  publishVideoAddHint: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  submitGrasslandButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#8BC34A',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginLeft: 4,
  },
  submitGrasslandButtonSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
  },
  submitGrasslandContainer: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  submitGrasslandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  submitGrasslandCancel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitGrasslandTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  submitGrasslandSubmit: {
    fontSize: 16,
    color: '#8BC34A',
    fontWeight: '700',
  },
  submitGrasslandSubmitDisabled: {
    color: '#ccc',
  },
  submitGrasslandContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  submitGrasslandSection: {
    marginBottom: 24,
  },
  submitGrasslandLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  submitGrasslandInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  submitGrasslandTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitGrasslandImageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  submitGrasslandImageItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  submitGrasslandImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitGrasslandImageDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitGrasslandImageDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  submitGrasslandImageAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  submitGrasslandImageAddText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '700',
  },
  submitGrasslandImageAddHint: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  submitGrasslandVideoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  submitGrasslandVideoItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  submitGrasslandVideoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  submitGrasslandVideoPreviewIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '700',
  },
  submitGrasslandVideoPreviewName: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  submitGrasslandVideoDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitGrasslandVideoDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  submitGrasslandVideoAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  submitGrasslandVideoAddText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '700',
  },
  submitGrasslandVideoAddHint: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  submitGrasslandVideoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  submitGrasslandVideoItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  submitGrasslandVideoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  submitGrasslandVideoPreviewIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '700',
  },
  submitGrasslandVideoPreviewName: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  submitGrasslandVideoDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitGrasslandVideoDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  submitGrasslandVideoAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  submitGrasslandVideoAddText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '700',
  },
  submitGrasslandVideoAddHint: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
});
