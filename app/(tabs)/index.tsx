import { Platform, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import { Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Video } from 'expo-av';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | {
        description?: string;
        download_link?: string;
        download_source?: string;
        embed_code?: string;
        thumbnail?: string;
        title?: string;
        url?: string;
        video_available?: boolean;
      }
    | null
  >(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const resultSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (result?.download_link) {
      resultFadeAnim.setValue(0);
      resultSlideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(resultFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(resultSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError('Please enter a valid Instagram Reel URL.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('https://instagram-reel-downloader-python.vercel.app/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, include_media: true, media_type: 'jpg' }),
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const json = await res.json();
      setResult(json?.data ?? null);
      if (!json?.data?.download_link) {
        setError('No download link returned for this URL.');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.mainTitle}>Instagram Reel Downloader</ThemedText>
            <HelloWave />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Enter Reel URL
            </ThemedText>
            <ThemedText style={styles.helperText}>
              Paste the Instagram Reel link below to download
            </ThemedText>

            <TextInput
              placeholder="https://www.instagram.com/reel/..."
              placeholderTextColor="#999"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Download</ThemedText>
              )}
            </TouchableOpacity>

            {error ? (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
              </ThemedView>
            ) : null}
          </ThemedView>

          {result?.download_link ? (
            <Animated.View
              style={{
                opacity: resultFadeAnim,
                transform: [{ translateY: resultSlideAnim }],
              }}
            >
              <ThemedView style={styles.resultCard}>
                <ThemedText type="subtitle" style={styles.resultTitle}>
                  Ready to Download
                </ThemedText>
                <br />
                <ThemedText type="subtitle" style={styles.resultTitle}>
                  Caption
                </ThemedText>
                {result.title ? (
                  <ThemedText style={styles.videoTitle} numberOfLines={2}>
                    {result.title}
                  </ThemedText>
                ) : null}

                <ThemedView style={styles.videoContainer}>
                  <Video
                    style={styles.video}
                    source={{ uri: result.download_link }}
                    useNativeControls
                    isLooping
                  />
                </ThemedView>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => Linking.openURL(result.download_link as string)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.downloadButtonText}>
                    📥 Open Download Link
                  </ThemedText>
                </TouchableOpacity>

                {result.description ? (
                  <ThemedView style={styles.descriptionContainer}>
                    <ThemedText style={styles.descriptionLabel}>Description:</ThemedText>
                    <ThemedText style={styles.descriptionText} numberOfLines={3}>
                      {result.description}
                    </ThemedText>
                  </ThemedView>
                ) : null}
              </ThemedView>
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    gap: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 64, 95, 0.2)',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: -8,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#E4405F',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#000',
  },
  button: {
    backgroundColor: '#E4405F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E4405F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.2)',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: -8,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  video: {
    width: '100%',
    height: 400,
  },
  downloadButton: {
    backgroundColor: '#4CD964',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  descriptionText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});