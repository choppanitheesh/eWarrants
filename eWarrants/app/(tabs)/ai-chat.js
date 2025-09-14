import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import apiClient from "../../src/api";
import WarrantyCardInChat from "../../src/components/WarrantyCardInChat";
import Toast from "react-native-toast-message";
import { useTheme } from "../../src/contexts/ThemeContext";

const suggestedQuestions = [
  "What expires this month?",
  "Show me my electronics",
  "Which warranty is the oldest?",
];

const AIChatScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const netInfo = useNetInfo();
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: "Hello! You can ask me up to 4 questions about your warranties.",
    },
  ]);
  const [history, setHistory] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const MESSAGE_LIMIT = 4;
  const flatListRef = useRef(null);

  const handleSend = useCallback(
    async (messageText) => {
      if (userMessageCount >= MESSAGE_LIMIT) {
        Toast.show({
          type: "info",
          text1: "Limit Reached",
          text2: "You have used all messages for this session.",
        });
        return;
      }
      const trimmedInput = messageText.trim();
      if (!trimmedInput) return;
      setUserMessageCount((prevCount) => prevCount + 1);
      const userMessage = {
        id: Math.random().toString(),
        sender: "user",
        text: trimmedInput,
      };
      setMessages((prev) => [userMessage, ...prev]);
      setInputText("");
      setIsLoading(true);
      try {
        const response = await apiClient.post("/chat", {
          message: trimmedInput,
          history: history,
        });
        const { response: botText, data: warranties } = response.data;
        const botMessage = {
          id: Math.random().toString(),
          sender: "bot",
          text: botText,
          warranties: warranties || [],
        };
        setMessages((prev) => [botMessage, ...prev]);
        setHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: trimmedInput }] },
          { role: "model", parts: [{ text: botText }] },
        ]);
      } catch (error) {
        console.error("AI Chat Error:", error);
        const errorMessage = {
          id: Math.random().toString(),
          sender: "bot",
          text: "Sorry, I'm having trouble connecting. Please try again later.",
        };
        setMessages((prev) => [errorMessage, ...prev]);
      } finally {
        setIsLoading(false);
      }
    },
    [history, userMessageCount]
  );

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user"
          ? styles.userMessageContainer
          : styles.botMessageContainer,
      ]}
    >
      {item.text && (
        <Text
          style={
            item.sender === "user"
              ? styles.userMessageText
              : styles.botMessageText
          }
        >
          {item.text}
        </Text>
      )}
      {item.warranties && item.warranties.length > 0 && (
        <View style={styles.warrantiesList}>
          {item.warranties.map((warranty) => (
            <WarrantyCardInChat key={warranty._id} warranty={warranty} />
          ))}
        </View>
      )}
    </View>
  );

  const isLimitReached = userMessageCount >= MESSAGE_LIMIT;

  if (netInfo.isConnected === false) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.offlineContainer}>
          <Image
            source={require("../../assets/images/No_Internet.png")}
            style={styles.offlineImage}
          />
          <Text style={styles.offlineTitle}>AI Assistant is Offline</Text>
          <Text style={styles.offlineSubtitle}>
            The AI chat requires an internet connection to work. Please check
            your connection and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={70}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          inverted
        />
        <View>
          {isLoading ? (
            <View style={styles.typingIndicatorContainer}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.typingIndicatorText}>
                eWarrants is thinking...
              </Text>
            </View>
          ) : (
            messages[0]?.sender === "bot" &&
            !isLimitReached && (
              <View style={styles.suggestionsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {suggestedQuestions.map((q, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleSend(q)}
                    >
                      <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )
          )}
          <View style={styles.counterAndInputWrapper}>
            <View style={styles.limitContainer}>
              <Text style={styles.limitText}>
                {userMessageCount} / {MESSAGE_LIMIT} conversations
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isLimitReached && styles.disabledInput]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  isLimitReached
                    ? "Conversation limit reached"
                    : "Ask about your warranties..."
                }
                placeholderTextColor={colors.textSecondary}
                editable={!isLimitReached}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSend(inputText)}
                disabled={isLoading || isLimitReached}
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    isLimitReached && styles.disabledText,
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    messageList: { flex: 1 },
    offlineContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      backgroundColor: colors.background,
    },
    offlineImage: {
      width: 150,
      height: 150,
      marginBottom: 30,
      opacity: 0.7,
    },
    offlineTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textPrimary,
      textAlign: "center",
    },
    offlineSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 24,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 18,
      maxWidth: "85%",
      marginVertical: 6,
    },
    userMessageContainer: {
      backgroundColor: colors.primary,
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    botMessageContainer: {
      backgroundColor: colors.card,
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
    },
    userMessageText: { fontSize: 16, color: colors.primaryText },
    botMessageText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    warrantiesList: { marginTop: 4 },
    counterAndInputWrapper: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    limitContainer: { alignItems: "center", paddingTop: 6 },
    limitText: { fontSize: 12, color: colors.textSecondary },
    inputContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
    input: {
      flex: 1,
      height: 44,
      backgroundColor: colors.inputBackground,
      borderRadius: 22,
      paddingHorizontal: 18,
      fontSize: 16,
      color: colors.textPrimary,
    },
    sendButton: { marginLeft: 10, padding: 10 },
    sendButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    typingIndicatorContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      height: 70,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    typingIndicatorText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textSecondary,
    },
    suggestionsContainer: {
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    suggestionChip: {
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      marginRight: 8,
    },
    suggestionText: { color: colors.textPrimary, fontWeight: "500" },
    disabledInput: {
      backgroundColor: colors.inputBackground,
      color: colors.textSecondary,
    },
    disabledText: { color: colors.textSecondary },
  });

export default AIChatScreen;
