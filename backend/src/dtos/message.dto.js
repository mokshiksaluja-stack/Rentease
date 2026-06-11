export class MessageDTO {
  constructor(message) {
    this.id = message.id;
    this.conversationId = message.conversationId;
    this.senderId = message.senderId;
    this.receiverId = message.receiverId;
    this.message = message.message;
    this.isRead = message.isRead;
    this.createdAt = message.createdAt;
  }

  static fromEntity(message) {
    if (!message) return null;
    return new MessageDTO(message);
  }

  static fromEntities(messages) {
    if (!messages) return [];
    return messages.map(msg => MessageDTO.fromEntity(msg));
  }
}

export class ConversationDTO {
  constructor(conversation, currentUserId) {
    this.id = conversation.id;
    this.propertyId = conversation.propertyId;
    this.createdAt = conversation.createdAt;
    this.updatedAt = conversation.updatedAt;

    // Format Property details
    this.property = conversation.property ? {
      id: conversation.property.id,
      title: conversation.property.title,
      city: conversation.property.city,
      state: conversation.property.state,
      address: conversation.property.address
    } : null;

    // Format Participant Users
    this.tenant = conversation.tenant ? {
      id: conversation.tenant.id,
      name: conversation.tenant.name,
      avatar: conversation.tenant.avatar,
      isOnline: conversation.tenant.isOnline,
      lastSeen: conversation.tenant.lastSeen
    } : null;

    this.landlord = conversation.landlord ? {
      id: conversation.landlord.id,
      name: conversation.landlord.name,
      avatar: conversation.landlord.avatar,
      isOnline: conversation.landlord.isOnline,
      lastSeen: conversation.landlord.lastSeen
    } : null;

    // Fetch details of the counterparty
    this.otherUser = currentUserId === conversation.tenantId ? this.landlord : this.tenant;

    // Format last message details
    this.lastMessage = conversation.messages && conversation.messages.length > 0 
      ? MessageDTO.fromEntity(conversation.messages[0])
      : null;

    // unreadCount is computed dynamically in repository or service layer
    this.unreadCount = conversation._count && conversation.messages
      ? conversation.messages.filter(m => m.receiverId === currentUserId && !m.isRead).length
      : 0;
  }

  static fromEntity(conversation, currentUserId) {
    if (!conversation) return null;
    return new ConversationDTO(conversation, currentUserId);
  }

  static fromEntities(conversations, currentUserId) {
    if (!conversations) return [];
    return conversations.map(conv => ConversationDTO.fromEntity(conv, currentUserId));
  }
}
