# Règles Firestore — À copier dans Firebase Console
# Firebase Console → Firestore Database → Règles → Publier

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isParticipant(conversationId) {
      return isSignedIn() && 
             request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    
    // ── Users ──────────────────────────────────────────────
    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['subscription', 'isVerified', 'verificationStatus', 'publicationLimits']);
      allow delete: if false;
    }
    
    // ── Products ───────────────────────────────────────────
    match /products/{productId} {
      allow read: if true;
      allow create: if isSignedIn() && 
                       request.resource.data.sellerId == request.auth.uid;
      // Le vendeur peut tout modifier
      allow update: if isSignedIn() && resource.data.sellerId == request.auth.uid;
      // N'importe quel utilisateur connecté peut incrémenter viewCount ou whatsappClickCount
      // (compteurs de vues et contacts — champs en lecture seule pour le vendeur)
      allow update: if isSignedIn() &&
                       request.auth.uid != resource.data.sellerId &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['viewCount', 'whatsappClickCount']);
      allow delete: if isSignedIn() && resource.data.sellerId == request.auth.uid;
    }
    
    // ── Conversations ──────────────────────────────────────
    match /conversations/{conversationId} {
      allow read: if isSignedIn() && (
        request.auth.uid in resource.data.participants
      );
      allow create: if isSignedIn() && 
                       request.auth.uid in request.resource.data.participants &&
                       request.resource.data.participants.size() == 2;
      allow update: if isSignedIn() && 
                       request.auth.uid in resource.data.participants;
      allow delete: if false;
      
      // ── Messages (sous-collection) ──────────────────────
      match /messages/{messageId} {
        allow read: if isParticipant(conversationId);
        allow create: if isSignedIn() && (
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants
        );
        allow update: if isParticipant(conversationId);
        allow delete: if false;
      }
    }
    
    // ── Orders ─────────────────────────────────────────────
    match /orders/{orderId} {
      allow read: if isSignedIn() && (
        request.auth.uid == resource.data.buyerId || 
        request.auth.uid == resource.data.sellerId
      );
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        request.auth.uid == resource.data.buyerId || 
        request.auth.uid == resource.data.sellerId
      );
      allow delete: if false;
    }
    
    // ── Reviews / Avis ─────────────────────────────────────
    // ⚠️ NOUVEAU — corrige l'erreur "Missing or insufficient permissions"
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
                               request.auth.uid == resource.data.fromUserId;
    }
    
    // ── Notifications ──────────────────────────────────────
    // Chemin plat : /notifications/{notifId}  (utilisé par le code app)
    match /notifications/{notifId} {
      allow read, update, delete: if isSignedIn() && 
                                     request.auth.uid == resource.data.userId;
      allow create: if isSignedIn();
    }
    // Chemin sous-collection (ancienne version, garde pour compat)
    match /notifications/{userId}/items/{notifId} {
      allow read, update, delete: if isSignedIn() && request.auth.uid == userId;
      allow create: if isSignedIn();
    }
    
    // ── Payments ───────────────────────────────────────────
    match /payments/{paymentId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
    
    // ── Reports ────────────────────────────────────────────
    match /reports/{reportId} {
      allow create: if isSignedIn();
      allow read, update, delete: if false;
    }
  }
}
```
