// 🎨 SikaKpɛ — Design System Global
// Utilise ces valeurs dans TOUS tes écrans pour une cohérence parfaite

export const theme = {
  // 🎨 Palette de couleurs professionnelle "Sécurité & Confiance"
  colors: {
    // Couleurs principales
    primary: '#1a365d',        // Bleu marine - autorité, confiance
    primaryLight: '#2c5282',   // Bleu moyen - hover/actif
    primaryDark: '#1a202c',    // Bleu très foncé - texte important
    
    // Couleurs d'état
    success: '#00aa55',        // Vert - validation, approuvé
    warning: '#dd6b20',        // Orange - attention, en attente
    error: '#c53030',          // Rouge - erreur, contesté
    info: '#3182ce',           // Bleu clair - information
    
    // Arrière-plans
    background: '#f7fafc',     // Fond principal (clair)
    backgroundDark: '#1a202c', // Fond pour mode sombre
    card: '#ffffff',           // Cartes, conteneurs
    cardHover: '#f8fafc',      // Hover sur cartes
    
    // Texte
    text: '#1a202c',           // Texte principal (noir doux)
    textSecondary: '#4a5568',  // Texte secondaire (gris)
    textInverse: '#ffffff',    // Texte sur fond foncé
    textMuted: '#718096',      // Texte désactivé/indice
    
    // Bordures & séparateurs
    border: '#e2e8f0',         // Bordures légères
    borderStrong: '#cbd5e0',   // Bordures plus visibles
    shadow: 'rgba(26, 54, 93, 0.1)', // Ombres douces
  },
  
  // 📐 Espacements (échelle 4px)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 🔤 Typographie
  typography: {
    fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // 🎴 Composants réutilisables
  components: {
    // Carte standard
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#1a365d',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: '#1a365d',
    },
    
    // Bouton principal
    buttonPrimary: {
      backgroundColor: '#1a365d',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 44, // Zone de touche accessible
    },
    buttonPrimaryText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Bouton secondaire
    buttonSecondary: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1a365d',
      minHeight: 44,
    },
    buttonSecondaryText: {
      color: '#1a365d',
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Badge de statut
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  },
  
  // 🎨 Helpers pour générer des styles dynamiques
  helpers: {
    // Couleur de badge selon le statut
    getBadgeStyle: (status) => {
      const base = theme.components.badge;
      const statusStyles = {
        pending: { backgroundColor: '#fef3c7', color: '#92400e' },
        approved: { backgroundColor: '#d1fae5', color: '#065f46' },
        rejected: { backgroundColor: '#fee2e2', color: '#991b1b' },
        active: { backgroundColor: '#dbeafe', color: '#1e40af' },
      };
      return { ...base, ...(statusStyles[status] || {}) };
    },
    
    // Ombre plus forte au hover (web uniquement)
    hoverShadow: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
  }
};

// 🎯 Export par défaut pour import facile
export default theme;
