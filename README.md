# Vertical To Horizontal

Extension Chrome pour transformer les vidéos verticales (TikTok, YouTube Shorts) en format horizontal avec Picture-in-Picture.

## 🚀 Installation

1. Téléchargez le code
2. Allez sur `chrome://extensions/`
3. Activez "Mode développeur"
4. Cliquez "Charger l'extension non empaquetée"
5. Sélectionnez le dossier de l'extension

## 🎯 Utilisation

### Raccourcis clavier (recommandé)

**Sur Mac** :
- **Cmd+Shift+R** (⌘⇧R) : Activer/Désactiver la rotation horizontale
- **Cmd+Shift+P** (⌘⇧P) : Activer/Désactiver le Picture-in-Picture

**Sur Windows/Linux** :
- **Ctrl+Shift+R** : Activer/Désactiver la rotation horizontale
- **Ctrl+Shift+P** : Activer/Désactiver le Picture-in-Picture

### Via le popup

1. Cliquez sur l'icône de l'extension
2. Cliquez "Activer Rotation" pour passer en mode horizontal
3. Cliquez "Activer PiP" pour ouvrir la fenêtre Picture-in-Picture

## 📋 Utilisation complète

1. **Aller sur TikTok ou YouTube Shorts**
2. **Activer la rotation** : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
3. **Activer le PiP** : Cmd+Shift+P (Mac) ou Ctrl+Shift+P (Windows)
4. **Profiter** de votre vidéo verticale tournée en horizontal !

## 🎮 Contrôles natifs dans le PiP

La fenêtre PiP propose des contrôles natifs :

- **▶️ Play / ⏸️ Pause** : Contrôle de la lecture
- **⏪ Reculer** : -10 secondes
- **⏩ Avancer** : +10 secondes

Ces contrôles apparaissent directement dans la fenêtre PiP et sur les touches média de votre clavier.

## 🔧 Comment ça marche

L'extension utilise un canvas HTML5 pour capturer chaque frame de la vidéo, applique une rotation de -90°, puis crée un stream vers une vidéo Picture-in-Picture.

## ⚠️ Limitations

- **Audio** : L'audio continue sur la page originale (pas dans le PiP)
- **Performance** : Utilise un peu de CPU (30 FPS canvas)
- **Sites supportés** : YouTube Shorts et TikTok uniquement

## 🆘 Dépannage

### L'extension ne fonctionne pas

1. Rechargez l'extension dans `chrome://extensions/` → ↻
2. Rechargez la page web (F5)
3. Ouvrez la console (F12) pour voir les logs

### Pas de vidéo dans le PiP

- Assurez-vous d'être sur TikTok ou YouTube Shorts
- Attendez que la vidéo soit chargée avant d'activer le PiP
- Vérifiez que la rotation est activée (Alt+R)

### Message "Rechargez la page"

- Appuyez sur F5 pour recharger la page
- Le content script doit être chargé pour fonctionner

## 📝 Version

**3.3.0** - Raccourcis clavier adaptés pour Mac (Cmd+Shift) et Windows (Ctrl+Shift)
